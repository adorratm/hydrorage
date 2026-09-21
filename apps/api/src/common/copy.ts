import {
  fillTemplate,
  sampleLineForCharacter,
  t,
  type AppLocale,
} from '@hydrorage/shared';

export function statusLabelFor(percent: number, locale: AppLocale): string {
  if (percent >= 100) return t(locale, 'api.status.locked');
  if (percent < 40) return t(locale, 'api.status.rage');
  if (percent < 70) return t(locale, 'api.status.ok');
  return t(locale, 'api.status.good');
}

export function firstNameLocalized(
  displayName: string | null | undefined,
  locale: AppLocale,
): string {
  const raw = (displayName ?? '').trim();
  if (!raw) return t(locale, 'api.friend');
  return raw.split(/\s+/)[0] || t(locale, 'api.friend');
}

export function threatFallback(
  plus18: boolean,
  locale: AppLocale,
  characterSlug?: string | null,
): string {
  if (characterSlug) {
    return sampleLineForCharacter(characterSlug, plus18, locale);
  }
  return t(
    locale,
    plus18 ? 'api.threat.fallbackPlus18' : 'api.threat.fallbackSafe',
  );
}

export function fillThreatTemplate(
  template: string,
  locale: AppLocale,
  vars: { name: string; debtMl: number },
) {
  return fillTemplate(template, vars);
}

export { t, fillTemplate };
