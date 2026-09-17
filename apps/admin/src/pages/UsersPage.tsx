import { useEffect, useState } from 'react';
import { api, type AdminUser } from '../lib/api';

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminUser[]>('/admin/users?limit=100')
      .then(setUsers)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!users) return <p className="muted">Yükleniyor…</p>;

  return (
    <>
      <h1 className="page-title">Kullanıcılar</h1>
      <p className="page-sub">{users.length} kayıt</p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>İsim</th>
              <th>E-posta</th>
              <th>Hedef</th>
              <th>Streak</th>
              <th>Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName}</td>
                <td>{u.email}</td>
                <td>{u.dailyGoalMl} ml</td>
                <td>{u.streakDays}g</td>
                <td>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
