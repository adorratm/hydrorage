import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWaterReminder(
  minutesFromNow: number,
  body: string,
) {
  await ensureNotificationPermissions();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rage', {
      name: 'HydroRage Tehditleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5555',
    });
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'HydroRage — İç lan!',
      body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'rage' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, minutesFromNow * 60),
    },
  });
}
