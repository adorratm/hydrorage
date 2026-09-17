import { useMemo } from 'react';
import { googleStartUrl } from '../lib/api';

export function LoginPage() {
  const error = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get('error');
    return q;
  }, []);

  return (
    <div className="login">
      <div className="login__card">
        <h1>HydroRage</h1>
        <p>
          Admin paneline Google ile giriş yap. Yalnızca yetkili e-postalar
          kabul edilir.
        </p>
        {error ? <div className="error">Google: {error}</div> : null}
        <a className="btn btn--primary" href={googleStartUrl()}>
          Google ile devam et
        </a>
      </div>
    </div>
  );
}
