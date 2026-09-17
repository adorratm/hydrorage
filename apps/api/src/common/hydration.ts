import { DrinkType } from '@/database/enums';

const DEHYDRATION_PENALTY_ML: Partial<Record<DrinkType, number>> = {
  [DrinkType.COFFEE]: 50,
  [DrinkType.ESPRESSO]: 150,
  [DrinkType.FILTER_COFFEE]: 200,
  [DrinkType.TEA]: 30,
  [DrinkType.ENERGY]: 100,
  [DrinkType.ALCOHOL]: 500,
};

const NET_HYDRATION_ML: Partial<Record<DrinkType, number>> = {
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

export function computeNetMl(type: DrinkType, amountMl: number) {
  const factor = NET_HYDRATION_ML[type] ?? 1;
  const penaltyMl = DEHYDRATION_PENALTY_ML[type] ?? 0;
  const hydrationFromDrink = Math.round(amountMl * factor);
  const netMl = hydrationFromDrink - penaltyMl;
  return { grossMl: amountMl, penaltyMl, netMl };
}

export function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}
