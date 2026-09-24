import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { t, type AppLocale } from '@hydrorage/shared';
import {
  Character,
  Intake,
  RefreshToken,
  ThreatEvent,
  User,
  UserSettings,
} from '@/database/entities';

@Injectable()
export class UsersService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async findById(id: string) {
    const user = await this.em.findOne(User, {
      where: { id },
      relations: { settings: true },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async update(
    id: string,
    data: { displayName?: string; dailyGoalMl?: number },
  ) {
    const user = await this.em.findOneBy(User, { id });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.dailyGoalMl !== undefined) user.dailyGoalMl = data.dailyGoalMl;
    const saved = await this.em.save(user);
    return {
      id: saved.id,
      email: saved.email,
      displayName: saved.displayName,
      dailyGoalMl: saved.dailyGoalMl,
      streakDays: saved.streakDays,
    };
  }

  async markOpened(userId: string) {
    await this.em.update(User, { id: userId }, { lastAppOpenedAt: new Date() });
    return { ok: true };
  }

  async setPushToken(userId: string, token: string | null) {
    const user = await this.em.findOneBy(User, { id: userId });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    user.expoPushToken = token;
    await this.em.save(user);
    return { ok: true };
  }

  async exportData(userId: string) {
    const user = await this.findById(userId);
    const [intakes, threats, settings] = await Promise.all([
      this.em.find(Intake, {
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 5000,
      }),
      this.em.find(ThreatEvent, {
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 2000,
      }),
      this.em.findOneBy(UserSettings, { userId }),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        dailyGoalMl: user.dailyGoalMl,
        streakDays: user.streakDays,
        createdAt: user.createdAt,
      },
      settings,
      intakes,
      threats,
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.em.findOneBy(User, { id: userId });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    await this.em.delete(RefreshToken, { userId });
    await this.em.remove(user);
    return { ok: true };
  }

  async assertCharacterUnlocked(
    userId: string,
    characterId: string,
    locale: AppLocale = 'tr',
  ) {
    const [user, character] = await Promise.all([
      this.em.findOneBy(User, { id: userId }),
      this.em.findOneBy(Character, { id: characterId }),
    ]);
    if (!character) {
      throw new NotFoundException(t(locale, 'api.char.notFound'));
    }
    if (!user) {
      throw new NotFoundException(t(locale, 'api.user.notFound'));
    }
  }
}

export function assertPositiveGoal(ml: number, locale: AppLocale = 'tr') {
  if (ml < 500) {
    throw new BadRequestException(
      locale === 'en'
        ? 'Goal must be at least 500 ml'
        : 'Hedef en az 500 ml olmalı',
    );
  }
}
