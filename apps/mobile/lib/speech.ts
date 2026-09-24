import { stripYametePhrase } from '@hydrorage/shared';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { api } from '@/lib/api';
import { showAlert } from '@/lib/dialog';
import { getLocale } from '@/lib/i18n';

const yameteTail = require('../assets/audio/yamete-kudasai.m4a');

let webAudio: HTMLAudioElement | null = null;
let nativePlayer: {
  remove: () => void;
  pause?: () => void;
  playing: boolean;
} | null = null;
let playTicket = 0;

const FEMALE_SLUGS = new Set([
  'sinirli-balkan-annesi',
  'zehirli-ex',
  'acil-doktor',
  'seksi-ses',
  'gotik-leydi',
  'japon-ses',
]);

const FEMALE_NAME =
  /yelda|emel|samantha|karen|moira|victoria|fiona|kathy|susan|zira|female|jenny|aria|emma|ava/i;

const DEVICE_STYLE: Record<string, { pitch: number; rate: number }> = {
  'ofkeli-mahalle-abisi': { pitch: 0.9, rate: 1.08 },
  'agresif-fitness-kocu': { pitch: 0.72, rate: 1.16 },
  'sinirli-balkan-annesi': { pitch: 1.0, rate: 1.04 },
  'toksik-kurumsal-yonetici': { pitch: 0.95, rate: 0.9 },
  dracula: { pitch: 0.62, rate: 0.86 },
  'cavus-komutan': { pitch: 0.78, rate: 1.2 },
  'taksi-soforu': { pitch: 1.05, rate: 1.12 },
  'zehirli-ex': { pitch: 0.98, rate: 0.92 },
  'acil-doktor': { pitch: 0.92, rate: 0.9 },
  'gece-bekcisi': { pitch: 0.68, rate: 0.88 },
  'seksi-ses': { pitch: 0.94, rate: 0.72 },
  'gotik-leydi': { pitch: 0.78, rate: 0.8 },
  'japon-ses': { pitch: 1.0, rate: 0.82 },
};

type DeviceVoice = Speech.Voice;

let voiceCache: DeviceVoice[] | null = null;

function localeOf(locale?: 'tr' | 'en'): 'tr' | 'en' {
  return locale ?? getLocale();
}

function matchesLocale(language: string, locale: 'tr' | 'en') {
  const tag = language.toLowerCase().replace('_', '-');
  return tag.startsWith(locale === 'en' ? 'en' : 'tr');
}

async function deviceVoices(locale: 'tr' | 'en') {
  if (!voiceCache) {
    try {
      voiceCache = await Speech.getAvailableVoicesAsync();
    } catch {
      voiceCache = [];
    }
  }
  const matched = voiceCache.filter((voice) =>
    matchesLocale(voice.language, locale),
  );
  const enhanced = matched.filter((voice) => voice.quality === Speech.VoiceQuality.Enhanced);
  return (enhanced.length >= 2 ? enhanced : matched).slice().sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function pickDeviceVoice(voices: DeviceVoice[], characterSlug?: string) {
  if (!voices.length) return null;
  const pool =
    characterSlug && FEMALE_SLUGS.has(characterSlug)
      ? voices.filter((voice) => FEMALE_NAME.test(voice.name))
      : voices.filter((voice) => !FEMALE_NAME.test(voice.name));
  const list = pool.length ? pool : voices;
  const seed = characterSlug ?? 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return list[hash % list.length];
}

function speakViaDevice(
  text: string,
  locale: 'tr' | 'en',
  voice: DeviceVoice,
  characterSlug?: string,
  volume = 1,
) {
  const style = DEVICE_STYLE[characterSlug ?? ''] ?? { pitch: 1, rate: 1 };
  return new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      voice: voice.identifier,
      language: locale === 'en' ? 'en-US' : 'tr-TR',
      pitch: style.pitch,
      rate: style.rate,
      volume: Math.min(1, Math.max(0, volume)),
      useApplicationAudioSession: false,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => reject(new Error('Cihaz sesi çalınamadı')),
    });
  });
}

async function stopCurrent() {
  try {
    await Speech.stop();
  } catch {
    /* ignore */
  }
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
      nativePlayer.pause?.();
      nativePlayer.remove();
    } catch {
      /* ignore */
    }
    nativePlayer = null;
  }
}

function playWebUrl(url: string, volume = 1, ticket = playTicket): Promise<void> {
  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));
  webAudio = audio;

  return new Promise((resolve, reject) => {
    const finish = () => {
      if (webAudio === audio) webAudio = null;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = () => {
      if (webAudio === audio) webAudio = null;
      reject(new Error('Tarayıcı ses çalamadı'));
    };
    if (ticket !== playTicket) {
      finish();
      return;
    }
    void audio.play().catch(reject);
  });
}

function playWebMp3(base64: string, volume = 1): Promise<void> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));
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

