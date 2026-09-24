import type { AppLocale } from './i18n';
import { t } from './i18n';

export enum DrinkType {
  WATER = 'WATER',
  BOTTLE = 'BOTTLE',
  COFFEE = 'COFFEE',
  TEA = 'TEA',
  ELECTROLYTE = 'ELECTROLYTE',
  SODA = 'SODA',
  ALCOHOL = 'ALCOHOL',
  PROTEIN = 'PROTEIN',
  MEDICINE = 'MEDICINE',
  ENERGY = 'ENERGY',
  MINERAL = 'MINERAL',
  ESPRESSO = 'ESPRESSO',
  FILTER_COFFEE = 'FILTER_COFFEE',
}

export enum ProfanityLevel {
  SAFE = 'SAFE',
  MOCKING = 'MOCKING',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  MILITARY = 'MILITARY',
  UNFILTERED = 'UNFILTERED',
}

export enum PunishmentIntensity {
  LIGHT = 'LIGHT',
  HARD = 'HARD',
  SIREN = 'SIREN',
}

export enum RoutineKind {
  INTERVAL = 'INTERVAL',
  SPECIFIC_TIMES = 'SPECIFIC_TIMES',
}

export enum ThreatStatus {
  PENDING = 'PENDING',
  PLAYED = 'PLAYED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

/** Diuretic / alcohol debt penalties in ml */
export const DEHYDRATION_PENALTY_ML: Partial<Record<DrinkType, number>> = {
  [DrinkType.COFFEE]: 50,
  [DrinkType.ESPRESSO]: 150,
  [DrinkType.FILTER_COFFEE]: 200,
  [DrinkType.TEA]: 30,
  [DrinkType.ENERGY]: 100,
  [DrinkType.ALCOHOL]: 500,
};

export const NET_HYDRATION_ML: Partial<Record<DrinkType, number>> = {
  [DrinkType.WATER]: 1,
  [DrinkType.BOTTLE]: 1,
  [DrinkType.ELECTROLYTE]: 1,
  [DrinkType.SODA]: 0.7,
  [DrinkType.MINERAL]: 1,
  [DrinkType.PROTEIN]: 0.9,
  [DrinkType.MEDICINE]: 1,
  [DrinkType.COFFEE]: 0.5,
  [DrinkType.ESPRESSO]: 0.3,
  [DrinkType.FILTER_COFFEE]: 0.4,
  [DrinkType.TEA]: 0.6,
  [DrinkType.ENERGY]: 0.4,
  [DrinkType.ALCOHOL]: 0,
};

export const DEFAULT_DAILY_GOAL_ML = 2500;
export const DEFAULT_QUICK_DRINK_ML = 300;

export const QUICK_ADD_PRESETS = [
  { type: DrinkType.WATER, labelKey: 'preset.WATER' as const, amountMl: 250, icon: 'water-outline' },
  { type: DrinkType.BOTTLE, labelKey: 'preset.BOTTLE' as const, amountMl: 500, icon: 'beer-outline' },
  { type: DrinkType.COFFEE, labelKey: 'preset.COFFEE' as const, amountMl: 180, icon: 'cafe-outline', penaltyMl: 50 },
  { type: DrinkType.ELECTROLYTE, labelKey: 'preset.ELECTROLYTE' as const, amountMl: 300, icon: 'flash-outline' },
  { type: DrinkType.MEDICINE, labelKey: 'preset.MEDICINE' as const, amountMl: 200, icon: 'medkit-outline' },
  { type: DrinkType.PROTEIN, labelKey: 'preset.PROTEIN' as const, amountMl: 400, icon: 'fitness-outline' },
] as const;

/** @deprecated use labelKey + t(locale, labelKey); kept for TR fallback */
export const QUICK_ADD_PRESET_LABELS_TR: Record<string, string> = {
  WATER: 'Küçük Su',
  BOTTLE: 'Büyük Şişe',
  COFFEE: 'Kahve / Çay',
  ELECTROLYTE: 'Elektrolit',
  MEDICINE: 'İlaç + Su',
  PROTEIN: 'Protein Shake',
};

export const VOLUME_PRESETS_ML = [100, 250, 330, 500, 1000] as const;

export const CHARACTER_SLUGS = {
  NEIGHBOR_BRO: 'ofkeli-mahalle-abisi',
  FITNESS_COACH: 'agresif-fitness-kocu',
  ANGRY_MOM: 'sinirli-balkan-annesi',
  DRACULA: 'dracula',
  CORPORATE: 'toksik-kurumsal-yonetici',
  SERGEANT: 'cavus-komutan',
  TAXI: 'taksi-soforu',
  TOXIC_EX: 'zehirli-ex',
  ER_DOCTOR: 'acil-doktor',
  NIGHT_GUARD: 'gece-bekcisi',
  SULTRY: 'seksi-ses',
  GOTHIC_LADY: 'gotik-leydi',
  JAPANESE: 'japon-ses',
} as const;

export type CharacterMeta = {
  name: string;
  description: string;
  badge: string;
  dosageLabel: string;
};

/** Display copy by slug — overrides API seed language when locale is set */
export const CHARACTER_META: Record<
  string,
  { tr: CharacterMeta; en: CharacterMeta }
> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]: {
    tr: {
      name: 'Öfkeli Mahalle Abisi v2.4',
      description:
        "14:00'e kadar su içmezsen mahalle hoparlöründen küfürle bağırır. Filtresiz.",
      badge: 'FİLTRESİZ',
      dosageLabel: 'Ölümcül',
    },
    en: {
      name: 'Angry Neighborhood Bro v2.4',
      description:
        'If you skip water until 14:00, he yells from the neighborhood PA. Unfiltered.',
      badge: 'UNFILTERED',
      dosageLabel: 'Lethal',
    },
  },
  [CHARACTER_SLUGS.FITNESS_COACH]: {
    tr: {
      name: 'Agresif Fitness Koçu (Goran)',
      description:
        'Katabolik alarmlar ve protein dikme tehditleriyle motive eder.',
      badge: 'KOÇ',
      dosageLabel: 'Ağır',
    },
    en: {
      name: 'Aggressive Fitness Coach (Goran)',
      description: 'Motivates with catabolic alarms and “chug protein” threats.',
      badge: 'COACH',
      dosageLabel: 'Heavy',
    },
  },
  [CHARACTER_SLUGS.ANGRY_MOM]: {
    tr: {
      name: 'Sinirli Balkan Annesi',
      description: 'Suçluluk ve böbrek sağlığı tehditleriyle seni ezer.',
      badge: 'ANNE',
      dosageLabel: 'Duygusal',
    },
    en: {
      name: 'Angry Balkan Mom',
      description: 'Crushes you with guilt and kidney-health threats.',
      badge: 'MOM',
      dosageLabel: 'Emotional',
    },
  },
  [CHARACTER_SLUGS.CORPORATE]: {
    tr: {
      name: 'Toksik Kurumsal Yönetici',
      description: 'Sprint son tarihi ve çeyrek hedefleriyle su içtirir.',
      badge: 'HEDEF',
      dosageLabel: 'Kurumsal',
    },
    en: {
      name: 'Toxic Corporate Manager',
      description: 'Makes you drink via sprint deadlines and Q3 goals.',
      badge: 'KPI',
      dosageLabel: 'Corporate',
    },
  },
  [CHARACTER_SLUGS.DRACULA]: {
    tr: {
      name: 'Dracula (Gotik Efendi)',
      description: 'Kan değil su ister. Gotik tehditler, gece yarısı fısıltısı.',
      badge: 'GOTİK',
      dosageLabel: 'Vampirik',
    },
    en: {
      name: 'Dracula (Gothic Lord)',
      description: 'Wants water, not blood. Gothic threats, midnight whispers.',
      badge: 'GOTHIC',
      dosageLabel: 'Vampiric',
    },
  },
  [CHARACTER_SLUGS.SERGEANT]: {
    tr: {
      name: 'Çavuş Komutan',
      description: 'Emir-komuta zinciri. İtiraz yok, sadece yudum.',
      badge: 'ASKERİ',
      dosageLabel: 'Cezaevi',
    },
    en: {
      name: 'Sergeant Commander',
      description: 'Chain of command. No objections — only sips.',
      badge: 'MILITARY',
      dosageLabel: 'Brig',
    },
  },
  [CHARACTER_SLUGS.TAXI]: {
    tr: {
      name: 'Sinirli Taksi Şoförü',
      description: 'Trafikte küfür eder gibi hidrasyon hatırlatır.',
      badge: 'TRAFİK',
      dosageLabel: 'Korna',
    },
    en: {
      name: 'Angry Taxi Driver',
      description: 'Hydration reminders like cursing in traffic.',
      badge: 'TRAFFIC',
      dosageLabel: 'Horn',
    },
  },
  [CHARACTER_SLUGS.TOXIC_EX]: {
    tr: {
      name: 'Zehirli Ex',
      description: 'Eski sevgili enerjisi: alay, kıskançlık, susuzluk utancı.',
      badge: 'EX',
      dosageLabel: 'Toksik',
    },
    en: {
      name: 'Toxic Ex',
      description: 'Ex energy: mockery, jealousy, dehydration shame.',
      badge: 'EX',
      dosageLabel: 'Toxic',
    },
  },
  [CHARACTER_SLUGS.ER_DOCTOR]: {
    tr: {
      name: 'Acil Doktor',
      description: 'Klinik ton: susuzluk riski, ağızdan sıvı emri.',
      badge: 'ACİL',
      dosageLabel: 'Klinik',
    },
    en: {
      name: 'ER Doctor',
      description: 'Clinical tone: dehydration risk, oral fluid orders.',
      badge: 'ER',
      dosageLabel: 'Clinical',
    },
  },
  [CHARACTER_SLUGS.NIGHT_GUARD]: {
    tr: {
      name: 'Gece Bekçisi',
      description: '03:00 nöbeti: su borcun var, kalk yudumla.',
      badge: 'GECE',
      dosageLabel: 'Nöbet',
    },
    en: {
      name: 'Night Guard',
      description: '03:00 watch: you owe water — get up and sip.',
      badge: 'NIGHT',
      dosageLabel: 'Watch',
    },
  },
  [CHARACTER_SLUGS.SULTRY]: {
    tr: {
      name: 'Seksi Fısıltı',
      description: 'Yavaş, alçak ve yakın. Su içmeni fısıldayarak ister.',
      badge: 'FİSİLTI',
      dosageLabel: 'Yakın',
    },
    en: {
      name: 'Sultry Whisper',
      description: 'Slow, low, and close. She asks you to drink in a whisper.',
      badge: 'WHISPER',
      dosageLabel: 'Close',
    },
  },
  [CHARACTER_SLUGS.GOTHIC_LADY]: {
    tr: {
      name: 'Gotik Leydi',
      description: 'Karanlık, ağır ve tok bir kadın sesi. Gece yarısı su borcunu sayar.',
      badge: 'GOTİK',
      dosageLabel: 'Gece',
    },
    en: {
      name: 'Gothic Lady',
      description: 'A dark, heavy female voice. She counts your water debt at midnight.',
      badge: 'GOTHIC',
      dosageLabel: 'Night',
    },
  },
  [CHARACTER_SLUGS.JAPANESE]: {
    tr: {
      name: 'Japon Kadın',
      description: 'Sakin Japon aksanı. Türkçe ve İngilizce aynı sesle su hatırlatır.',
      badge: 'JAPON',
      dosageLabel: 'Sakin',
    },
    en: {
      name: 'Japanese Woman',
      description: 'Japanese accent. The same voice speaks Turkish and English.',
      badge: 'JAPAN',
      dosageLabel: 'Calm',
    },
  },
};

