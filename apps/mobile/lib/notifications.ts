import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { api } from '@/lib/api';
import { playIncomingThreat } from '@/lib/live-threat';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const active = AppState.currentState === 'active';
    return {
      shouldPlaySound: !active,
      shouldSetBadge: false,
      shouldShowBanner: !active,
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

function speakOnce(notification: Notifications.Notification) {
  const data = notification.request.content.data as
    | {
        locale?: string;
        characterSlug?: string;
        yameteSound?: boolean;
        threatId?: string;
      }
    | undefined;
  const key =
    typeof data?.threatId === 'string' && data.threatId
      ? data.threatId
      : notification.request.identifier;
  const locale =
    data?.locale === 'en' || data?.locale === 'tr' ? data.locale : undefined;
  void playIncomingThreat({
    key,
    text: notification.request.content.body ?? '',
    characterSlug: data?.characterSlug,
    locale,
    yameteSound: data?.yameteSound === true,
  });
}

function isRecent(date: number) {
  const ms = date > 1e12 ? date : date * 1000;
  return Date.now() - ms < 2 * 60 * 1000;
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
    if (response && isRecent(response.notification.date)) {
      speakOnce(response.notification);
    }
  });

  return () => {
    received.remove();
    response.remove();
    subscribed = false;
  };
}
