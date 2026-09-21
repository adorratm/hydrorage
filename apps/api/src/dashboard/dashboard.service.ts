import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import type { AppLocale } from '@hydrorage/shared';
import { Intake, ThreatEvent, User } from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { IntakeService } from '@/intake/intake.service';
import { statusLabelFor } from '@/common/copy';

const MILESTONES = [7, 14, 30, 100] as const;

@Injectable()
export class DashboardService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly intake: IntakeService,
  ) {}

  async today(userId: string, locale: AppLocale = 'tr') {
    const user = await this.em.findOneByOrFail(User, { id: userId });
    const summary = await this.intake.summaryToday(userId);
    const goal = user.dailyGoalMl;
    const percent = Math.min(
      100,
      Math.round((Math.max(0, summary.netMl) / goal) * 100),
    );
    const remaining = Math.max(0, goal - Math.max(0, summary.netMl));

    const start = startOfDay(new Date());
    const threats = await this.em.find(ThreatEvent, {
      where: { userId, createdAt: MoreThanOrEqual(start) },
      relations: { character: true },
      order: { scheduledAt: 'DESC' },
      take: 10,
    });

    const nextThreat = await this.em
      .createQueryBuilder(ThreatEvent, 't')
      .leftJoinAndSelect('t.character', 'character')
      .where('t.userId = :userId', { userId })
      .andWhere('t.status = :status', { status: ThreatStatus.PENDING })
      .andWhere('t.scheduledAt >= :now', { now: new Date() })
      .orderBy('t.scheduledAt', 'ASC')
      .getOne();

    const scoldCount = threats.filter((t) =>
      [ThreatStatus.PLAYED, ThreatStatus.MISSED, ThreatStatus.COMPLETED].includes(
        t.status,
      ),
    ).length;
    const missedGlasses = threats.filter(
      (t) => t.status === ThreatStatus.MISSED,
    ).length;
    const glasses = summary.intakes.filter((i) => i.netMl > 0).length;

    const hoursLeft = Math.max(1, 22 - new Date().getHours());
    const optimalPerHour = Math.round(remaining / hoursLeft);
    const statusLabel = statusLabelFor(percent, locale);

    return {
      goalMl: goal,
      netMl: Math.max(0, summary.netMl),
      grossMl: summary.grossMl,
      pureWaterMl: summary.pureWaterMl,
      penaltyMl: summary.penaltyMl,
      percent,
      remaining,
      optimalPerHour,
      statusLabel,
      streakDays: user.streakDays,
      scoldCount,
      glasses,
      missedGlasses,
      nextThreat,
      recentThreats: threats,
      intakes: summary.intakes,
    };
  }

  async streak(userId: string) {
    const user = await this.em.findOneByOrFail(User, { id: userId });
    const summary = await this.intake.summaryToday(userId);
    const goal = user.dailyGoalMl;
    const todayNet = Math.max(0, summary.netMl);

    const since = startOfDay(new Date());
    since.setDate(since.getDate() - 29);

    const intakes = await this.em.find(Intake, {
      where: { userId, createdAt: MoreThanOrEqual(since) },
      order: { createdAt: 'ASC' },
    });

    const byDay = new Map<string, number>();
    for (const i of intakes) {
      const key = dayKey(i.createdAt);
      byDay.set(key, (byDay.get(key) ?? 0) + i.netMl);
    }

    const recentDays: Array<{ date: string; netMl: number; goalMet: boolean }> =
      [];
    for (let d = 29; d >= 0; d--) {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() - d);
      const key = dayKey(day);
      const netMl = Math.max(0, byDay.get(key) ?? 0);
      recentDays.push({
        date: key,
        netMl,
        goalMet: netMl >= goal,
      });
    }

    const streakDays = user.streakDays;
    const milestones = MILESTONES.map((days) => ({
      days,
      reached: streakDays >= days,
    }));

    return {
      streakDays,
      lastGoalDate: user.lastGoalDate,
      todayNetMl: todayNet,
      dailyGoalMl: goal,
      percent: Math.min(100, Math.round((todayNet / goal) * 100)),
      milestones,
      recentDays,
    };
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
