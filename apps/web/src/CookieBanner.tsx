import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from './locale';

const KEY = 'hr_cookie_ok';

export function CookieBanner() {
  const { locale, t } = useLocale();
  const [visible, setVisible] = useState(false);
  const policyHref = locale === 'en' ? '/cookies' : '/cerez-politikasi';

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-label={t('web.cookie.title')}
    >
      <p>
        {t('web.cookie.body')}{' '}
        <Link to={policyHref}>{t('web.cookie.policy')}</Link>
      </p>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={accept}
        >
          {t('web.cookie.accept')}
        </button>
        <Link className="btn btn--ghost btn--sm" to={policyHref}>
          {t('web.cookie.policy')}
        </Link>
      </div>
    </div>
  );
}
