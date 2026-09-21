import { useMemo } from 'react';
import { googleStartUrl } from '../lib/api';
import { LocaleToggle, useLocale } from '../locale';

export function LoginPage() {
  const { t, locale } = useLocale();
  const error = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get('error');
    return q;
  }, []);

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__lang">
          <LocaleToggle />
        </div>
        <h1>HydroRage</h1>
        <p>
          {locale === 'en'
            ? 'Sign in to the admin panel with Google. Only authorized emails are accepted.'
            : 'Admin paneline Google ile giriş yap. Yalnızca yetkili e-postalar kabul edilir.'}
        </p>
        {error ? <div className="error">Google: {error}</div> : null}
        <a className="btn btn--primary" href={googleStartUrl()}>
          {t('admin.login.google')}
        </a>
      </div>
    </div>
  );
}
