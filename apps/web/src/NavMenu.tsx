import { useEffect, useState, type ReactNode } from 'react';
import { useLocale } from './locale';

export function NavMenu({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={`nav-menu${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="nav-menu__toggle"
        aria-expanded={open}
        aria-label={open ? t('web.nav.close') : t('web.nav.menu')}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      {open ? (
        <button
          type="button"
          className="nav-menu__backdrop"
          aria-label={t('web.nav.close')}
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="nav-links" onClick={() => setOpen(false)}>
        {children}
      </div>
    </div>
  );
}