export function localizeCharacter(
  slug: string | null | undefined,
  locale: AppLocale,
  fallback?: Partial<CharacterMeta>,
): CharacterMeta {
  const meta = slug ? CHARACTER_META[slug] : undefined;
  if (meta) return meta[locale] ?? meta.tr;
  return {
    name: fallback?.name ?? slug ?? 'Character',
    description: fallback?.description ?? '',
    badge: fallback?.badge ?? '',
    dosageLabel: fallback?.dosageLabel ?? '',
  };
}

/** Örnek dinle metinleri (karakter sesi / üslubu) — +18 */
export const CHARACTER_SAMPLE_LINES: Record<string, string> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]:
    'Anasını siktiğimin kurusu, kalk o suyu iç lan! Böbreklerin çatır çatır kuruyor!',
  [CHARACTER_SLUGS.FITNESS_COACH]:
    'Kasların su istiyor lan, susuz kas ölü kas! 500 ml dik şimdi!',
  [CHARACTER_SLUGS.ANGRY_MOM]:
    'Ben sana demedim mi iç diye? Böbreklerin taş dökecek, utan biraz!',
  [CHARACTER_SLUGS.CORPORATE]:
    'Bu çeyrek hidrasyon hedefin kırmızı. Yapılacak iş: 300 ml su, süre şimdi.',
  [CHARACTER_SLUGS.DRACULA]:
    'Kanım değil suyun eksik… O bardağı boş bırakırsan gece seni bulurum.',
  [CHARACTER_SLUGS.SERGEANT]:
    'DİKKAT! Emir: 300 ml su. İtiraz edenin götüne tekme. Uygula!',
  [CHARACTER_SLUGS.TAXI]:
    'Ulan trafik gibi sıkışmışsın susuzluktan! Korna: SU İÇ LAN!',
  [CHARACTER_SLUGS.TOXIC_EX]:
    'Hâlâ aynı tembelsin… Su içmeyi bile başaramıyorsun, şaşırdım mı? Hayır.',
  [CHARACTER_SLUGS.ER_DOCTOR]:
    'Klinik not: susuz. Tedavi ağızdan su, 500 ml, derhal.',
  [CHARACTER_SLUGS.NIGHT_GUARD]:
    'Saat 03:00. Nöbet: su borcun var. Kalk, yudumla, tekrar uyu.',
  [CHARACTER_SLUGS.SULTRY]:
    'Yaklaş. Bardağı dudağına götür, yavaş yudumla.',
  [CHARACTER_SLUGS.GOTHIC_LADY]:
    'Mum söndü. Karanlıkta su borcun duruyor. Bir yudum, yoksa gece uzar.',
  [CHARACTER_SLUGS.JAPANESE]:
    'Lütfen su iç. Bardak boş kalmasın. やめてください。',
};

