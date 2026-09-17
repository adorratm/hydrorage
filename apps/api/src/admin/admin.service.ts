import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import {
  Character,
  Intake,
  ThreatEvent,
  User,
} from '@/database/entities';

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
}
