import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { localeTag } from '@hydrorage/shared';
import { api, type AdminUser } from '../lib/api';
import { useLocale } from '../locale';

export function UsersPage() {
  const { t, locale } = useLocale();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminUser[]>('/admin/users?limit=100')
      .then(setUsers)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!users) return <p className="muted">{t('common.loading')}</p>;

  return (
    <>
      <h1 className="page-title">{t('admin.users.title')}</h1>
      <p className="page-sub">
        {users.length} {locale === 'en' ? 'records' : 'kayıt'}
      </p>
      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'en' ? 'Name' : 'İsim'}</th>
                <th>{locale === 'en' ? 'Email' : 'E-posta'}</th>
                <th>{locale === 'en' ? 'Goal' : 'Hedef'}</th>
                <th>Streak</th>
                <th>{locale === 'en' ? 'Joined' : 'Kayıt'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/users/${u.id}`}>{u.displayName}</Link>
                  </td>
                  <td>
                    <Link to={`/users/${u.id}`}>{u.email}</Link>
                  </td>
                  <td>{u.dailyGoalMl} ml</td>
                  <td>{u.streakDays}d</td>
                  <td>
                    {new Date(u.createdAt).toLocaleDateString(localeTag(locale))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