/** Güvenli mod örnek satırları (argo/küfür yok) */
export const CHARACTER_SAFE_SAMPLE_LINES: Record<string, string> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]:
    'Su içme zamanın geldi. Hidrasyon hedefin geride kalıyor.',
  [CHARACTER_SLUGS.FITNESS_COACH]:
    'Kasların su bekliyor. 500 ml iç, verimli antrenman için şart.',
  [CHARACTER_SLUGS.ANGRY_MOM]:
    'Sana söyledim: su iç. Böbreklerin için lütfen bir bardak.',
  [CHARACTER_SLUGS.CORPORATE]:
    'Hidrasyon hedefin sarıya döndü. Yapılacak: 300 ml su, süre şimdi.',
  [CHARACTER_SLUGS.DRACULA]:
    'Kan değil suyun eksik. Bir yudum al; gece daha rahat geçer.',
  [CHARACTER_SLUGS.SERGEANT]:
    'DİKKAT! Emir: 300 ml su. Disiplinle uygula.',
  [CHARACTER_SLUGS.TAXI]:
    'Susuzluktan sıkışmış gibi hissediyorsan bir bardak su iç.',
  [CHARACTER_SLUGS.TOXIC_EX]:
    'Küçük hatırlatma: su içmeyi erteleme. Bir bardak yeter.',
  [CHARACTER_SLUGS.ER_DOCTOR]:
    'Klinik not: hafif susuzluk riski. Tedavi: ağızdan su, 500 ml.',
  [CHARACTER_SLUGS.NIGHT_GUARD]:
    'Saat 03:00. Su borcun var. Kalk, bir yudum al, tekrar uyu.',
  [CHARACTER_SLUGS.SULTRY]:
    'Bir bardak su. Yavaş iç, acele etme.',
  [CHARACTER_SLUGS.GOTHIC_LADY]:
    'Gece su borcunu unutmaz. Bir yudum al.',
  [CHARACTER_SLUGS.JAPANESE]:
    'Lütfen bir bardak su iç. Şimdi.',
};

