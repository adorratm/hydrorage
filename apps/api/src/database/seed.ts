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

  // Sistem şablonlarını her seed'de tazele (küfür metinleri güncellensin)
  await em.delete(ThreatTemplate, { isSystem: true });

  const templates: Partial<ThreatTemplate>[] = [
    {
      text: 'Anasını siktiğimin kurusu, kalk o suyu iç lan! Böbreklerin çatır çatır kuruyor!',
      profanityLevel: ProfanityLevel.UNFILTERED,
      characterId: bro.id,
    },
    {
      text: 'Ulan orospu çocuğu 3 saattir tek damla almadın, ne bok yiyorsun? O bardağı dik!',
      profanityLevel: ProfanityLevel.UNFILTERED,
      characterId: bro.id,
    },
    {
      text: 'Kahveyi götün gibi yudumluyorsun da suya mı elin değmiyor lan? İki bardak devir şimdi.',
      profanityLevel: ProfanityLevel.NEIGHBORHOOD,
      characterId: bro.id,
    },
    {
      text: 'Gözünü açar açmaz telefona yapışma amk, önce o suyu götüne kadar iç öyle uyan.',
      profanityLevel: ProfanityLevel.MOCKING,
      characterId: bro.id,
    },
    {
      text: 'Ekrandan kafanı kaldır {{name}}! Kasların su istiyor lan, susuz kas = ölü kas amk!',
      profanityLevel: ProfanityLevel.MILITARY,
      characterId: coach.id,
    },
    {
      text: 'Günde 5 kahve içmeyi biliyorsun da suyu mu unuttun seni salak? +{{debtMl}} ml borcun var, öde!',
      profanityLevel: ProfanityLevel.NEIGHBORHOOD,
      characterId: coach.id,
    },
    {
      text: 'Ben sana demedim mi iç diye lan? Böbreklerin taş dökecek, sonra ağlama {{name}}!',
      profanityLevel: ProfanityLevel.NEIGHBORHOOD,
      characterId: mom.id,
    },
    {
      text: 'Ananı avradını sikeyim, hoparlörden rezil olmadan o suyu dik lan! Filtresiz uyarı bu!',
      profanityLevel: ProfanityLevel.UNFILTERED,
      characterId: bro.id,
    },
    {
      text: 'Alay konusu olmuşsun amk: saatte 150 ml hedefinin gerisindesin, hareket et lan tembel!',
      profanityLevel: ProfanityLevel.MOCKING,
      characterId: bro.id,
    },
    {
      text: 'Askeri emir: Şimdi 300 ml su. İtiraz yok, götün kalkana kadar iç amına koyayım!',
      profanityLevel: ProfanityLevel.MILITARY,
      characterId: coach.id,
    },
    {
      text: 'Senin gibi susuz gezen herifin anasını sikeyim {{name}}! O bardağı şimdi kırılana kadar iç!',
      profanityLevel: ProfanityLevel.UNFILTERED,
      characterId: bro.id,
    },
    {
      text: 'Amına kodumun dehydratı, idrarın turuncu mu olmuş? Su iç lan, taş mı toplayacaksın böbreğinde?',
      profanityLevel: ProfanityLevel.UNFILTERED,
      characterId: bro.id,
    },
    {
      text: 'Koçum dinle: protein shake içip suyu es geçmek = götünle spor yapmak. 500 ml dik şimdi!',
      profanityLevel: ProfanityLevel.MILITARY,
      characterId: coach.id,
    },
    {
      text: 'Annen utanır senden {{name}}! Su içmeye üşenen evlat mı olur lan, utan biraz!',
      profanityLevel: ProfanityLevel.NEIGHBORHOOD,
      characterId: mom.id,
    },
    {
      text: 'Siktir git mutfağa, musluğu aç, ağzına sok o suyu. Bahanen yok orospu çocuğu.',
      profanityLevel: ProfanityLevel.UNFILTERED,
      characterId: bro.id,
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
