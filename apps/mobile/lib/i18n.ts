import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  t as sharedT,
  type AppLocale,
  type I18nKey,
} from '@hydrorage/shared';

export type { AppLocale, I18nKey };

const STORAGE_KEY = 'hydrorage.locale';

let currentLocale: AppLocale = 'tr';
const listeners = new Set<() => void>();

export function getLocale(): AppLocale {
  return currentLocale;
}

/** Prefer useT() in components so locale switches re-render. */
export function t(key: I18nKey): string {
  return sharedT(currentLocale, key);
}

export async function loadLocale() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'tr') {
    currentLocale = stored;
    listeners.forEach((l) => l());
  }
}

export async function setLocale(locale: AppLocale) {
  currentLocale = locale;
  await AsyncStorage.setItem(STORAGE_KEY, locale);
  listeners.forEach((l) => l());
}

export function useLocale(): AppLocale {
  const [locale, set] = useState(currentLocale);
  useEffect(() => {
    const fn = () => set(currentLocale);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return locale;
}

export function useT() {
  const locale = useLocale();
  return useCallback((key: I18nKey) => sharedT(locale, key), [locale]);
}
