import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Queue, Worker, Job } from 'bullmq';
import { And, EntityManager, LessThan, MoreThanOrEqual } from 'typeorm';
import type Redis from 'ioredis';
import {
  RoutineLog,
  ThreatEvent,
  User,
} from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { TemplatesService } from '@/templates/templates.service';
import { RealtimeService } from '@/realtime/realtime.service';
import { fillTemplate } from '@/common/hydration';
import { QUEUE_TOKENS, REDIS, ROUTINES_QUEUE } from '@/redis/redis.tokens';
import { RoutineSweepJob } from '@/queue/queue.types';

@Injectable()
export class RoutinesQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(RoutinesQueueService.name);
  private worker: Worker<RoutineSweepJob> | null = null;

  constructor(
    @Inject(QUEUE_TOKENS.ROUTINES) private readonly queue: Queue<RoutineSweepJob>,
    @Inject(REDIS) private readonly redis: Redis,
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly templates: TemplatesService,
    private readonly realtime: RealtimeService,
  ) {}

  async startWorker() {
    if (this.worker) return;
    this.worker = new Worker<RoutineSweepJob>(
      ROUTINES_QUEUE,
      async (job) => this.handleSweep(job),
      { connection: this.redis.duplicate() },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(`routine job ${job?.id} failed: ${err.message}`);
    });

    await this.queue.upsertJobScheduler(
      'routines-sweep',
      { every: 60_000 },
      {
        name: 'sweep',
        data: { reason: 'interval' },
        opts: {
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      },
    );
  }

  private async handleSweep(_job: Job<RoutineSweepJob>) {
    const start = startOfDay(new Date());
    const due = await this.em.find(RoutineLog, {
      where: {
        status: ThreatStatus.PENDING,
        plannedAt: And(MoreThanOrEqual(start), LessThan(new Date())),
      },
      relations: { routine: true },
      take: 200,
    });

    for (const log of due) {
      log.status = ThreatStatus.MISSED;
      await this.em.save(log);

      const picked = await this.templates.pickForUser(log.userId);
      const user = await this.em.findOneByOrFail(User, { id: log.userId });
      const threat = await this.em.save(
        this.em.create(ThreatEvent, {
          userId: log.userId,
          templateId: picked.templateId,
          characterId: picked.characterId,
          message: fillTemplate(picked.text, {
            name: user.displayName,
            debtMl: log.routine?.amountMl ?? 300,
          }),
          status: ThreatStatus.MISSED,
          scheduledAt: log.plannedAt,
          playedAt: new Date(),
        }),
      );

      this.realtime.routineMissed(log.userId, { log, threat });
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
