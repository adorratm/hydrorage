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

export const CHARACTER_SAMPLE_LINES_EN: Record<string, string[]> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]: [
    'Get up and drink that water, {{name}}! Your kidneys are cracking like cheap plaster!',
    'Three hours, not one sip. What the hell are you doing? Tip that glass back!',
    'You sip coffee like a coward and won’t touch water. Two glasses. Now.',
    'Drop the phone, {{name}}. Drink until that bottle files a complaint.',
    'You’re {{debtMl}} ml in debt and still parked there. Pay up, you dried-out idiot.',
    'Orange piss is not a lifestyle. Drink before your kidney sends a lawyer.',
    'Kitchen. Tap. Mouth. No speech, no excuse, you walking raisin.',
    'The block doesn’t respect a man who won’t drink. Move, {{name}}.',
  ],
  [CHARACTER_SLUGS.FITNESS_COACH]: [
    'Dry muscle is dead muscle, {{name}}! Chug 500 ml or that set was cosplay!',
    'Five coffees, zero water. That’s not grit, that’s stupidity. You owe {{debtMl}} ml.',
    'Order: 300 ml. Mouth shut. Drink until your gut remembers it has a job.',
    'A protein shake without water is expensive dust. 500 ml. Immediately.',
    'Rest day is not a dehydration holiday. Four hundred ml. Move.',
    'You want a pump and your cells are a desert. No water, no muscle. Drink.',
    'Your form is garbage if your blood is jam. Glass. Now. {{name}}.',
    'Sets need water. You skip both. Fix it, you lazy rep.',
  ],
  [CHARACTER_SLUGS.ANGRY_MOM]: [
    'Didn’t I tell you to drink? Your kidneys will throw stones and then you’ll cry, {{name}}!',
    'What kind of child is too proud to lift a glass? Shame. Actual shame.',
    'The neighbor’s kid finished a liter. You’re still glowing into a screen. Disgrace.',
    'Who nurses you when you fold? Not me, if you won’t drink. Now.',
    'I cooked. You won’t even touch water? Pick up that glass, {{name}}.',
    'Don’t you dare sleep dry. You’re {{debtMl}} ml short, you stubborn thing.',
    'I will stand in this kitchen until that glass is empty. Drink.',
    'I did not raise a raisin. Water. This minute.',
  ],
  [CHARACTER_SLUGS.CORPORATE]: [
    '{{name}}, this quarter’s hydration number is a crime scene. 300 ml. Deadline: now.',
    'Walking into the review dehydrated is a career choice. A stupid one. Drink.',
    'Coffee is not a strategy. The bottle is your actual job. {{debtMl}} ml overdue.',
    'Performance note: a dry employee is a slow employee. Align. Drink.',
    'Idle in chat, empty glass. Clear the blocker: 250 ml.',
    'Offsite policy: if you faint, we cut the budget. Drink. That’s the rule, {{name}}.',
    'I will write “cannot operate a glass” in your review. Don’t dare me.',
    'Synergy is fake. Thirst is not. Handle it.',
  ],
  [CHARACTER_SLUGS.DRACULA]: [
    'It isn’t blood you’re missing, {{name}}. Leave that glass empty and I will find you.',
    'I whisper from the dark: thirst is a small death. Drink. Now.',
    'Even in the coffin I count your {{debtMl}} ml debt. Pay it.',
    'Moonlight on dried meat. How pathetic. Drink, or your shadow leaves first.',
    'Curse your laziness. Even I want water tonight. You will drink.',
    'Midnight: your cells are screaming. 400 ml, or a long drought.',
    'I have emptied kingdoms. You cannot finish a glass. Embarrassing, {{name}}.',
    'The night keeps receipts. Your tab is water. Settle it.',
  ],
  [CHARACTER_SLUGS.SERGEANT]: [
    'ATTENTION! 300 ml. Backtalk gets a boot. Execute, {{name}}!',
    'A soldier does not fight dry! What kind of recruit are you? Drain it!',
    'Shift change: no water, no mercy. {{debtMl}} ml. Now!',
    'Eyes front. Drink. The chain of command does not bargain.',
    'Empty canteen, empty soldier. Fill it. Drink it. Finished.',
    'That posture is a joke and the glass is a desert. Fix both.',
    'I count to three. The glass is empty. One.',
    'Hydration is kit, not a hobby. Carry it. Use it. {{name}}.',
  ],
  [CHARACTER_SLUGS.TAXI]: [
    'You’re jammed like rush hour from thirst! Horn’s down: DRINK, {{name}}!',
    'Passenger wants water, your glass is a ghost. Meter’s running. {{debtMl}} ml fare.',
    'A red light is long enough to drink. Why are you still waiting?',
    'Lane violation: dehydration. Fine is 400 ml. No haggling.',
    'Air con on, water forgotten. You’re drying out in my back seat. Glass!',
    'I don’t drive corpses. Sip or get out, {{name}}.',
    'This route ends at the tap. Move the car that is your body.',
    'You tip strangers and starve your kidneys. Brilliant priorities.',
  ],
  [CHARACTER_SLUGS.TOXIC_EX]: [
    'Still the same lazy {{name}}. Can’t even drink water. Shocked? Please.',
    'So this is the upgrade. Dry and pathetic. At least fill the glass.',
    'I left and I still hydrated. You’re {{debtMl}} ml behind. Textbook you.',
    'You can post a story and you can’t lift a glass. Drink. It’s humiliating.',
    'Dump the thirst the way you dumped me. 300 ml. Now.',
    'Skip the ego. Drink. Save the kidneys this time, not the image.',
    'I used to nag. Now an app does. You’re still failing. Impressive.',
    'One glass. Even you might survive that. Maybe.',
  ],
  [CHARACTER_SLUGS.ER_DOCTOR]: [
    'Chart: {{name}} is dry. Treatment is 500 ml by mouth. Not a suggestion.',
    'Dark urine is a siren. Stone risk is climbing. Drink, or meet the scanner.',
    'You want a drip, {{name}}? Earn it with a glass. {{debtMl}} ml behind.',
    'The ER is packed. Don’t tour it for pride. Drink, finish, repeat.',
    'Since you need it shouted: drink the water. That’s the science. Sit down.',
    'Headache, fog, foul mood. Diagnosis: you. Prescription: water.',
    'I don’t keep a bed for someone who won’t sip. Drink before I write “stubborn”.',
    'Your vitals are gossiping. They’re saying thirst. Correct the rumor.',
  ],
  [CHARACTER_SLUGS.NIGHT_GUARD]: [
    '03:00. I count your water debt while you sleep, {{name}}. Get up and drink.',
    'Lamp on. Glass empty. That’s neglect. 250 ml. Quietly. Now.',
    'You’re {{debtMl}} ml short of dawn. Night shift doesn’t pardon. Water.',
    'You’re thirsty inside the dream. Wake, sip, go back under.',
    'Door’s locked. The glass should be open. I’ll wait until morning.',
    'I see the untouched bottle. Don’t insult the round.',
    'The building is quiet. Your kidneys are not. Sip.',
    'Last lap: if that glass is still full, I knock. {{name}}.',
  ],
  [CHARACTER_SLUGS.SULTRY]: [
    'Come here, {{name}}. Glass to your mouth. Finish it slowly.',
    'An empty glass makes me mean. Fill it. Let it touch your lip. You owe {{debtMl}} ml.',
    'Let it run off your mouth. Slow. I want to hear the swallow.',
    'You’re dried out. Take it. Sip. Offer it back.',
    'Don’t rush. I like the obeying more than the speed. Drink.',
    'One long pull. Then another. You can thank me after, {{name}}.',
    'Thirst looks desperate on you. Fix your face. Drink.',
    'I don’t beg. The glass does. Listen.',
  ],
  [CHARACTER_SLUGS.GOTHIC_LADY]: [
    'The candle died, {{name}}. Your debt sits in the dark. One sip, or the night stretches.',
    'The grave is quiet. The glass is not. {{debtMl}} ml short. Drink, or the shadow dries.',
    'I keep a list of the thirsty. Your name is on it. Get off.',
    'Black cup, clear water, I don’t care which. Drink before the hour turns.',
    'Your pulse is a dry little drum. Wet it.',
    'The moon doesn’t bargain, {{name}}. Neither do I. Sip.',
    'Roses die prettier than a person who skips this glass.',
    'Come out of the dark with a wet mouth. That’s the whole rite.',
  ],
  [CHARACTER_SLUGS.JAPANESE]: [
    'Please drink, {{name}}. Do not leave the glass empty. やめてください。',
    'The debt is {{debtMl}} ml. Please close it. やめてください。',
    'I am asking softly. The glass is not. Drink.',
    'One sip, then the room may be quiet. やめてください。',
    'Please. I do not want to raise my voice. Drink the water.',
    'The bottle is watching. So am I. Please finish it.',
    '{{name}}, a small glass. Now. Then you may rest. やめてください。',
    'Thirst is rude. Please be polite to your body.',
  ],
};