export const CHARACTER_SAMPLE_LINES_EN: Record<string, string> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]:
    'Get up and drink that water! Your kidneys are drying out!',
  [CHARACTER_SLUGS.FITNESS_COACH]:
    'Your muscles want water — dry muscle is dead muscle! Chug 500 ml now!',
  [CHARACTER_SLUGS.ANGRY_MOM]:
    'Didn’t I tell you to drink? Your kidneys will make stones — have some shame!',
  [CHARACTER_SLUGS.CORPORATE]:
    'Q3 hydration KPI is red. Action item: 300 ml water, deadline now.',
  [CHARACTER_SLUGS.DRACULA]:
    'It isn’t blood you’re missing — it’s water. Leave that glass empty and I’ll find you at night.',
  [CHARACTER_SLUGS.SERGEANT]:
    'ATTENTION! Order: 300 ml water. No objections. Execute!',
  [CHARACTER_SLUGS.TAXI]:
    'You’re stuck like traffic from dehydration! Horn: DRINK WATER!',
  [CHARACTER_SLUGS.TOXIC_EX]:
    'Still the same lazy you… Can’t even drink water. Surprised? No.',
  [CHARACTER_SLUGS.ER_DOCTOR]:
    'Clinical note: dehydrated. Treatment: oral water, 500 ml, immediately.',
  [CHARACTER_SLUGS.NIGHT_GUARD]:
    '03:00. Night watch: you owe water. Get up, sip, sleep again.',
  [CHARACTER_SLUGS.SULTRY]:
    'Come closer. Put the glass to your lips and sip slowly.',
  [CHARACTER_SLUGS.GOTHIC_LADY]:
    'The candle went out. Your water debt waits in the dark. One sip, or the night stretches.',
  [CHARACTER_SLUGS.JAPANESE]:
    'Please drink water. Do not leave the glass empty. やめてください。',
};

