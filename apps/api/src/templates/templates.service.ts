import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import type { AppLocale } from '@hydrorage/shared';
import { localizeCharacter } from '@hydrorage/shared';
import { Character, ThreatTemplate, UserSettings } from '@/database/entities';
import { ProfanityLevel } from '@/database/enums';
import { t, threatFallback } from '@/common/copy';

@Injectable()
export class TemplatesService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async list(userId: string, locale: AppLocale = 'tr') {
    const rows = await this.em
      .createQueryBuilder(ThreatTemplate, 't')
      .leftJoinAndSelect('t.character', 'character')
      .where('t.isSystem = true OR t.userId = :userId', { userId })
      .orderBy('t.isSystem', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .getMany();

    if (locale !== 'en') return rows;

    const settings = await this.em.findOne(UserSettings, {
      where: { userId },
      relations: { activeCharacter: true },
    });
    const plus18 = settings?.plus18Mode !== false;
    const defaultSlug = settings?.activeCharacter?.slug;

    return rows.map((row) => {
      const char = row.character
        ? {
            ...row.character,
            ...localizeCharacter(row.character.slug, locale, {
              name: row.character.name,
              description: row.character.description,
              badge: row.character.badge ?? '',
              dosageLabel: row.character.dosageLabel,
            }),
          }
        : row.character;
      if (!row.isSystem) {
        return char ? { ...row, character: char } : row;
      }
      return {
        ...row,
        text: threatFallback(
          plus18,
          locale,
          row.character?.slug ?? defaultSlug,
        ),
        character: char,
      };
    });
  }

  create(
    userId: string,
    data: {
      text: string;
      profanityLevel: ProfanityLevel;
      characterId?: string;
      isActive?: boolean;
    },
  ) {
    return this.em.save(
      this.em.create(ThreatTemplate, {
        userId,
        text: data.text,
        profanityLevel: data.profanityLevel,
        characterId: data.characterId ?? null,
        isActive: data.isActive ?? true,
        isSystem: false,
      }),
    );
  }

  async update(
    userId: string,
    id: string,
    data: {
      text?: string;
      profanityLevel?: ProfanityLevel;
      characterId?: string | null;
      isActive?: boolean;
    },
  ) {
    const tpl = await this.em.findOne(ThreatTemplate, {
      where: { id },
      relations: { character: true },
    });
    if (!tpl) throw new NotFoundException();
    if (tpl.isSystem || tpl.userId !== userId) {
      throw new ForbiddenException(
        'Sadece kendi şablonlarını düzenleyebilirsin',
      );
    }
    Object.assign(tpl, data);
    return this.em.save(tpl);
  }

  async remove(userId: string, id: string) {
    const tpl = await this.em.findOneBy(ThreatTemplate, { id });
    if (!tpl) throw new NotFoundException();
    if (tpl.isSystem || tpl.userId !== userId) {
      throw new ForbiddenException('Sadece kendi şablonlarını silebilirsin');
    }
    await this.em.remove(tpl);
    return { ok: true };
  }

  async pickForUser(userId: string, locale: AppLocale = 'tr') {
    const settings = await this.em.findOneBy(UserSettings, { userId });
    const plus18 = settings?.plus18Mode !== false;
    const level = plus18
      ? (settings?.profanityLevel ?? ProfanityLevel.UNFILTERED)
      : ProfanityLevel.SAFE;
    const characterId = settings?.activeCharacterId ?? undefined;

    let characterSlug: string | null = null;
    if (characterId) {
      const ch = await this.em.findOneBy(Character, { id: characterId });
      characterSlug = ch?.slug ?? null;
    }

    let qb = this.em
      .createQueryBuilder(ThreatTemplate, 't')
      .leftJoinAndSelect('t.character', 'character')
      .where('t.isActive = true')
      .andWhere('t.profanityLevel = :level', { level })
      .andWhere('(t.isSystem = true OR t.userId = :userId)', { userId });

    if (characterId) {
      qb = qb.andWhere(
        '(t.characterId = :characterId OR t.characterId IS NULL)',
        { characterId },
      );
    }

    let pool = await qb.getMany();

    if (!pool.length && !plus18) {
      pool = await this.em
        .createQueryBuilder(ThreatTemplate, 't')
        .leftJoinAndSelect('t.character', 'character')
        .where('t.isActive = true')
        .andWhere('t.profanityLevel = :level', { level: ProfanityLevel.SAFE })
        .andWhere('(t.isSystem = true OR t.userId = :userId)', { userId })
        .getMany();
    }

    if (!pool.length && plus18) {
      pool = await this.em
        .createQueryBuilder(ThreatTemplate, 't')
        .leftJoinAndSelect('t.character', 'character')
        .where('t.isActive = true')
        .andWhere('t.profanityLevel != :safe', { safe: ProfanityLevel.SAFE })
        .andWhere('(t.isSystem = true OR t.userId = :userId)', { userId })
        .getMany();
    }

    if (!pool.length) {
      return {
        text: threatFallback(plus18, locale, characterSlug),
        templateId: null as string | null,
        characterId: characterId ?? null,
      };
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    picked.playCount += 1;
    await this.em.save(picked);

    const slug = picked.character?.slug ?? characterSlug;
    // System templates are TR-only in DB — localize via shared samples for EN
    const text =
      locale === 'en' && picked.isSystem
        ? threatFallback(plus18, locale, slug)
        : picked.text;

    return {
      text,
      templateId: picked.id,
      characterId: picked.characterId ?? characterId ?? null,
    };
  }

  shortFallback(locale: AppLocale) {
    return t(locale, 'api.threat.shortFallback');
  }
}
