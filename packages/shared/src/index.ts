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
  { type: DrinkType.WATER, label: 'Küçük Su', amountMl: 250, icon: 'water-outline' },
  { type: DrinkType.BOTTLE, label: 'Büyük Şişe', amountMl: 500, icon: 'beer-outline' },
  { type: DrinkType.COFFEE, label: 'Kahve / Çay', amountMl: 180, icon: 'cafe-outline', penaltyMl: 50 },
  { type: DrinkType.ELECTROLYTE, label: 'Elektrolit', amountMl: 300, icon: 'flash-outline' },
  { type: DrinkType.MEDICINE, label: 'İlaç + Su', amountMl: 200, icon: 'medkit-outline' },
  { type: DrinkType.PROTEIN, label: 'Protein Shake', amountMl: 400, icon: 'fitness-outline' },
] as const;

export const VOLUME_PRESETS_ML = [100, 250, 330, 500, 1000] as const;

export const CHARACTER_SLUGS = {
  NEIGHBOR_BRO: 'ofkeli-mahalle-abisi',
  FITNESS_COACH: 'agresif-fitness-kocu',
  ANGRY_MOM: 'sinirli-balkan-annesi',
  DRACULA: 'dracula',
  CORPORATE: 'toksik-kurumsal-yonetici',
} as const;

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

export * from './landing';
