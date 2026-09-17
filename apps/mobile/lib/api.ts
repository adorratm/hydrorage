import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storageDelete, storageGet, storageSet } from '@/lib/storage';

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
}

export async function clearSession() {
  await storageDelete(ACCESS_KEY);
  await storageDelete(REFRESH_KEY);
  await storageDelete(USER_KEY);
}

export async function getStoredUser() {
  const raw = await storageGet(USER_KEY);
  return raw
    ? (JSON.parse(raw) as { id: string; email: string; displayName: string })
    : null;
}

async function getAccess() {
  return storageGet(ACCESS_KEY);
}

async function refreshAccess(): Promise<string | null> {
  const refreshToken = await storageGet(REFRESH_KEY);
  if (!refreshToken) return null;
  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    await clearSession();
    return null;
  }
  const data = await res.json();
  await saveSession(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    data.user,
  );
  return data.accessToken as string;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
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
