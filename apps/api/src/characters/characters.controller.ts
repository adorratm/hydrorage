import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Character, User } from '@/database/entities';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  @Get()
  async list(@CurrentUser() user: { userId: string }) {
    const me = await this.em.findOneByOrFail(User, { id: user.userId });
    const characters = await this.em.find(Character, {
      order: { name: 'ASC' },
    });
    return characters.map((c) => ({
      ...c,
      unlocked: me.streakDays >= c.unlockStreakDays,
    }));
  }
}
