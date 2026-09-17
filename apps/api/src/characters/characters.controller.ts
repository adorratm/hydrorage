import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Character } from '@/database/entities';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  @Get()
  async list() {
    const characters = await this.em.find(Character, {
      order: { name: 'ASC' },
    });
    return characters.map((c) => ({
      ...c,
      unlocked: true,
    }));
  }
}
