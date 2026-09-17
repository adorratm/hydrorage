import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { UserSettings } from '@/database/entities';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { UpdateSettingsDto } from '@/settings/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  @Get()
  async get(@CurrentUser() user: { userId: string }) {
    let settings = await this.em.findOne(UserSettings, {
      where: { userId: user.userId },
      relations: { activeCharacter: true },
    });
    if (!settings) {
      settings = await this.em.save(
        this.em.create(UserSettings, { userId: user.userId }),
      );
      settings = await this.em.findOneOrFail(UserSettings, {
        where: { id: settings.id },
        relations: { activeCharacter: true },
      });
    }
    return settings;
  }

  @Patch()
  async update(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    let settings = await this.em.findOne(UserSettings, {
      where: { userId: user.userId },
    });
    if (!settings) {
      settings = this.em.create(UserSettings, {
        userId: user.userId,
        ...dto,
      });
    } else {
      Object.assign(settings, dto);
    }
    await this.em.save(settings);
    return this.em.findOneOrFail(UserSettings, {
      where: { userId: user.userId },
      relations: { activeCharacter: true },
    });
  }
}
