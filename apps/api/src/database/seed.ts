import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createId } from '@paralleldrive/cuid2';
import { DEFAULT_LANDING_CONTENT } from '@hydrorage/shared';
import {
  Character,
  LandingPage,
  ThreatTemplate,
  entities,
} from './entities';
import { ProfanityLevel } from './enums';
import { LANDING_PAGE_ID } from '../landing/landing.service';

async function main() {
  const url =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    'postgresql://hydrorage:hydrorage@localhost:5434/hydrorage';

  const ds = new DataSource({
    type: 'postgres',
    url,
    entities,
    synchronize: false,
  });
  await ds.initialize();
  const em = ds.manager;

  const characters = [
    {
      slug: 'ofkeli-mahalle-abisi',
      name: 'Öfkeli Mahalle Abisi v2.4',
      description:
        "14:00'e kadar su içmezsen mahalle hoparlöründen küfürle bağırır. Filtresiz.",
      badge: 'FİLTRESİZ 🔥',
      maxDb: 98,
      dosageLabel: 'Ölümcül',
      recordingCount: 42,
      unlockStreakDays: 0,
    },
    {
      slug: 'agresif-fitness-kocu',
      name: 'Agresif Fitness Koçu (Goran)',
      description:
        'Katabolik alarmlar ve protein dikme tehditleriyle motive eder.',
      badge: 'KOÇ',
      maxDb: 94,
      dosageLabel: 'Ağır',
      recordingCount: 28,
      unlockStreakDays: 0,
    },
    {
      slug: 'sinirli-balkan-annesi',
      name: 'Sinirli Balkan Annesi',
      description: 'Suçluluk ve böbrek sağlığı tehditleriyle seni ezer.',
      badge: 'ANNE',
      maxDb: 91,
      dosageLabel: 'Duygusal',
      recordingCount: 35,
      unlockStreakDays: 0,
    },
    {
      slug: 'toksik-kurumsal-yonetici',
      name: 'Toksik Kurumsal Yönetici',
      description: 'Sprint deadline ve Q3 hedefleriyle su içtirir.',
      badge: 'KPI',
      maxDb: 88,
      dosageLabel: 'Kurumsal',
      recordingCount: 20,
      unlockStreakDays: 0,
    },
    {
      slug: 'dracula',
      name: 'Dracula (Gotik Efendi)',
      description: 'Gotik tehditler. 7 günlük seri ile açılır.',
      badge: 'KİLİTLİ',
      maxDb: 99,
      dosageLabel: 'Vampirik',
      recordingCount: 15,
      unlockStreakDays: 7,
    },
  ];

  for (const c of characters) {
    const existing = await em.findOne(Character, { where: { slug: c.slug } });
    if (existing) {
      Object.assign(existing, c);
      await em.save(existing);
    } else {
      await em.save(em.create(Character, c));
    }
  }

  const bro = await em.findOneByOrFail(Character, {
    slug: 'ofkeli-mahalle-abisi',
  });
  const coach = await em.findOneByOrFail(Character, {
    slug: 'agresif-fitness-kocu',
  });
  const mom = await em.findOneByOrFail(Character, {
    slug: 'sinirli-balkan-annesi',
  });

  const systemCount = await em.count(ThreatTemplate, {
    where: { isSystem: true },
  });
  if (systemCount === 0) {
    const templates: Partial<ThreatTemplate>[] = [
      {
        text: 'Kalk o suyu iç lan artık! Böbreklerin çöl kumuna döndü kurumuşsun!',
        profanityLevel: ProfanityLevel.UNFILTERED,
        characterId: bro.id,
      },
      {
        text: 'Ulan 3 saattir tek yudum almadın! Böbreklerin iflas mı etsin istiyorsun, kalk iç!',
        profanityLevel: ProfanityLevel.UNFILTERED,
        characterId: bro.id,
      },
      {
        text: 'Kahve içtin ama su nerede koçum? Kafein seni kurutmadan 2 bardak devir.',
        profanityLevel: ProfanityLevel.NEIGHBORHOOD,
        characterId: bro.id,
      },
      {
        text: 'Gözünü açar açmaz ekrana yapışma, o bardağı dikle öyle uyan.',
        profanityLevel: ProfanityLevel.MOCKING,
        characterId: bro.id,
      },
      {
        text: 'Ekrandan kafanı kaldır iki yudum al {{name}}! Kasların su istiyor lan!',
        profanityLevel: ProfanityLevel.MILITARY,
        characterId: coach.id,
      },
      {
        text: 'Günde 5 kahve içmeyi biliyorsun da suyu mu unuttun? +{{debtMl}} ml borcun var.',
        profanityLevel: ProfanityLevel.NEIGHBORHOOD,
        characterId: coach.id,
      },
      {
        text: 'Ben sana demedim mi iç diye? Böbreklerin taş dökecek haberin yok {{name}}!',
        profanityLevel: ProfanityLevel.NEIGHBORHOOD,
        characterId: mom.id,
      },
      {
        text: 'Filtresiz uyarı: Hoparlörden rezil olmadan önce o suyu dik!',
        profanityLevel: ProfanityLevel.UNFILTERED,
        characterId: bro.id,
      },
      {
        text: 'Alay konusu olma: Saatte ~150 ml hedefinin gerisindesin, hareket et.',
        profanityLevel: ProfanityLevel.MOCKING,
        characterId: bro.id,
      },
      {
        text: 'Askeri emir: Şimdi 300 ml su. İtiraz yok. İç.',
        profanityLevel: ProfanityLevel.MILITARY,
        characterId: coach.id,
      },
    ];

    for (const t of templates) {
      const now = new Date();
      await em.save(
        em.create(ThreatTemplate, {
          id: createId(),
          ...t,
          isSystem: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }),
      );
    }
  }

  const landing = await em.findOneBy(LandingPage, { id: LANDING_PAGE_ID });
  if (!landing) {
    await em.save(
      em.create(LandingPage, {
        id: LANDING_PAGE_ID,
        content: DEFAULT_LANDING_CONTENT as unknown as Record<string, unknown>,
      }),
    );
    console.log('Landing page içeriği seed edildi.');
  }

  console.log('HydroRage TypeORM seed tamamlandı.');
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
