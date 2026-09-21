import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { localizeCharacter, type AppLocale } from '@hydrorage/shared';
import { UserSettings } from '@/database/entities';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { UpdateSettingsDto } from '@/settings/settings.dto';
import { UsersService } from '@/users/users.service';
import { Locale } from '@/common/locale';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly users: UsersService,
  ) {}

  private localizeSettings(settings: UserSettings, locale: AppLocale) {
    if (!settings.activeCharacter) return settings;
    const meta = localizeCharacter(settings.activeCharacter.slug, locale, {
      name: settings.activeCharacter.name,
      description: settings.activeCharacter.description,
      badge: settings.activeCharacter.badge ?? '',
      dosageLabel: settings.activeCharacter.dosageLabel,
    });
    return {
      ...settings,
      activeCharacter: {
        ...settings.activeCharacter,
        name: meta.name,
        description: meta.description,
        badge: meta.badge || settings.activeCharacter.badge,
        dosageLabel: meta.dosageLabel || settings.activeCharacter.dosageLabel,
      },
    };
  }

  @Get()
  async get(
    @CurrentUser() user: { userId: string },
    @Locale() locale: AppLocale,
  ) {
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
    return this.localizeSettings(settings, locale);
  }

  @Patch()
  async update(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateSettingsDto,
    @Locale() locale: AppLocale,
  ) {
    if (dto.activeCharacterId) {
      await this.users.assertCharacterUnlocked(
        user.userId,
        dto.activeCharacterId,
        locale,
      );
    }
    if (
      dto.whisperVolume !== undefined &&
      (dto.whisperVolume < 0 || dto.whisperVolume > 100)
    ) {
      throw new BadRequestException(
        locale === 'en'
          ? 'whisperVolume must be 0-100'
          : 'whisperVolume 0-100 olmalı',
      );
    }

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
    const full = await this.em.findOneOrFail(UserSettings, {
      where: { userId: user.userId },
      relations: { activeCharacter: true },
    });
    return this.localizeSettings(full, locale);
  }
}
