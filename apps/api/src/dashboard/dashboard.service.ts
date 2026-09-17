import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { ThreatEvent, User } from '@/database/entities';
import { ThreatStatus } from '@/database/enums';
import { IntakeService } from '@/intake/intake.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly intake: IntakeService,
  ) {}

  async today(userId: string) {
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

    let statusLabel = 'İDARE EDER DURUM';
    if (percent >= 100) statusLabel = 'HEDEF KİLİTLENDİ';
    else if (percent < 40) statusLabel = 'RAGE DURUMU';
    else if (percent < 70) statusLabel = 'İDARE EDER DURUM';
    else statusLabel = 'İYİ TEMPO';

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
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
