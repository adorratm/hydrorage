import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Queue, Worker, Job } from 'bullmq';
import { EntityManager, MoreThan } from 'typeorm';
import type Redis from 'ioredis';
import { stripYametePhrase, t, type AppLocale } from '@hydrorage/shared';
import { ThreatEvent, User, UserSettings } from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { RealtimeService } from '@/realtime/realtime.service';
import { PushService } from '@/push/push.service';
import { TemplatesService } from '@/templates/templates.service';
import { fillTemplate, firstNameLocalized } from '@/common/copy';
import { QUEUE_TOKENS, REDIS, THREATS_QUEUE } from '@/redis/redis.tokens';
import { ThreatDueJob } from '@/queue/queue.types';

const NAG_MINUTES = 5;
const NAG_LIMIT = 12;
const COMEBACK_IDLE_MS = 2 * 24 * 60 * 60 * 1000;
const COMEBACK_GAP_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_PUSH_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class ThreatsQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(ThreatsQueueService.name);
  private worker: Worker<ThreatDueJob> | null = null;

  constructor(
    @Inject(QUEUE_TOKENS.THREATS) private readonly queue: Queue<ThreatDueJob>,
    @Inject(REDIS) private readonly redis: Redis,
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly realtime: RealtimeService,
    private readonly push: PushService,
    private readonly templates: TemplatesService,
  ) {}

  startWorker() {
    if (this.worker) return;
    this.worker = new Worker<ThreatDueJob>(
      THREATS_QUEUE,
      async (job) => this.handleDue(job),
      { connection: this.redis.duplicate() },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(`threat job ${job?.id} failed: ${err.message}`);
    });
  }

  async scheduleDue(
    threat: { id: string; userId: string; scheduledAt: Date },
    locale: AppLocale = 'tr',
  ) {
    const delay = Math.max(0, threat.scheduledAt.getTime() - Date.now());
    await this.queue.add(
      'threat-due',
      { threatId: threat.id, userId: threat.userId, locale },
      {
        jobId: `threat-due-${threat.id}`,
        delay,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }

  async cancelDue(threatId: string) {
    const job = await this.queue.getJob(`threat-due-${threatId}`);
    if (job) await job.remove();
  }

  async startReminders(userId: string, locale: AppLocale) {
    const settings = await this.ensureSettings(userId);
    settings.remindersEnabled = true;
    settings.nagCount = 0;
    settings.locale = locale;
    await this.em.save(settings);
    await this.clearPending(userId);
    return this.enqueueNext(userId, settings.waterIntervalMinutes ?? 45, locale);
  }

  async stopReminders(userId: string) {
    const settings = await this.ensureSettings(userId);
    settings.remindersEnabled = false;
    settings.nagCount = 0;
    await this.em.save(settings);
    await this.clearPending(userId);
    return { ok: true };
  }

  /** Su girilince hızlı zincir biter, sonraki bildirim normal aralıktadır. */
  async rescheduleAfterIntake(userId: string) {
    const settings = await this.em.findOneBy(UserSettings, { userId });
    if (!settings?.remindersEnabled) return;
    settings.nagCount = 0;
    await this.em.save(settings);
    await this.clearPending(userId);
    const locale = this.localeOf(settings);
    await this.enqueueNext(userId, settings.waterIntervalMinutes ?? 45, locale);
  }

  async rewritePendingMessages(userId: string, locale: AppLocale) {
    const settings = await this.ensureSettings(userId);
    settings.locale = locale;
    await this.em.save(settings);
    const pending = await this.em.find(ThreatEvent, {
      where: { userId, status: ThreatStatus.PENDING },
    });
    const me = await this.em.findOneBy(User, { id: userId });
    if (!me) return;
    for (const threat of pending) {
      const picked = await this.templates.pickForUser(userId, locale);
      threat.message = fillTemplate(picked.text, {
        name: firstNameLocalized(me.displayName, locale),
        debtMl: 300,
      });
      threat.templateId = picked.templateId;
      threat.characterId = picked.characterId;
      await this.em.save(threat);
      await this.cancelDue(threat.id);
      await this.scheduleDue(threat, locale);
    }
  }

  async sweepComebacks() {
    const now = Date.now();
    const idleBefore = new Date(now - COMEBACK_IDLE_MS);
    const comebackBefore = new Date(now - COMEBACK_GAP_MS);
    const users = await this.em
      .createQueryBuilder(User, 'u')
      .where('u."expoPushToken" IS NOT NULL')
      .andWhere(
        'COALESCE(u."lastAppOpenedAt", u."createdAt") < :idleBefore',
        { idleBefore },
      )
      .andWhere(
        '(u."lastComebackAt" IS NULL OR u."lastComebackAt" < :comebackBefore)',
        { comebackBefore },
      )
      .take(40)
      .getMany();

    const recentAfter = new Date(now - RECENT_PUSH_MS);
    for (const user of users) {
      const recent = await this.em.findOne(ThreatEvent, {
        where: {
          userId: user.id,
          playedAt: MoreThan(recentAfter),
        },
      });
      if (recent) continue;

      const settings = await this.em.findOne(UserSettings, {
        where: { userId: user.id },
        relations: { activeCharacter: true },
      });
      const locale = this.localeOf(settings);
      const plus18 = settings?.plus18Mode !== false;
      const picked = await this.templates.pickForUser(user.id, locale);
      const message = fillTemplate(picked.text, {
        name: firstNameLocalized(user.displayName, locale),
        debtMl: 300,
      });
      const sent = await this.push.sendToUser(user.id, {
        title: t(
          locale,
          plus18 ? 'tone.notifTitlePlus18' : 'tone.notifTitleSafe',
        ),
        body: stripYametePhrase(message),
        data: {
          type: 'comeback',
          locale,
          characterSlug: settings?.activeCharacter?.slug ?? undefined,
          yameteSound: message.includes('やめて'),
        },
      });
      if (!sent.sent) continue;
      user.lastComebackAt = new Date();
      await this.em.save(user);
    }
  }

  private async handleDue(job: Job<ThreatDueJob>) {
    const threat = await this.em.findOne(ThreatEvent, {
      where: { id: job.data.threatId },
      relations: { character: true, template: true },
    });
    if (!threat || threat.status !== ThreatStatus.PENDING) return;

    threat.status = ThreatStatus.PLAYED;
    threat.playedAt = new Date();
    await this.em.save(threat);
    await this.em
      .createQueryBuilder()
      .update(ThreatEvent)
      .set({ status: ThreatStatus.MISSED })
      .where('userId = :userId AND status = :played AND id != :id', {
        userId: threat.userId,
        played: ThreatStatus.PLAYED,
        id: threat.id,
      })
      .execute();
    this.realtime.threatDue(threat.userId, threat);

    const settings = await this.em.findOne(UserSettings, {
      where: { userId: threat.userId },
      relations: { activeCharacter: true },
    });
    const plus18 = settings?.plus18Mode !== false;
    const locale = this.localeOf(settings, job.data.locale);
    const characterSlug =
      threat.character?.slug ?? settings?.activeCharacter?.slug ?? undefined;
    await this.push.sendToUser(threat.userId, {
      title: t(
        locale,
        plus18 ? 'tone.notifTitlePlus18' : 'tone.notifTitleSafe',
      ),
      body: stripYametePhrase(threat.message),
      data: {
        threatId: threat.id,
        type: 'threat-due',
        locale,
        characterSlug,
        yameteSound: threat.message.includes('やめて'),
      },
    });

    if (!settings?.remindersEnabled) return;

    settings.nagCount = (settings.nagCount ?? 0) + 1;
    const nagging = settings.nagCount <= NAG_LIMIT;
    const minutes = nagging
      ? NAG_MINUTES
      : (settings.waterIntervalMinutes ?? 45);
    if (!nagging) settings.nagCount = 0;
    await this.em.save(settings);
    await this.enqueueNext(threat.userId, minutes, locale);
  }

  private async enqueueNext(
    userId: string,
    minutes: number,
    locale: AppLocale,
  ) {
    const me = await this.em.findOneByOrFail(User, { id: userId });
    const settings = await this.em.findOneBy(UserSettings, { userId });
    const picked = await this.templates.pickForUser(userId, locale);
    const message = fillTemplate(picked.text, {
      name: firstNameLocalized(me.displayName, locale),
      debtMl: 300,
    });
    const scheduledAt = new Date(Date.now() + Math.max(1, minutes) * 60_000);
    const threat = await this.em.save(
      this.em.create(ThreatEvent, {
        userId,
        templateId: picked.templateId,
        characterId: picked.characterId ?? settings?.activeCharacterId ?? null,
        message,
        status: ThreatStatus.PENDING,
        scheduledAt,
      }),
    );
    await this.scheduleDue(threat, locale);
    this.realtime.threatScheduled(userId, threat);
    return threat;
  }

  private async clearPending(userId: string) {
    const pending = await this.em.find(ThreatEvent, {
      where: { userId, status: ThreatStatus.PENDING },
    });
    for (const threat of pending) {
      await this.cancelDue(threat.id);
      await this.em.remove(threat);
    }
  }

  private async ensureSettings(userId: string) {
    let settings = await this.em.findOneBy(UserSettings, { userId });
    if (!settings) {
      settings = await this.em.save(
        this.em.create(UserSettings, { userId }),
      );
    }
    return settings;
  }

  private localeOf(
    settings: UserSettings | null | undefined,
    fallback?: string,
  ): AppLocale {
    const raw = settings?.locale || fallback;
    return raw === 'en' ? 'en' : 'tr';
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
