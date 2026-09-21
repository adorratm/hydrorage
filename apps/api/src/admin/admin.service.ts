import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import {
  Character,
  Intake,
  RoutineLog,
  ThreatEvent,
  User,
  UserSettings,
} from '@/database/entities';

export type ActivityType = 'intake' | 'threat' | 'routine';

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    provider: u.provider,
    streakDays: u.streakDays,
    dailyGoalMl: u.dailyGoalMl,
    createdAt: u.createdAt,
    avatarUrl: u.avatarUrl,
  };
}

@Injectable()
export class AdminService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async overview() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [userCount, intakeCount, threatCount, recentUsers, characters] =
      await Promise.all([
        this.em.count(User),
        this.em.count(Intake, {
          where: { createdAt: MoreThanOrEqual(since) },
        }),
        this.em.count(ThreatEvent, {
          where: { createdAt: MoreThanOrEqual(since) },
        }),
        this.em.find(User, {
          order: { createdAt: 'DESC' },
          take: 12,
        }),
        this.em.find(Character, { order: { name: 'ASC' } }),
      ]);

    return {
      userCount,
      intakeLast7d: intakeCount,
      threatsLast7d: threatCount,
      recentUsers: recentUsers.map(publicUser),
      characters,
    };
  }

  async listUsers(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const users = await this.em.find(User, {
      order: { createdAt: 'DESC' },
      take,
    });
    return users.map(publicUser);
  }

  async getUser(id: string) {
    const user = await this.em.findOneBy(User, { id });
    if (!user) throw new NotFoundException('User not found');

    const settings = await this.em.findOne(UserSettings, {
      where: { userId: id },
      relations: { activeCharacter: true },
    });

    return {
      ...publicUser(user),
      lastGoalDate: user.lastGoalDate,
      plus18Mode: settings?.plus18Mode ?? true,
      onboardingCompleted: settings?.onboardingCompleted ?? false,
      voiceNotifications: settings?.voiceNotifications ?? true,
      activeCharacter: settings?.activeCharacter
        ? {
            id: settings.activeCharacter.id,
            name: settings.activeCharacter.name,
            slug: settings.activeCharacter.slug,
          }
        : null,
    };
  }

  async userActivity(
    userId: string,
    opts: { limit?: number; offset?: number; type?: string },
  ) {
    const user = await this.em.findOneBy(User, { id: userId });
    if (!user) throw new NotFoundException('User not found');

    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const offset = Math.max(opts.offset ?? 0, 0);
    const typeFilter = opts.type as ActivityType | undefined;
    const fetchN = offset + limit;

    const items: Array<{
      id: string;
      type: ActivityType;
      summary: string;
      detail: string | null;
      amountMl: number | null;
      status: string | null;
      at: string;
    }> = [];

    const want = (t: ActivityType) => !typeFilter || typeFilter === t;

    if (want('intake')) {
      const intakes = await this.em.find(Intake, {
        where: { userId },
        order: { createdAt: 'DESC' },
        take: fetchN,
      });
      for (const i of intakes) {
        items.push({
          id: i.id,
          type: 'intake',
          summary: i.label,
          detail: i.type,
          amountMl: i.netMl,
          status: null,
          at: i.createdAt.toISOString(),
        });
      }
    }

    if (want('threat')) {
      const threats = await this.em.find(ThreatEvent, {
        where: { userId },
        relations: { character: true },
        order: { scheduledAt: 'DESC' },
        take: fetchN,
      });
      for (const t of threats) {
        items.push({
          id: t.id,
          type: 'threat',
          summary: t.message.slice(0, 120),
          detail: t.character?.name ?? null,
          amountMl: null,
          status: t.status,
          at: (t.scheduledAt ?? t.createdAt).toISOString(),
        });
      }
    }

    if (want('routine')) {
      const logs = await this.em.find(RoutineLog, {
        where: { userId },
        relations: { routine: true },
        order: { createdAt: 'DESC' },
        take: fetchN,
      });
      for (const r of logs) {
        items.push({
          id: r.id,
          type: 'routine',
          summary: r.routine?.title ?? 'Routine',
          detail: r.routine?.drinkType ?? null,
          amountMl: r.routine?.amountMl ?? null,
          status: r.status,
          at: (r.completedAt ?? r.plannedAt ?? r.createdAt).toISOString(),
        });
      }
    }

    items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    const page = items.slice(offset, offset + limit);

    return {
      items: page,
      total: items.length,
      limit,
      offset,
    };
  }
}
