import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export async function speakThreat(text: string, muted = false) {
  if (muted) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }
  Speech.stop();
  Speech.speak(text, {
    language: 'tr-TR',
    pitch: 0.95,
    rate: 1.05,
  });
}

export function stopSpeech() {
  Speech.stop();
}
