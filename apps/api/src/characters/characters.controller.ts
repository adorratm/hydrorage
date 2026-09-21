import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { localizeCharacter, type AppLocale } from '@hydrorage/shared';
import { Character, User } from '@/database/entities';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { Locale } from '@/common/locale';

@Controller('characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  @Get()
  async list(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
    const [characters, me] = await Promise.all([
      this.em.find(Character, { order: { unlockStreakDays: 'ASC', name: 'ASC' } }),
      this.em.findOneBy(User, { id: user.userId }),
    ]);
    const streak = me?.streakDays ?? 0;
    return characters.map((c) => {
      const meta = localizeCharacter(c.slug, locale, {
        name: c.name,
        description: c.description,
        badge: c.badge ?? '',
        dosageLabel: c.dosageLabel,
      });
      return {
        ...c,
        name: meta.name,
        description: meta.description,
        badge: meta.badge || c.badge,
        dosageLabel: meta.dosageLabel || c.dosageLabel,
        unlocked: streak >= c.unlockStreakDays,
        unlockStreakDays: c.unlockStreakDays,
        userStreakDays: streak,
      };
    });
  }
}