async function playNativeMp3(base64: string, volume = 1): Promise<void> {
  const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    shouldPlayInBackground: true,
  });
  await stopCurrent();

  const uri = `data:audio/mpeg;base64,${base64}`;
  const player = createAudioPlayer({ uri });
  try {
    player.volume = Math.min(1, Math.max(0, volume));
  } catch {
    /* ignore */
  }
  nativePlayer = player as unknown as {
    remove: () => void;
    pause?: () => void;
    playing: boolean;
  };
  player.play();

  const ticket = playTicket;
  await new Promise<void>((resolve) => {
    const started = Date.now();
    const tick = setInterval(() => {
      if (ticket !== playTicket || nativePlayer !== player) {
        clearInterval(tick);
        resolve();
        return;
      }
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

let speaking = false;

export function isSpeechActive() {
  return speaking;
}

async function speakViaApi(
  text: string,
  characterSlug?: string,
  volume = 1,
  locale?: 'tr' | 'en',
  ticket = playTicket,
) {
  if (__DEV__) {
    console.log('[TTS] API isteği…', text.slice(0, 40), characterSlug ?? '');
  }
  const data = await api<{ mimeType: string; audioBase64: string }>('/tts', {
    method: 'POST',
    body: JSON.stringify({
      text,
      locale: locale ?? getLocale(),
      ...(characterSlug ? { characterSlug } : {}),
    }),
  });
  if (!data.audioBase64) {
    throw new Error('TTS boş yanıt döndü');
  }
  if (__DEV__) {
    console.log('[TTS] MP3 alındı', Math.round(data.audioBase64.length / 1024), 'KB');
  }

  if (ticket !== playTicket) return;
  await stopCurrent();
  if (ticket !== playTicket) return;
  if (Platform.OS === 'web') {
    await playWebMp3(data.audioBase64, volume);
  } else {
    await playNativeMp3(data.audioBase64, volume);
  }
}

async function playYameteRecording(volume: number, ticket: number) {
  if (ticket !== playTicket) return;
  if (Platform.OS === 'web') {
    const { Asset } = await import('expo-asset');
    const asset = Asset.fromModule(yameteTail);
    if (!asset.downloaded) await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri || ticket !== playTicket) return;
    await playWebUrl(uri, volume, ticket);
    return;
  }

  const { Asset } = await import('expo-asset');
  const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
  const asset = Asset.fromModule(yameteTail);
  if (!asset.downloaded) await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri || ticket !== playTicket) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    shouldPlayInBackground: true,
  });
  const player = createAudioPlayer({ uri });
  try {
    player.volume = Math.min(1, Math.max(0, volume));
  } catch {
    /* ignore */
  }
  nativePlayer = player as unknown as {
    remove: () => void;
    pause?: () => void;
    playing: boolean;
  };
  player.play();

  await new Promise<void>((resolve) => {
    const started = Date.now();
    const tick = setInterval(() => {
      if (ticket !== playTicket || nativePlayer !== player) {
        clearInterval(tick);
        resolve();
        return;
      }
      const idle =
        !player.playing && Date.now() - started > 400 && player.currentTime > 0;
      const timeout = Date.now() - started > 20000;
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

export async function speakThreat(
  text: string,
  muted = false,
  opts?: {
    forceSpeak?: boolean;
    characterSlug?: string;
    locale?: 'tr' | 'en';
    silent?: boolean;
    volume?: number;
    yameteSound?: boolean;
  },
) {
  const forceSpeak = opts?.forceSpeak === true;
  if (muted && !forceSpeak) {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (!opts?.silent) {
      showAlert(
        'Ses kapalı',
        'Ofis sessiz modu veya sesli bildirimler kapalı.',
      );
    }
    return;
  }

  const locale = localeOf(opts?.locale);
  const volume = opts?.volume ?? 1;
  const playSound = opts?.yameteSound === true || text.includes('やめて');
  const line = stripYametePhrase(text);
  const ticket = ++playTicket;
  await stopCurrent();
  try {
    speaking = true;
    if (!line) {
      if (playSound) await playYameteRecording(volume, ticket);
      return;
    }
    const voices = await deviceVoices(locale);
    const voice = pickDeviceVoice(voices, opts?.characterSlug);
    const bothGenders =
      voices.some((item) => FEMALE_NAME.test(item.name)) &&
      voices.some((item) => !FEMALE_NAME.test(item.name));
    // Karakter seçiliyse veya cihazda kadın+erkek ses yoksa API.
    // Simülatör ses kimliğini yok sayıp herkesi aynı tonda okur.
    const preferDevice = !opts?.characterSlug && bothGenders && voices.length >= 2;
    if (voice && preferDevice) {
      try {
        await stopCurrent();
        await speakViaDevice(line, locale, voice, opts?.characterSlug, volume);
        if (playSound) await playYameteRecording(volume, ticket);
        return;
      } catch (e) {
        console.warn('[TTS] cihaz sesi başarısız, API’ye düşülüyor', e);
      }
    }
    try {
      await speakViaApi(line, opts?.characterSlug, volume, locale, ticket);
      if (playSound) await playYameteRecording(volume, ticket);
    } catch (e) {
      if (voice) {
        await stopCurrent();
        await speakViaDevice(line, locale, voice, opts?.characterSlug, volume);
        if (playSound) await playYameteRecording(volume, ticket);
        return;
      }
      throw e;
    }
  } catch (e) {
    console.warn('[TTS] API başarısız', e);
    if (opts?.silent) return;
    showAlert(
      'Ses çalınamadı',
      e instanceof Error
        ? e.message
        : 'Ses servisine ulaşılamadı',
    );
  } finally {
    if (ticket === playTicket) speaking = false;
  }
}

export function stopSpeech() {
  void stopCurrent();
}

export async function hasTurkishVoice(): Promise<boolean> {
  return true;
}
