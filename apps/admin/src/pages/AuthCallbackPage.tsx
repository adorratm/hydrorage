import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useLocale } from '../locale';

export function AuthCallbackPage() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) {
      setError(t('admin.auth.fail'));
      return;
    }
    completeLogin(accessToken, refreshToken)
      .then(() => navigate('/', { replace: true }))
      .catch((e: Error) => setError(e.message || t('admin.auth.fail')));
  }, [completeLogin, navigate, t]);

  if (error) {
    return (
      <div className="login">
        <div className="login__card">
          <h1>HydroRage</h1>
          <p className="error">{error}</p>
          <a className="btn btn--ghost" href="/login">
            {t('common.retry')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <p className="muted">{t('admin.auth.opening')}</p>
    </div>
  );
}
