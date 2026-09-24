import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { storageDelete, storageGet, storageSet } from '@/lib/storage';
import { getLocale } from '@/lib/i18n';

const fallbackHost =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export function getApiBaseUrl() {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) {
    return extra.apiUrl.replace('localhost', fallbackHost);
  }
  return `http://${fallbackHost}:3000/api`;
}

type Tokens = { accessToken: string; refreshToken: string };

const ACCESS_KEY = 'hr_access';
const REFRESH_KEY = 'hr_refresh';
const USER_KEY = 'hr_user';

export async function saveSession(
  tokens: Tokens,
  user: { id: string; email: string; displayName: string },
) {
  await storageSet(ACCESS_KEY, tokens.accessToken);
  await storageSet(REFRESH_KEY, tokens.refreshToken);
  await storageSet(USER_KEY, JSON.stringify(user));
  emitSession(user);
}

type SessionUser = { id: string; email: string; displayName: string };

const sessionListeners = new Set<(user: SessionUser | null) => void>();

export function onSessionChange(listener: (user: SessionUser | null) => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function emitSession(user: SessionUser | null) {
  sessionListeners.forEach((listener) => listener(user));
}

export async function clearSession() {
  await storageDelete(ACCESS_KEY);
  await storageDelete(REFRESH_KEY);
  await storageDelete(USER_KEY);
  emitSession(null);
}

export async function getStoredUser() {
  try {
    const raw = await storageGet(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      id: string;
      email: string;
      displayName: string;
    };
  } catch {
    await clearSession();
    return null;
  }
}

async function getAccess() {
  return storageGet(ACCESS_KEY);
}

function accessExpiresAt(token: string) {
  try {
    const part = token.split('.')[1];
    if (!part || typeof globalThis.atob !== 'function') return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = globalThis.atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = refreshAccessOnce().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function refreshAccessOnce(): Promise<string | null> {
  const refreshToken = await storageGet(REFRESH_KEY);
  if (!refreshToken) return null;
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return storageGet(ACCESS_KEY);
  }
  if (res.status === 401 || res.status === 403) {
    await clearSession();
    return null;
  }
  if (!res.ok) return storageGet(ACCESS_KEY);
  const data = await res.json();
  await saveSession(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    data.user,
  );
  return data.accessToken as string;
}

/** Erişim anahtarı dolmak üzereyse yeniler. Oturumu yalnızca geçersiz refresh kapatır. */
export async function ensureFreshAccess() {
  const token = await getAccess();
  if (!token) return null;
  const exp = accessExpiresAt(token);
  if (exp && exp - Date.now() > 2 * 60 * 1000) return token;
  return refreshAccess();
}

export async function logoutSession() {
  const refreshToken = await storageGet(REFRESH_KEY);
  if (refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* yerelde yine de kapat */
    }
  }
  await clearSession();
}

/** Uygulama açıkken ve öne gelince erişim anahtarını tazeler. */
export function startSessionKeepAlive() {
  let stopped = false;
  const tick = () => {
    if (!stopped) void ensureFreshAccess();
  };
  tick();
  const poll = setInterval(tick, 8 * 60 * 1000);
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') tick();
  });
  return () => {
    stopped = true;
    clearInterval(poll);
    sub.remove();
  };
}

async function request(url: string, options: RequestInit) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error('Sunucuya bağlanılamadı');
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Locale': getLocale(),
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await request(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    const next = await refreshAccess();
    if (next) return api<T>(path, options, false);
    throw new Error('Oturum süresi doldu');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      Array.isArray(err.message) ? err.message.join(', ') : err.message || 'İstek başarısız',
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
