import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { User } from '@/database/entities';

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
}
