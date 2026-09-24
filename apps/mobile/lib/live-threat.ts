import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { stripYametePhrase } from '@hydrorage/shared';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { queryClient } from '@/lib/query-provider';
import { speakThreat } from '@/lib/speech';

export type ThreatNotice = {
  key: string;
  title: string;
  body: string;
};

type NoticeListener = (notice: ThreatNotice | null) => void;

const noticeListeners = new Set<NoticeListener>();
let currentNotice: ThreatNotice | null = null;

export function subscribeThreatNotice(listener: NoticeListener) {
  noticeListeners.add(listener);
  listener(currentNotice);
  return () => {
    noticeListeners.delete(listener);
  };
}

function publishNotice(notice: ThreatNotice | null) {
  currentNotice = notice;
  noticeListeners.forEach((listener) => listener(notice));
}

const played = new Set<string>();
let generation = 0;

type VoicePlan = {
  speak: boolean;
  muted: boolean;
  volume: number;
  characterSlug?: string;
  plus18: boolean;
};

async function voicePlan(): Promise<VoicePlan> {
  try {
    const settings = await api<{
      voiceNotifications: boolean;
      officeMute: boolean;
      nightMode: boolean;
      nightStartHour: number;
      nightEndHour: number;
      publicShameProtection: boolean;
      whisperVolume: number;
      plus18Mode?: boolean;
      activeCharacter?: { slug?: string } | null;
    }>('/settings');

    const plus18 = settings.plus18Mode !== false;
    const slug = settings.activeCharacter?.slug;
    if (!settings.voiceNotifications) {
      return { speak: false, muted: true, volume: 1, plus18, characterSlug: slug };
    }

    const hour = new Date().getHours();
    const start = settings.nightStartHour ?? 23;
    const end = settings.nightEndHour ?? 8;
    const inNight =
      settings.nightMode &&
      (start > end ? hour >= start || hour < end : hour >= start && hour < end);
    const quiet = settings.officeMute || inNight;
    const shame = settings.publicShameProtection !== false;

    if (quiet && !shame) {
      return { speak: false, muted: true, volume: 1, plus18, characterSlug: slug };
    }
    if (quiet && shame) {
      const whisper = settings.whisperVolume ?? 45;
      return {
        speak: whisper > 0,
        muted: whisper <= 0,
        volume: Math.max(0.05, whisper / 100),
        plus18,
        characterSlug: slug,
      };
    }
    return { speak: true, muted: false, volume: 1, plus18, characterSlug: slug };
  } catch {
    return { speak: true, muted: false, volume: 1, plus18: true };
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Uygulama öndeyken tehdidi seslendirir ve üst şeridi ses bitene kadar tutar. */
export async function playIncomingThreat(input: {
  key: string;
  text: string;
  characterSlug?: string;
  locale?: 'tr' | 'en';
  yameteSound?: boolean;
}) {
  const text = input.text.trim();
  if (!text || played.has(input.key)) return;
  played.add(input.key);
  if (played.size > 40) {
    const first = played.values().next().value;
    if (first) played.delete(first);
  }

  const plan = await voicePlan();
  const gen = ++generation;
  const body = stripYametePhrase(text);
  publishNotice({
    key: input.key,
    title: t(plan.plus18 ? 'tone.notifTitlePlus18' : 'tone.notifTitleSafe'),
    body: body || text,
  });

  const started = Date.now();
  try {
    if (plan.speak) {
      await speakThreat(text, plan.muted, {
        characterSlug: input.characterSlug || plan.characterSlug,
        locale: input.locale,
        silent: true,
        volume: plan.volume,
        yameteSound: input.yameteSound === true || text.includes('やめて'),
      });
    } else if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    const remain = 1800 - (Date.now() - started);
    if (remain > 0 && gen === generation) await wait(remain);
  } finally {
    if (gen === generation) publishNotice(null);
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }
}

type PendingThreat = {
  id: string;
  message: string;
  scheduledAt: string;
  character?: { slug?: string | null } | null;
};

let armed: { id: string; at: number } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
  armed = null;
}

function arm(next: PendingThreat | null) {
  if (!next?.id || !next.message) {
    clearTimer();
    return;
  }
  const at = new Date(next.scheduledAt).getTime();
  if (!Number.isFinite(at)) return;
  if (armed && armed.id === next.id && armed.at === at && timer) return;
  if (timer) clearTimeout(timer);
  const delayMs = Math.max(0, at - Date.now());
  armed = { id: next.id, at };
  timer = setTimeout(() => {
    const late = Date.now() - at;
    timer = null;
    armed = null;
    if (AppState.currentState !== 'active' || late > 2 * 60 * 1000) return;
    void playIncomingThreat({
      key: next.id,
      text: next.message,
      characterSlug: next.character?.slug ?? undefined,
    });
    setTimeout(() => {
      void syncSchedule();
    }, 4000);
  }, delayMs);
}

async function syncSchedule() {
  if (syncing || AppState.currentState !== 'active') return;
  syncing = true;
  try {
    const dash = await api<{ nextThreat: PendingThreat | null }>('/dashboard/today');
    arm(dash.nextThreat ?? null);
  } catch {
    /* bir sonraki turda yeniden dene */
  } finally {
    syncing = false;
  }
}

/** Sıradaki tehdidin saatine kurar; uygulama açıkken hangi ekranda olursa olsun çalar. */
export function startLiveThreats() {
  let stopped = false;
  const tick = () => {
    if (!stopped) void syncSchedule();
  };
  tick();
  const poll = setInterval(tick, 15_000);
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') tick();
  });
  return () => {
    stopped = true;
    clearInterval(poll);
    sub.remove();
    clearTimer();
  };
}
