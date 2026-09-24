import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { DrinkType, ThreatStatus } from '@/database/enums';
import { Intake, ThreatEvent, User } from '@/database/entities';
import { computeNetMl } from '@/common/hydration';
import { RealtimeService } from '@/realtime/realtime.service';
import { ThreatsQueueService } from '@/queue/threats-queue.service';

@Injectable()
export class IntakeService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly realtime: RealtimeService,
    private readonly threatsQueue: ThreatsQueueService,
  ) {}

  async create(
    userId: string,
    data: {
      type: DrinkType;
      label: string;
      amountMl: number;
      note?: string;
    },
  ) {
    const computed = computeNetMl(data.type, data.amountMl);
    const intake = await this.em.save(
      this.em.create(Intake, {
        userId,
        type: data.type,
        label: data.label,
        amountMl: data.amountMl,
        penaltyMl: computed.penaltyMl,
        netMl: computed.netMl,
        note: data.note ?? null,
      }),
    );

    if (computed.netMl > 0) {
      await this.completeDueThreats(userId);
      await this.threatsQueue.rescheduleAfterIntake(userId);
    }

    await this.updateStreak(userId);
    this.realtime.intakeCreated(userId, intake);
    return intake;
  }

  async update(
    userId: string,
    id: string,
    data: {
      type?: DrinkType;
      label?: string;
      amountMl?: number;
      note?: string;
    },
  ) {
    const intake = await this.em.findOneBy(Intake, { id });
    if (!intake) throw new NotFoundException();
    if (intake.userId !== userId) {
      throw new ForbiddenException('Bu kaydı düzenleyemezsin');
    }
    if (data.type !== undefined) intake.type = data.type;
    if (data.label !== undefined) intake.label = data.label;
    if (data.amountMl !== undefined) intake.amountMl = data.amountMl;
    if (data.note !== undefined) intake.note = data.note;
    const computed = computeNetMl(intake.type, intake.amountMl);
    intake.penaltyMl = computed.penaltyMl;
    intake.netMl = computed.netMl;
    const saved = await this.em.save(intake);
    await this.updateStreak(userId);
    this.realtime.intakeUpdated(userId, saved);
    return saved;
  }

  async remove(userId: string, id: string) {
    const intake = await this.em.findOneBy(Intake, { id });
    if (!intake) throw new NotFoundException();
    if (intake.userId !== userId) {
      throw new ForbiddenException('Bu kaydı silemezsin');
    }
    await this.em.remove(intake);
    await this.updateStreak(userId);
    this.realtime.intakeDeleted(userId, { id });
    return { ok: true };
  }

  async listToday(userId: string, type?: DrinkType) {
    const start = startOfDay(new Date());
    return this.em.find(Intake, {
      where: {
        userId,
        createdAt: MoreThanOrEqual(start),
        ...(type ? { type } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async summaryToday(userId: string) {
    const intakes = await this.listToday(userId);
    const grossMl = intakes.reduce((s, i) => s + i.amountMl, 0);
    const pureWaterMl = intakes
      .filter((i) =>
        [
          DrinkType.WATER,
          DrinkType.BOTTLE,
          DrinkType.MINERAL,
          DrinkType.ELECTROLYTE,
        ].includes(i.type),
      )
      .reduce((s, i) => s + i.amountMl, 0);
    const penaltyMl = intakes.reduce((s, i) => s + i.penaltyMl, 0);
    const netMl = intakes.reduce((s, i) => s + i.netMl, 0);
    return { intakes, grossMl, pureWaterMl, penaltyMl, netMl };
  }

  private async completeDueThreats(userId: string) {
    const due = await this.em.find(ThreatEvent, {
      where: [
        { userId, status: ThreatStatus.PENDING },
        { userId, status: ThreatStatus.PLAYED },
      ],
    });
    const now = new Date();
    for (const threat of due) {
      if (threat.scheduledAt > now) continue;
      threat.status = ThreatStatus.COMPLETED;
      await this.em.save(threat);
      await this.threatsQueue.cancelDue(threat.id);
      this.realtime.threatCompleted(userId, threat);
    }
  }

  private async updateStreak(userId: string) {
    const user = await this.em.findOneByOrFail(User, { id: userId });
    const { netMl } = await this.summaryToday(userId);
    const today = startOfDay(new Date());
    if (netMl >= user.dailyGoalMl) {
      const last = user.lastGoalDate ? startOfDay(user.lastGoalDate) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let streakDays = user.streakDays;
      if (!last) streakDays = 1;
      else if (last.getTime() === today.getTime()) {
        // already counted
      } else if (last.getTime() === yesterday.getTime()) {
        streakDays += 1;
      } else {
        streakDays = 1;
      }
      user.streakDays = streakDays;
      user.lastGoalDate = today;
      await this.em.save(user);
    }
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
