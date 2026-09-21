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

type CharSeed = {
  slug: string;
  name: string;
  description: string;
  badge: string;
  maxDb: number;
  dosageLabel: string;
  recordingCount: number;
  unlockStreakDays: number;
};

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

  const characters: CharSeed[] = [
    {
      slug: 'ofkeli-mahalle-abisi',
      name: 'Öfkeli Mahalle Abisi v2.4',
      description:
        "14:00'e kadar su içmezsen mahalle hoparlöründen küfürle bağırır. Filtresiz.",
      badge: 'FİLTRESİZ 🔥',
      maxDb: 98,
      dosageLabel: 'Ölümcül',
      recordingCount: 48,
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
      recordingCount: 36,
      unlockStreakDays: 3,
    },
    {
      slug: 'sinirli-balkan-annesi',
      name: 'Sinirli Balkan Annesi',
      description: 'Suçluluk ve böbrek sağlığı tehditleriyle seni ezer.',
      badge: 'ANNE',
      maxDb: 91,
      dosageLabel: 'Duygusal',
      recordingCount: 32,
      unlockStreakDays: 5,
    },
    {
      slug: 'toksik-kurumsal-yonetici',
      name: 'Toksik Kurumsal Yönetici',
      description: 'Sprint deadline ve Q3 hedefleriyle su içtirir.',
      badge: 'KPI',
      maxDb: 88,
      dosageLabel: 'Kurumsal',
      recordingCount: 28,
      unlockStreakDays: 7,
    },
    {
      slug: 'dracula',
      name: 'Dracula (Gotik Efendi)',
      description: 'Kan değil su ister. Gotik tehditler, gece yarısı fısıltısı.',
      badge: 'GOTİK',
      maxDb: 99,
      dosageLabel: 'Vampirik',
      recordingCount: 30,
      unlockStreakDays: 10,
    },
    {
      slug: 'cavus-komutan',
      name: 'Çavuş Komutan',
      description: 'Emir-komuta zinciri. İtiraz yok, sadece yudum.',
      badge: 'ASKERİ',
      maxDb: 100,
      dosageLabel: 'Cezaevi',
      recordingCount: 26,
      unlockStreakDays: 14,
    },
    {
      slug: 'taksi-soforu',
      name: 'Sinirli Taksi Şoförü',
      description: 'Trafikte küfür eder gibi hidrasyon hatırlatır.',
      badge: 'TRAFİK',
      maxDb: 96,
      dosageLabel: 'Korna',
      recordingCount: 24,
      unlockStreakDays: 7,
    },
    {
      slug: 'zehirli-ex',
      name: 'Zehirli Ex',
      description: 'Eski sevgili enerjisi: alay, kıskançlık, susuzluk utancı.',
      badge: 'EX 💔',
      maxDb: 93,
      dosageLabel: 'Toksik',
      recordingCount: 28,
      unlockStreakDays: 21,
    },
    {
      slug: 'acil-doktor',
      name: 'Acil Servis Doktoru',
      description: 'Klinik gerçeklik: taş, dehidratasyon, yoğun bakım tehdidi.',
      badge: 'KLİNİK',
      maxDb: 90,
      dosageLabel: 'IV Serum',
      recordingCount: 22,
      unlockStreakDays: 14,
    },
    {
      slug: 'gece-bekcisi',
      name: 'Gece Bekçisi',
      description: '03:00 nöbeti. Uyurken bile su borcunu takip eder.',
      badge: 'GECE',
      maxDb: 92,
      dosageLabel: 'Nöbet',
      recordingCount: 20,
      unlockStreakDays: 30,
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

  const bySlug = async (slug: string) =>
    em.findOneByOrFail(Character, { slug });

  const bro = await bySlug('ofkeli-mahalle-abisi');
  const coach = await bySlug('agresif-fitness-kocu');
  const mom = await bySlug('sinirli-balkan-annesi');
  const corp = await bySlug('toksik-kurumsal-yonetici');
  const drac = await bySlug('dracula');
  const cavus = await bySlug('cavus-komutan');
  const taxi = await bySlug('taksi-soforu');
  const ex = await bySlug('zehirli-ex');
  const doc = await bySlug('acil-doktor');
  const night = await bySlug('gece-bekcisi');

  await em.delete(ThreatTemplate, { isSystem: true });

  const U = ProfanityLevel.UNFILTERED;
  const N = ProfanityLevel.NEIGHBORHOOD;
  const M = ProfanityLevel.MOCKING;
  const MIL = ProfanityLevel.MILITARY;
  const S = ProfanityLevel.SAFE;

  const templates: Partial<ThreatTemplate>[] = [
    // —— Güvenli mod (küfürsüz uyarılar) ——
    {
      text: '{{name}}, su içme zamanın geldi. Hidrasyon hedefin geride kalıyor.',
      profanityLevel: S,
      characterId: bro.id,
    },
    {
      text: 'Kısa hatırlatma: bir bardak su iç. Böbreklerin teşekkür eder.',
      profanityLevel: S,
      characterId: bro.id,
    },
    {
      text: 'Bugün +{{debtMl}} ml geridesin. Lütfen şimdi su iç.',
      profanityLevel: S,
      characterId: bro.id,
    },
    {
      text: 'Antrenman hatırlatması: susuz kas verimsiz çalışır. 300 ml su, şimdi.',
      profanityLevel: S,
      characterId: coach.id,
    },
    {
      text: '{{name}}, hücrelerin su bekliyor. Kısa bir mola verip bardaktan yudumla.',
      profanityLevel: S,
      characterId: coach.id,
    },
    {
      text: 'Anne tavsiyesi: su içmeden saatler geçirme. Bir bardak yeter, hemen.',
      profanityLevel: S,
      characterId: mom.id,
    },
    {
      text: 'Hidrasyon KPI’ın sarıya döndü. Aksiyon: 300 ml su, deadline şimdi.',
      profanityLevel: S,
      characterId: corp.id,
    },
    {
      text: 'Klinik not: hafif dehidrasyon riski. Tedavi: oral su, 400 ml.',
      profanityLevel: S,
      characterId: doc.id,
    },
    {
      text: 'Emir: 300 ml su. Disiplinle uygula, itiraz yok.',
      profanityLevel: S,
      characterId: cavus.id,
    },
    {
      text: 'Gece hatırlatması: su borcun var. Kalk, bir yudum al, devam et.',
      profanityLevel: S,
      characterId: night.id,
    },
    {
      text: 'Trafik gibi sıkışmış hissediyorsan su eksik olabilir. Bir bardak iç.',
      profanityLevel: S,
      characterId: taxi.id,
    },
    {
      text: 'Küçük bir uyarı: su içmeyi ertelemek alışkanlık olur. Şimdi bir bardak.',
      profanityLevel: S,
      characterId: ex.id,
    },
    {
      text: 'Kan değil, su eksik. Bardağı boş bırakma; gece daha iyi uyursun.',
      profanityLevel: S,
      characterId: drac.id,
    },

    // —— Mahalle Abisi ——
    {
      text: 'Anasını siktiğimin kurusu, kalk o suyu iç lan! Böbreklerin çatır çatır kuruyor!',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Ulan orospu çocuğu 3 saattir tek damla almadın, ne bok yiyorsun? O bardağı dik!',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Kahveyi götün gibi yudumluyorsun da suya mı elin değmiyor lan? İki bardak devir şimdi.',
      profanityLevel: N,
      characterId: bro.id,
    },
    {
      text: 'Gözünü açar açmaz telefona yapışma amk, önce o suyu götüne kadar iç öyle uyan.',
      profanityLevel: M,
      characterId: bro.id,
    },
    {
      text: 'Ananı avradını sikeyim, hoparlörden rezil olmadan o suyu dik lan! Filtresiz uyarı bu!',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Alay konusu olmuşsun amk: saatte 150 ml hedefinin gerisindesin, hareket et lan tembel!',
      profanityLevel: M,
      characterId: bro.id,
    },
    {
      text: 'Senin gibi susuz gezen herifin anasını sikeyim {{name}}! O bardağı şimdi kırılana kadar iç!',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Amına kodumun dehydratı, idrarın turuncu mu olmuş? Su iç lan, taş mı toplayacaksın böbreğinde?',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Siktir git mutfağa, musluğu aç, ağzına sok o suyu. Bahanen yok orospu çocuğu.',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Mahallede susuz gezene saygı yok {{name}}. +{{debtMl}} ml borcun var, öde lan!',
      profanityLevel: N,
      characterId: bro.id,
    },
    {
      text: 'Bardağı boş bırakıp oturuyorsun ha? Ananı sikerim, doldur iç bitir!',
      profanityLevel: U,
      characterId: bro.id,
    },
    {
      text: 'Lan {{name}}, su içmek zor geliyorsa götünle mi yaşayacaksın? Kalk iç!',
      profanityLevel: U,
      characterId: bro.id,
    },

    // —— Fitness Koçu ——
    {
      text: 'Ekrandan kafanı kaldır {{name}}! Kasların su istiyor lan, susuz kas = ölü kas amk!',
      profanityLevel: MIL,
      characterId: coach.id,
    },
    {
      text: 'Günde 5 kahve içmeyi biliyorsun da suyu mu unuttun seni salak? +{{debtMl}} ml borcun var, öde!',
      profanityLevel: N,
      characterId: coach.id,
    },
    {
      text: 'Askeri emir: Şimdi 300 ml su. İtiraz yok, götün kalkana kadar iç amına koyayım!',
      profanityLevel: MIL,
      characterId: coach.id,
    },
    {
      text: 'Koçum dinle: protein shake içip suyu es geçmek = götünle spor yapmak. 500 ml dik şimdi!',
      profanityLevel: MIL,
      characterId: coach.id,
    },
    {
      text: 'Pump istiyorsun ama hücrelerin kurak amk. Su yoksa kas yok, hareket et {{name}}!',
      profanityLevel: N,
      characterId: coach.id,
    },
    {
      text: 'Rest day diye susuzluk mı yaşıyorsun lan? Rest day de su içilir, 400 ml şimdi!',
      profanityLevel: MIL,
      characterId: coach.id,
    },
    {
      text: 'Formun çöpe gidecek {{name}}. Dehidratasyon = performans sıfır. Bardağı kırılana kadar iç!',
      profanityLevel: N,
      characterId: coach.id,
    },
    {
      text: 'Set arası su, set sonrası su. Senin gibi tembel set atmaz, susuzluk yaşar. İç lan!',
      profanityLevel: U,
      characterId: coach.id,
    },

    // —— Balkan Annesi ——
    {
      text: 'Ben sana demedim mi iç diye lan? Böbreklerin taş dökecek, sonra ağlama {{name}}!',
      profanityLevel: N,
      characterId: mom.id,
    },
    {
      text: 'Annen utanır senden {{name}}! Su içmeye üşenen evlat mı olur lan, utan biraz!',
      profanityLevel: N,
      characterId: mom.id,
    },
    {
      text: 'Komşunun çocuğu litreyi bitirdi, sen hâlâ ekrandasın. Ayıp {{name}}, ayıp!',
      profanityLevel: M,
      characterId: mom.id,
    },
    {
      text: 'Hasta olunca kim bakacak sana? Su içmeyeni doktor da sevmez, iç şimdi!',
      profanityLevel: N,
      characterId: mom.id,
    },
    {
      text: 'Ben senin için yemek yaptım, sen suya mı el sürmüyorsun {{name}}? Kalk o bardağı dik!',
      profanityLevel: N,
      characterId: mom.id,
    },
    {
      text: 'Allah belanı versin tembel evlat, su içmeden yatma! +{{debtMl}} ml eksiksin!',
      profanityLevel: U,
      characterId: mom.id,
    },

    // —— Kurumsal ——
    {
      text: '{{name}}, Q3 hidrasyon KPI’ın kırmızı. Stakeholder su bekliyor — 300 ml sync şimdi.',
      profanityLevel: M,
      characterId: corp.id,
    },
    {
      text: 'Sprint review’da susuz görünmek professional değil. Action item: su iç. Deadline: şimdi.',
      profanityLevel: M,
      characterId: corp.id,
    },
    {
      text: 'Meeting’de kahve yetmez. Water bottle ownership sende. +{{debtMl}} ml overdue.',
      profanityLevel: N,
      characterId: corp.id,
    },
    {
      text: 'Performance review notu: dehidre çalışan = düşük output. Align ol, su iç {{name}}.',
      profanityLevel: M,
      characterId: corp.id,
    },
    {
      text: 'Slack’te idle’sın, bardak boş. Bu blocker’ı resolve et: 250 ml ASAP.',
      profanityLevel: N,
      characterId: corp.id,
    },
    {
      text: 'Offsite planı: sen susuz kalacaksan budget cut. İç lan, corporate politikası bu.',
      profanityLevel: U,
      characterId: corp.id,
    },

    // —— Dracula ——
    {
      text: 'Kanım değil suyun eksik {{name}}… O bardağı boş bırakırsan gece seni bulurum.',
      profanityLevel: M,
      characterId: drac.id,
    },
    {
      text: 'Karanlıkta fısıldıyorum: susuzluk… ölüme bir adım. İç. Şimdi.',
      profanityLevel: M,
      characterId: drac.id,
    },
    {
      text: 'Tabutumda bile senin +{{debtMl}} ml borcunu sayıyorum. Öde {{name}}, öde.',
      profanityLevel: N,
      characterId: drac.id,
    },
    {
      text: 'Ay ışığında kuruyan etin… ne kadar da… susuz. Su iç, yoksa gölgen bile kaçar.',
      profanityLevel: M,
      characterId: drac.id,
    },
    {
      text: 'Lanet olsun tembelliğine {{name}}. Vampir bile su ister bazen — sen de iç lan!',
      profanityLevel: U,
      characterId: drac.id,
    },
    {
      text: 'Gece yarısı alarmı: hücrelerin çığlık atıyor. 400 ml… yoksa ebedi kuraklık.',
      profanityLevel: N,
      characterId: drac.id,
    },

    // —— Çavuş ——
    {
      text: 'DİKKAT! Emir: 300 ml su. İtiraz edenin götüne tekme. Uygula {{name}}!',
      profanityLevel: MIL,
      characterId: cavus.id,
    },
    {
      text: 'Asker susuz savaşmaz! Sen ne biçim er’sin lan? Bardağı dik, hızlan!',
      profanityLevel: MIL,
      characterId: cavus.id,
    },
    {
      text: 'Nöbet değişimi: hidrasyon yoksa ceza var. +{{debtMl}} ml — hemen!',
      profanityLevel: MIL,
      characterId: cavus.id,
    },
    {
      text: 'Sağa bak soluna bak, suyu iç! Emir-komuta zinciri bozulmaz {{name}}!',
      profanityLevel: MIL,
      characterId: cavus.id,
    },
    {
      text: 'Amına koyayım tembel er, matara boşsa sen de boşsun. Doldur iç bitir!',
      profanityLevel: U,
      characterId: cavus.id,
    },

    // —— Taksi ——
    {
      text: 'Ulan trafik gibi sıkışmışsın susuzluktan! Korna çalıyorum: SU İÇ LAN!',
      profanityLevel: U,
      characterId: taxi.id,
    },
    {
      text: 'Yolcu su ister, sen bardak boş. Taksimetre işliyor {{name}}, +{{debtMl}} ml borç!',
      profanityLevel: N,
      characterId: taxi.id,
    },
    {
      text: 'Kırmızı ışıkta bile su içilir amk. Sen niye beklemiyorsun, iç şimdi!',
      profanityLevel: U,
      characterId: taxi.id,
    },
    {
      text: 'Şerit ihlali: dehidratasyon. Ceza: 400 ml. Öde {{name}}, pazarlık yok.',
      profanityLevel: N,
      characterId: taxi.id,
    },
    {
      text: 'Anasını satayım, klima açıp suyu mu unuttun? Kuruyorsun lan, bardak!',
      profanityLevel: U,
      characterId: taxi.id,
    },

    // —— Ex ——
    {
      text: 'Hâlâ aynı tembelsin {{name}}… Su içmeyi bile başaramıyorsun, şaşırdım mı? Hayır.',
      profanityLevel: M,
      characterId: ex.id,
    },
    {
      text: 'Yeni halin mi bu, susuz ve üzgün? En azından bardağı doldur, rezil olma.',
      profanityLevel: M,
      characterId: ex.id,
    },
    {
      text: 'Ben giderken su içiyordum, sen hâlâ +{{debtMl}} ml geridesin. Klasik {{name}}.',
      profanityLevel: M,
      characterId: ex.id,
    },
    {
      text: 'Story atmayı biliyorsun da su içmeyi mi unuttun aşkım? İç lan, utanç.',
      profanityLevel: N,
      characterId: ex.id,
    },
    {
      text: 'Keşke beni terk ettiğin gibi susuzluğu da terk etsen. 300 ml. Şimdi. {{name}}.',
      profanityLevel: M,
      characterId: ex.id,
    },
    {
      text: 'Siktir et ego’yu, su iç. Beni değil böbreklerini kurtar bu sefer.',
      profanityLevel: U,
      characterId: ex.id,
    },

    // —— Doktor ——
    {
      text: 'Klinik not: hasta {{name}} dehidre. Tedavi: oral su, 500 ml, derhal.',
      profanityLevel: N,
      characterId: doc.id,
    },
    {
      text: 'İdrarın koyuysa alarm. Taş riski artıyor — su iç yoksa ultrason sırası sensin.',
      profanityLevel: N,
      characterId: doc.id,
    },
    {
      text: 'IV serum mu istiyorsun {{name}}? O zaman bardaktan başla. +{{debtMl}} ml eksik.',
      profanityLevel: M,
      characterId: doc.id,
    },
    {
      text: 'Acil servis dolu, sen susuz gezme. Protokol basit: iç, bitir, tekrar et.',
      profanityLevel: N,
      characterId: doc.id,
    },
    {
      text: 'Lan {{name}}, doktor tavsiyesi: amına koyayım su iç. Bilim bu, inat etme.',
      profanityLevel: U,
      characterId: doc.id,
    },

    // —— Gece bekçisi ——
    {
      text: 'Saat 03:00. Nöbet: sen uyurken ben su borcunu sayıyorum {{name}}. Kalk iç.',
      profanityLevel: N,
      characterId: night.id,
    },
    {
      text: 'Gece lambası yanıyor, bardak boş. Bu ihmal. 250 ml — sessizce iç, uyan.',
      profanityLevel: M,
      characterId: night.id,
    },
    {
      text: 'Sabaha +{{debtMl}} ml açıksın. Gece vardiyası affetmez. Su. Şimdi.',
      profanityLevel: N,
      characterId: night.id,
    },
    {
      text: 'Rüyanda bile susuzsun amk. Uyan, yudumla, tekrar uyu {{name}}.',
      profanityLevel: U,
      characterId: night.id,
    },
    {
      text: 'Bekçi diyor ki: kapı kilitli, bardak açık olmalı. İç lan, sabaha kadar beklerim.',
      profanityLevel: N,
      characterId: night.id,
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

  console.log(
    `HydroRage seed: ${characters.length} karakter, ${templates.length} sistem şablonu.`,
  );
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
