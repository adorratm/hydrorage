import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth';
import { LocaleToggle, useLocale } from './locale';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  if (loading)
    return (
      <p className="muted" style={{ padding: '2rem' }}>
        {t('common.loading')}
      </p>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const close = () => setMenuOpen(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className={`shell${menuOpen ? ' is-nav-open' : ''}`}>
      <aside className="sidebar" id="admin-nav">
        <div className="sidebar__brand">
          HydroRage
          <span>Admin</span>
        </div>
        <nav className="nav" onClick={close}>
          <NavLink to="/" end>
            {t('admin.nav.overview')}
          </NavLink>
          <NavLink to="/landing">{t('admin.nav.landing')}</NavLink>
          <NavLink to="/users">{t('admin.nav.users')}</NavLink>
          <NavLink to="/characters">{t('admin.nav.characters')}</NavLink>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/queues`}
            target="_blank"
            rel="noreferrer"
          >
            {t('admin.nav.overview') === 'Overview' ? 'Queues ↗' : 'Kuyruklar ↗'}
          </a>
        </nav>
        <div className="sidebar__foot">
          <div className="who">{user?.email}</div>
          <LocaleToggle />
          <button type="button" className="btn btn--ghost" onClick={logout}>
            {t('admin.nav.logout')}
          </button>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="topbar__burger" aria-hidden />
            {t('admin.nav.menu')}
          </button>
          <div className="topbar__brand">
            HydroRage <span>Admin</span>
          </div>
          <div className="topbar__actions">
            <LocaleToggle />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={logout}
            >
              {t('admin.nav.logout')}
            </button>
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label={t('common.close')}
          onClick={close}
        />
      ) : null}
    </div>
  );
}
