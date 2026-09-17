import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { IsOptional, IsString } from 'class-validator';
import {
  ThreatEvent,
  ThreatTemplate,
  User,
  UserSettings,
} from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { TemplatesService } from '@/templates/templates.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { fillTemplate, firstName } from '@/common/hydration';
import { RealtimeService } from '@/realtime/realtime.service';
import { ThreatsQueueService } from '@/queue/threats-queue.service';

class PreviewDto {
  @IsOptional()
  @IsString()
  templateId?: string;
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
  ) {
    const me = await this.em.findOneByOrFail(User, { id: user.userId });
    let text: string;
    let templateId: string | null = null;
    let characterId: string | null = null;

    if (dto.templateId) {
      const tpl = await this.em.findOneBy(ThreatTemplate, {
        id: dto.templateId,
      });
      text = tpl?.text ?? 'Kalk suyu iç!';
      templateId = tpl?.id ?? null;
      characterId = tpl?.characterId ?? null;
    } else {
      const picked = await this.templates.pickForUser(user.userId);
      text = picked.text;
      templateId = picked.templateId;
      characterId = picked.characterId;
    }

    return {
      message: fillTemplate(text, { name: firstName(me.displayName), debtMl: 500 }),
      templateId,
      characterId,
    };
  }

  @Post('schedule-next')
  async scheduleNext(@CurrentUser() user: { userId: string }) {
    const settings = await this.em.findOneBy(UserSettings, {
      userId: user.userId,
    });
    const interval = settings?.waterIntervalMinutes ?? 45;
    const scheduledAt = new Date(Date.now() + interval * 60_000);
    const me = await this.em.findOneByOrFail(User, { id: user.userId });
    const picked = await this.templates.pickForUser(user.userId);
    const message = fillTemplate(picked.text, {
      name: firstName(me.displayName),
      debtMl: 300,
    });
    const threat = await this.em.save(
      this.em.create(ThreatEvent, {
        userId: user.userId,
        templateId: picked.templateId,
        characterId: picked.characterId,
        message,
        status: ThreatStatus.PENDING,
        scheduledAt,
      }),
    );
    await this.threatsQueue.scheduleDue(threat);
    this.realtime.threatScheduled(user.userId, threat);
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
