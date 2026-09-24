import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const active = AppState.currentState === 'active';
    return {
      shouldPlaySound: !active,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export async function ensureNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Expo push token alıp API'ye kaydet (sunucu hatırlatmaları için). */
export async function registerExpoPushToken() {
  if (Platform.OS === 'web') return null;
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  const projectId =
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas
      ?.projectId;

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResult.data;
    await api('/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return token;
  } catch (e) {
    console.warn('[push] token alınamadı', e);
    return null;
  }
}

async function voiceAllowed(): Promise<{
  ok: boolean;
  muted: boolean;
  whisper: boolean;
  whisperVolume: number;
  characterSlug?: string;
}> {
  try {
    const settings = await api<{
      voiceNotifications: boolean;
      officeMute: boolean;
      nightMode: boolean;
      nightStartHour: number;
      nightEndHour: number;
      publicShameProtection: boolean;
      whisperVolume: number;
      activeCharacter?: { slug?: string } | null;
    }>('/settings');

    if (!settings.voiceNotifications) {
      return { ok: false, muted: true, whisper: false, whisperVolume: 45 };
    }

    const hour = new Date().getHours();
    const start = settings.nightStartHour ?? 23;
    const end = settings.nightEndHour ?? 8;
    const inNight =
      settings.nightMode &&
      (start > end ? hour >= start || hour < end : hour >= start && hour < end);

    const shame = settings.publicShameProtection !== false;
    const quiet = settings.officeMute || inNight;

    if (quiet && shame) {
      // Utanç koruması: ses yok, sadece titreşim / düşük whisper
      return {
        ok: true,
        muted: settings.whisperVolume <= 0,
        whisper: settings.whisperVolume > 0,
        whisperVolume: settings.whisperVolume ?? 45,
        characterSlug: settings.activeCharacter?.slug,
      };
    }

    if (quiet && !shame) {
      return { ok: false, muted: true, whisper: false, whisperVolume: 45 };
    }

    return {
      ok: true,
      muted: false,
      whisper: false,
      whisperVolume: 100,
      characterSlug: settings.activeCharacter?.slug,
    };
  } catch {
    return { ok: true, muted: false, whisper: false, whisperVolume: 100 };
  }
}

const spokenIds = new Set<string>();

async function speakNotificationBody(
  body: string | null | undefined,
  data?: { locale?: string; characterSlug?: string; yameteSound?: boolean },
) {
  const text = (body ?? '').trim();
  if (!text) return;
  const { ok, muted, whisper, whisperVolume, characterSlug } =
    await voiceAllowed();
  if (!ok) return;
  const locale = data?.locale === 'en' || data?.locale === 'tr' ? data.locale : undefined;
  await speakThreat(text, muted, {
    characterSlug: data?.characterSlug || characterSlug,
    locale,
    silent: true,
    volume: whisper ? Math.max(0.05, whisperVolume / 100) : 1,
    yameteSound: data?.yameteSound === true,
  });
}

function speakOnce(notification: Notifications.Notification) {
  const id = notification.request.identifier;
  if (spokenIds.has(id)) return;
  spokenIds.add(id);
  const data = notification.request.content.data as
    | { locale?: string; characterSlug?: string; yameteSound?: boolean }
    | undefined;
  void speakNotificationBody(notification.request.content.body, data);
}

let subscribed = false;

export function startNotificationSpeechListeners() {
  if (subscribed || Platform.OS === 'web') return () => undefined;
  subscribed = true;

  const received = Notifications.addNotificationReceivedListener((n) => {
    if (AppState.currentState !== 'active') return;
    speakOnce(n);
  });

  const response = Notifications.addNotificationResponseReceivedListener((r) => {
    speakOnce(r.notification);
  });

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) speakOnce(response.notification);
  });

  return () => {
    received.remove();
    response.remove();
    subscribed = false;
  };
}
