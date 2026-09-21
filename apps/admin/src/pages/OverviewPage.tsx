import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Overview } from '../lib/api';
import { useLocale } from '../locale';

export function OverviewPage() {
  const { t } = useLocale();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>('/admin/overview')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">{t('common.loading')}</p>;

  return (
    <>
      <h1 className="page-title">{t('admin.overview.title')}</h1>
      <p className="page-sub">Son 7 gün ve genel metrikler</p>

      <div className="grid-stats">
        <div className="stat">
          <span className="stat__label">Kullanıcı</span>
          <span className="stat__value">{data.userCount}</span>
        </div>
        <div className="stat">
          <span className="stat__label">{t('admin.overview.drinks7d')}</span>
          <span className="stat__value">{data.intakeLast7d}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Tehdit (7g)</span>
          <span className="stat__value">{data.threatsLast7d}</span>
        </div>
        <div className="stat">
          <span className="stat__label">{t('admin.characters.title')}</span>
          <span className="stat__value">{data.characters.length}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">{t('admin.overview.recent')}</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>İsim</th>
                <th>E-posta</th>
                <th>Streak</th>
                <th>Sağlayıcı</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/users/${u.id}`}>{u.displayName}</Link>
                  </td>
                  <td>
                    <Link to={`/users/${u.id}`}>{u.email}</Link>
                  </td>
                  <td>{u.streakDays}d</td>
                  <td>{u.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
