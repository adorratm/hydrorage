import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';

let webAudio: HTMLAudioElement | null = null;
let nativePlayer: { remove: () => void; playing: boolean } | null = null;

async function stopCurrent() {
  if (Platform.OS === 'web') {
    if (webAudio) {
      webAudio.pause();
      webAudio.src = '';
      webAudio = null;
    }
    return;
  }
  if (nativePlayer) {
    try {
      nativePlayer.remove();
    } catch {
      /* ignore */
    }
    nativePlayer = null;
  }
}

function playWebMp3(base64: string): Promise<void> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  webAudio = audio;

  return new Promise((resolve, reject) => {
    const finish = () => {
      URL.revokeObjectURL(url);
      if (webAudio === audio) webAudio = null;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (webAudio === audio) webAudio = null;
      reject(new Error('Tarayıcı ses çalamadı'));
    };
    void audio.play().catch(reject);
  });
}

async function playNativeMp3(base64: string): Promise<void> {
  const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
  await stopCurrent();

  const uri = `data:audio/mpeg;base64,${base64}`;
  const player = createAudioPlayer({ uri });
  nativePlayer = player as unknown as { remove: () => void; playing: boolean };
  player.play();

  await new Promise<void>((resolve) => {
    const started = Date.now();
    const tick = setInterval(() => {
      const idle =
        !player.playing && Date.now() - started > 400 && player.currentTime > 0;
      const timeout = Date.now() - started > 30000;
      if (idle || timeout) {
        clearInterval(tick);
        try {
          player.remove();
        } catch {
          /* ignore */
        }
        if (nativePlayer === player) nativePlayer = null;
        resolve();
      }
    }, 200);
  });
}

async function speakViaApi(text: string, characterSlug?: string) {
  if (__DEV__) {
    console.log('[TTS] API isteği…', text.slice(0, 40), characterSlug ?? '');
  }
  const data = await api<{ mimeType: string; audioBase64: string }>('/tts', {
    method: 'POST',
    body: JSON.stringify({
      text,
      ...(characterSlug ? { characterSlug } : {}),
    }),
  });
  if (!data.audioBase64) {
    throw new Error('TTS boş yanıt döndü');
  }
  if (__DEV__) {
    console.log('[TTS] MP3 alındı', Math.round(data.audioBase64.length / 1024), 'KB');
  }

  await stopCurrent();
  if (Platform.OS === 'web') {
    await playWebMp3(data.audioBase64);
  } else {
    await playNativeMp3(data.audioBase64);
  }
}

export async function speakThreat(
  text: string,
  muted = false,
  opts?: { forceSpeak?: boolean; characterSlug?: string },
) {
  const forceSpeak = opts?.forceSpeak === true;
  if (muted && !forceSpeak) {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Alert.alert(
        'Ses kapalı',
        'Ofis sessiz modu veya sesli bildirimler kapalı.',
      );
    }
    return;
  }

  try {
    await speakViaApi(text, opts?.characterSlug);
  } catch (e) {
    console.warn('[TTS] API başarısız', e);
    Alert.alert(
      'Ses çalınamadı',
      e instanceof Error
        ? e.message
        : 'Türkçe TTS servisine ulaşılamadı (API ayakta mı? giriş yaptın mı?)',
    );
  }
}

export function stopSpeech() {
  void stopCurrent();
}

export async function hasTurkishVoice(): Promise<boolean> {
  return true;
}
