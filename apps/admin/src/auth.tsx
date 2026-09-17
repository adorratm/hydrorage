import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  clearSession,
  getAccessToken,
  saveSession,
} from './lib/api';

type AuthUser = { userId: string; email: string };

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  completeLogin: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<AuthUser>('/admin/me')
      .then(setUser)
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const completeLogin = useCallback(
    async (accessToken: string, refreshToken: string) => {
      saveSession(accessToken, refreshToken);
      const me = await api<AuthUser>('/admin/me');
      setUser(me);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, completeLogin, logout }),
    [user, loading, completeLogin, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
