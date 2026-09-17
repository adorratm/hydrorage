import { NavLink, Outlet, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted" style={{ padding: '2rem' }}>Yükleniyor…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          HydroRage
          <span>Admin</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Özet
          </NavLink>
          <NavLink to="/landing">Landing</NavLink>
          <NavLink to="/users">Kullanıcılar</NavLink>
          <NavLink to="/characters">Karakterler</NavLink>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/queues`}
            target="_blank"
            rel="noreferrer"
          >
            Kuyruklar ↗
          </a>
        </nav>
        <div className="sidebar__foot">
          <div className="who">{user?.email}</div>
          <button type="button" className="btn btn--ghost" onClick={logout}>
            Çıkış
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
