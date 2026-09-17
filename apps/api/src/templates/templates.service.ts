import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ThreatTemplate, UserSettings } from '@/database/entities';
import { ProfanityLevel } from '@/database/enums';

@Injectable()
export class TemplatesService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  list(userId: string) {
    return this.em
      .createQueryBuilder(ThreatTemplate, 't')
      .leftJoinAndSelect('t.character', 'character')
      .where('t.isSystem = true OR t.userId = :userId', { userId })
      .orderBy('t.isSystem', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .getMany();
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

  async pickForUser(userId: string) {
    const settings = await this.em.findOneBy(UserSettings, { userId });
    const level = settings?.profanityLevel ?? ProfanityLevel.UNFILTERED;
    const characterId = settings?.activeCharacterId ?? undefined;

    let qb = this.em
      .createQueryBuilder(ThreatTemplate, 't')
      .where('t.isActive = true')
      .andWhere('t.profanityLevel = :level', { level })
      .andWhere('(t.isSystem = true OR t.userId = :userId)', { userId });

    if (characterId) {
      qb = qb.andWhere('(t.characterId = :characterId OR t.characterId IS NULL)', {
        characterId,
      });
    }

    let pool = await qb.getMany();
    if (!pool.length) {
      pool = await this.em
        .createQueryBuilder(ThreatTemplate, 't')
        .where('t.isActive = true')
        .andWhere('(t.isSystem = true OR t.userId = :userId)', { userId })
        .getMany();
    }

    if (!pool.length) {
      return {
        text: 'Kalk o suyu iç lan artık! Böbreklerin çöl kumuna döndü kurumuşsun!',
        templateId: null as string | null,
        characterId: characterId ?? null,
      };
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    picked.playCount += 1;
    await this.em.save(picked);
    return {
      text: picked.text,
      templateId: picked.id,
      characterId: picked.characterId ?? characterId ?? null,
    };
  }
}