export const CHARACTER_SAFE_SAMPLE_LINES_EN: Record<string, string> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]:
    'Time to drink water. You’re behind on your hydration goal.',
  [CHARACTER_SLUGS.FITNESS_COACH]:
    'Your muscles are waiting on water. Drink 500 ml — needed for a solid workout.',
  [CHARACTER_SLUGS.ANGRY_MOM]:
    'I told you: drink water. Please have a glass for your kidneys.',
  [CHARACTER_SLUGS.CORPORATE]:
    'Hydration KPI turned yellow. Action: 300 ml water, deadline now.',
  [CHARACTER_SLUGS.DRACULA]:
    'It isn’t blood — you’re low on water. Take a sip; the night goes easier.',
  [CHARACTER_SLUGS.SERGEANT]:
    'ATTENTION! Order: 300 ml water. Execute with discipline.',
  [CHARACTER_SLUGS.TAXI]:
    'If dehydration has you stuck, drink a glass of water.',
  [CHARACTER_SLUGS.TOXIC_EX]:
    'Small reminder: don’t put off drinking water. One glass is enough.',
  [CHARACTER_SLUGS.ER_DOCTOR]:
    'Clinical note: mild dehydration risk. Treatment: oral water, 500 ml.',
  [CHARACTER_SLUGS.NIGHT_GUARD]:
    '03:00. You owe water. Get up, take a sip, sleep again.',
  [CHARACTER_SLUGS.SULTRY]:
    'A glass of water. Drink it slowly.',
  [CHARACTER_SLUGS.GOTHIC_LADY]:
    'The night does not forget a water debt. Take one sip.',
  [CHARACTER_SLUGS.JAPANESE]:
    'Please drink a glass of water. Now.',
};

export const JAPANESE_TAIL = 'やめてください。';

/** Ekranda ve seste durmasın. Kayıt bu sözü kendi söylüyor. */
export function stripYametePhrase(text: string): string {
  return text
    .replace(/やめてええ、くださいいい、やめてください/g, '')
    .replace(/やめてええ、くださいいい/g, '')
    .replace(/やめてください[。.]?/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/^[,.\s!?]+|[,.\s!?]+$/g, '')
    .trim();
}

/** Elle yazılmış şablonda Japon sesi seçiliyse ara sıra cümle sonuna eklenir. */
export function withRandomJapaneseTail(
  text: string,
  characterSlug: string | null | undefined,
  manual: boolean,
): string {
  if (!manual || characterSlug !== CHARACTER_SLUGS.JAPANESE) return text;
  if (text.includes('やめて')) return text;
  if (Math.random() >= 0.5) return text;
  const base = text.replace(/[\s.!?]+$/u, '');
  return `${base}. ${JAPANESE_TAIL}`;
}

export function sampleLineForCharacter(
  slug: string | null | undefined,
  plus18Mode = true,
  locale: AppLocale = 'tr',
): string {
  const key = slug ?? '';
  const pool =
    locale === 'en'
      ? plus18Mode
        ? CHARACTER_SAMPLE_LINES_EN
        : CHARACTER_SAFE_SAMPLE_LINES_EN
      : plus18Mode
        ? CHARACTER_SAMPLE_LINES
        : CHARACTER_SAFE_SAMPLE_LINES;
  return (
    pool[key] ??
    t(
      locale,
      plus18Mode ? 'tone.fallbackPlus18' : 'tone.fallbackSafe',
    )
  );
}


export function computeNetMl(type: DrinkType, amountMl: number): {
  grossMl: number;
  penaltyMl: number;
  netMl: number;
} {
  const factor = NET_HYDRATION_ML[type] ?? 1;
  const penaltyMl = DEHYDRATION_PENALTY_ML[type] ?? 0;
  const hydrationFromDrink = Math.round(amountMl * factor);
  const netMl = hydrationFromDrink - penaltyMl;
  return { grossMl: amountMl, penaltyMl, netMl };
}

export function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}

/** "Ad Soyad" → sadece ilk ad (küfür şablonları için) */
export function firstName(displayName: string | null | undefined): string {
  const raw = (displayName ?? '').trim();
  if (!raw) return 'dostum';
  const first = raw.split(/\s+/)[0] ?? raw;
  return first || 'dostum';
}


export * from './landing';
export * from './i18n';
