import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AppShell, RequireAuth } from './AppShell';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';
import { CharactersPage } from './pages/CharactersPage';
import { LandingCmsPage } from './pages/LandingCmsPage';
import './styles.css';

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted" style={{ padding: '2rem' }}>Yükleniyor…</p>;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="landing" element={<LandingCmsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="characters" element={<CharactersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