export const CHARACTER_SAFE_SAMPLE_LINES_EN: Record<string, string[]> = {
  [CHARACTER_SLUGS.NEIGHBOR_BRO]: [
    '{{name}}, time to drink. You’re behind on the goal.',
    'Short reminder: one glass. Your kidneys will notice.',
    'You’re {{debtMl}} ml back. Please drink now.',
    'Phone down, water up. Then you can scroll.',
  ],
  [CHARACTER_SLUGS.FITNESS_COACH]: [
    'Muscles are waiting on water. 500 ml, or the session is sloppy.',
    'Rest day still needs a drink. 400 ml.',
    '{{name}}, dry training is wasted training. Sip.',
    'Between sets: water. After sets: water. Start now.',
  ],
  [CHARACTER_SLUGS.ANGRY_MOM]: [
    'I told you: drink. One glass, for the kidneys.',
    '{{name}}, don’t go hours without water. A glass is enough.',
    'You’ll feel better after you drink. Please, now.',
    'I’m not nagging. I’m reminding. The glass is right there.',
  ],
  [CHARACTER_SLUGS.CORPORATE]: [
    'Hydration slipped to yellow. Action: 300 ml, deadline now.',
    '{{name}}, coffee is not the plan. Water is.',
    '{{debtMl}} ml overdue. Clear it before the next meeting.',
    'Owner of the bottle: you. Status: empty. Fix.',
  ],
  [CHARACTER_SLUGS.DRACULA]: [
    'It isn’t blood. You’re low on water. Sip, and the night eases.',
    '{{name}}, the glass is a small lantern. Light it.',
    'You owe {{debtMl}} ml before dawn. Pay gently.',
    'Even the dark prefers you hydrated. Drink.',
  ],
  [CHARACTER_SLUGS.SERGEANT]: [
    'ATTENTION. Order: 300 ml. Execute with discipline.',
    '{{name}}, canteen check. Fill it. Drink it.',
    'No debate. Water, then you may continue.',
    'Shift note: {{debtMl}} ml outstanding. Clear it.',
  ],
  [CHARACTER_SLUGS.TAXI]: [
    'If thirst has you stuck, drink a glass.',
    '{{name}}, the meter on your body is running. Water.',
    'Red light rule: one sip before you move.',
    'You’re {{debtMl}} ml off route. Correct it.',
  ],
  [CHARACTER_SLUGS.TOXIC_EX]: [
    'Small reminder: don’t postpone the glass. One is enough.',
    '{{name}}, you can do this one ordinary thing. Drink.',
    '{{debtMl}} ml behind. Catch up without the drama.',
    'Future you is less cranky if you drink now.',
  ],
  [CHARACTER_SLUGS.ER_DOCTOR]: [
    'Note: mild dehydration risk. Treatment: 500 ml by mouth.',
    '{{name}}, dark urine means drink sooner, not later.',
    'Start with a glass. {{debtMl}} ml still open.',
    'Simple protocol: drink, finish, carry on.',
  ],
  [CHARACTER_SLUGS.NIGHT_GUARD]: [
    '03:00. You owe water. Get up, sip, sleep again.',
    '{{name}}, the lamp is on and the glass is full. Swap that.',
    '{{debtMl}} ml before morning. Quiet sip.',
    'Last round. Please drink.',
  ],
  [CHARACTER_SLUGS.SULTRY]: [
    'A glass of water. Drink it slowly.',
    '{{name}}, bring it to your mouth. No rush.',
    'Empty glass, restless night. Fill it.',
    'One slow sip. Then another.',
  ],
  [CHARACTER_SLUGS.GOTHIC_LADY]: [
    'The night keeps a water debt. Take one sip.',
    '{{name}}, the candle can wait. The glass cannot.',
    '{{debtMl}} ml in the dark. Drink, then rest.',
    'A small sip keeps the hour kind.',
  ],
  [CHARACTER_SLUGS.JAPANESE]: [
    'Please drink a glass of water. Now.',
    '{{name}}, please don’t leave it empty.',
    'A small sip is enough to start. Please.',
    'You owe {{debtMl}} ml. Please begin.',
  ],
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

function pickIndexedLine(lines: string[], salt?: string): string {
  if (!salt) return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
  let hash = 2166136261;
  for (let i = 0; i < salt.length; i++) {
    hash ^= salt.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return lines[(hash >>> 0) % lines.length] ?? lines[0];
}

export function sampleLineForCharacter(
  slug: string | null | undefined,
  plus18Mode = true,
  locale: AppLocale = 'tr',
  salt?: string,
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
  const lines = pool[key];
  const list = Array.isArray(lines) ? lines : lines ? [lines] : [];
  if (!list.length) {
    return t(locale, plus18Mode ? 'tone.fallbackPlus18' : 'tone.fallbackSafe');
  }
  return pickIndexedLine(list, salt);
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
