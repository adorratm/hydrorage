const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ACCESS_KEY = 'hr_admin_access';
const REFRESH_KEY = 'hr_admin_refresh';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function saveSession(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function googleStartUrl() {
  const returnTo = window.location.origin;
  return `${API_URL}/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Oturum sona erdi');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `İstek başarısız (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export type Overview = {
  userCount: number;
  intakeLast7d: number;
  threatsLast7d: number;
  recentUsers: AdminUser[];
  characters: CharacterRow[];
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  provider: string;
  streakDays: number;
  dailyGoalMl: number;
  createdAt: string;
  avatarUrl: string | null;
};

export type AdminUserDetail = AdminUser & {
  lastGoalDate: string | null;
  plus18Mode: boolean;
  onboardingCompleted: boolean;
  voiceNotifications: boolean;
  activeCharacter: { id: string; name: string; slug: string } | null;
};

export type ActivityType = 'intake' | 'threat' | 'routine';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  summary: string;
  detail: string | null;
  amountMl: number | null;
  status: string | null;
  at: string;
};

export type ActivityPage = {
  items: ActivityItem[];
  total: number;
  limit: number;
  offset: number;
};

export type CharacterRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  badge: string | null;
  maxDb: number;
  unlockStreakDays: number;
};
