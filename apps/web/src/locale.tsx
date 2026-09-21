import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  isAppLocale,
  t as sharedT,
  type AppLocale,
  type I18nKey,
} from '@hydrorage/shared';

const STORAGE_KEY = 'hydrorage.locale';

type LocaleCtx = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: I18nKey) => string;
};

const Ctx = createContext<LocaleCtx | null>(null);

function readStored(): AppLocale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isAppLocale(v)) return v;
  } catch {
    /* ignore */
  }
  return 'tr';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    typeof window === 'undefined' ? 'tr' : readStored(),
  );

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      setLocale,
      t: (key: I18nKey) => sharedT(locale, key),
    }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocale outside LocaleProvider');
  return ctx;
}

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={className ?? 'locale-toggle'} role="group" aria-label="Language">
      <button
        type="button"
        className={locale === 'tr' ? 'is-active' : undefined}
        onClick={() => setLocale('tr')}
        aria-pressed={locale === 'tr'}
      >
        TR
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'is-active' : undefined}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  );
}
