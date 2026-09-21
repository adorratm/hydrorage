/** UI metin tonu: +18 (küfürlü) vs güvenli mod */

import { t as sharedT, type AppLocale } from '@hydrorage/shared';
import { getLocale } from '@/lib/i18n';

export type ToneSettings = {
  plus18Mode?: boolean;
};

export function isPlus18(settings?: ToneSettings | null): boolean {
  return settings?.plus18Mode !== false;
}

export function headerBadge(plus18: boolean, locale: AppLocale = getLocale()) {
  return sharedT(locale, plus18 ? 'tone.badgePlus18' : 'tone.badgeSafe');
}

export function notificationTitle(
  plus18: boolean,
  locale: AppLocale = getLocale(),
) {
  return sharedT(
    locale,
    plus18 ? 'tone.notifTitlePlus18' : 'tone.notifTitleSafe',
  );
}

export function fallbackThreat(
  plus18: boolean,
  locale: AppLocale = getLocale(),
) {
  return sharedT(
    locale,
    plus18 ? 'tone.fallbackPlus18' : 'tone.fallbackSafe',
  );
}

export function caffeineAlertBody(
  plus18: boolean,
  locale: AppLocale = getLocale(),
) {
  return sharedT(
    locale,
    plus18 ? 'tone.caffeinePlus18' : 'tone.caffeineSafe',
  );
}
