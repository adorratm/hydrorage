import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { AppLocale } from '@hydrorage/shared';
import {
  ThreatEvent,
  ThreatTemplate,
  User,
} from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { TemplatesService } from '@/templates/templates.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Locale } from '@/common/locale';
import { fillTemplate, firstNameLocalized } from '@/common/copy';
import { RealtimeService } from '@/realtime/realtime.service';
import { ThreatsQueueService } from '@/queue/threats-queue.service';

class PreviewDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsIn(['tr', 'en'])
  locale?: AppLocale;
}

class SnoozeDto {
  @IsInt()
  @Min(1)
  @Max(180)
  minutes!: number;
}

@Controller('threats')
@UseGuards(JwtAuthGuard)
export class ThreatsController {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly templates: TemplatesService,
    private readonly realtime: RealtimeService,
    private readonly threatsQueue: ThreatsQueueService,
  ) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.em.find(ThreatEvent, {
      where: { userId: user.userId, createdAt: MoreThanOrEqual(start) },
      order: { scheduledAt: 'DESC' },
      relations: { character: true, template: true },
    });
  }

  @Post('preview')
  async preview(
    @CurrentUser() user: { userId: string },
    @Body() dto: PreviewDto,
    @Locale() headerLocale: AppLocale,
  ) {
    const locale = dto.locale ?? headerLocale;
    const me = await this.em.findOneByOrFail(User, { id: user.userId });
    let text: string;
    let templateId: string | null = null;
    let characterId: string | null = null;
    let characterSlug: string | null = null;

    if (dto.templateId) {
      const tpl = await this.em.findOne(ThreatTemplate, {
        where: { id: dto.templateId },
        relations: { character: true },
      });
      if (!tpl) {
        text = this.templates.shortFallback(locale);
      } else if (tpl.isSystem && locale === 'en') {
        const picked = await this.templates.pickForUser(user.userId, locale);
        text = picked.text;
        templateId = tpl.id;
        characterId = tpl.characterId;
        characterSlug = tpl.character?.slug ?? picked.characterSlug ?? null;
      } else {
        text = tpl.text;
        templateId = tpl.id;
        characterId = tpl.characterId;
        characterSlug = tpl.character?.slug ?? null;
      }
    } else {
      const picked = await this.templates.pickForUser(user.userId, locale);
      text = picked.text;
      templateId = picked.templateId;
      characterId = picked.characterId;
      characterSlug = picked.characterSlug;
    }

    return {
      message: fillTemplate(text, {
        name: firstNameLocalized(me.displayName, locale),
        debtMl: 500,
      }),
      templateId,
      characterId,
      characterSlug,
    };
  }

  @Post('start')
  start(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
    return this.threatsQueue.startReminders(user.userId, locale);
  }

  @Post('stop')
  stop(@CurrentUser() user: { userId: string }) {
    return this.threatsQueue.stopReminders(user.userId);
  }

  @Post('schedule-next')
  scheduleNext(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
    return this.threatsQueue.startReminders(user.userId, locale);
  }

  @Post(':id/snooze')
  async snooze(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: SnoozeDto,
    @Locale() locale: AppLocale,
  ) {
    const threat = await this.em.findOneBy(ThreatEvent, { id });
    if (!threat) throw new NotFoundException();
    if (threat.userId !== user.userId) {
      throw new ForbiddenException();
    }
    if (
      threat.status !== ThreatStatus.PENDING &&
      threat.status !== ThreatStatus.PLAYED
    ) {
      throw new ForbiddenException(
        locale === 'en'
          ? 'This threat cannot be snoozed'
          : 'Bu tehdit ertelenemez',
      );
    }
    threat.scheduledAt = new Date(Date.now() + dto.minutes * 60_000);
    threat.status = ThreatStatus.PENDING;
    threat.playedAt = null;
    await this.em.save(threat);
    await this.threatsQueue.cancelDue(threat.id);
    await this.threatsQueue.scheduleDue(threat, locale);
    this.realtime.threatSnoozed(user.userId, threat);
    return threat;
  }

  @Post(':id/played')
  async markPlayed(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    await this.em
      .createQueryBuilder()
      .update(ThreatEvent)
      .set({ status: ThreatStatus.PLAYED, playedAt: new Date() })
      .where('id = :id AND userId = :userId', { id, userId: user.userId })
      .execute();
    this.realtime.threatPlayed(user.userId, { id });
    return { ok: true };
  }
}
