import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { api } from '@/lib/api';
import { isSpeechActive } from '@/lib/speech';

const COUNT_KEY = 'hr_ad_intake_count';
const LAST_KEY = 'hr_ad_last_at';
const REMINDER_KEY = 'hr_reminder_started_at';
const APP_OPEN_KEY = 'hr_ad_app_open_at';
const COOLDOWN_MS = 3 * 60 * 1000;
const APP_OPEN_GAP_MS = 30 * 60 * 1000;

const TEST = {
  iosBanner: 'ca-app-pub-3940256099942544/2934735716',
  iosInterstitial: 'ca-app-pub-3940256099942544/4411468910',
  iosAppOpen: 'ca-app-pub-3940256099942544/5575463023',
  androidBanner: 'ca-app-pub-3940256099942544/6300978111',
  androidInterstitial: 'ca-app-pub-3940256099942544/1033173712',
  androidAppOpen: 'ca-app-pub-3940256099942544/9257395921',
};

type AdKind = 'banner' | 'interstitial' | 'appOpen';

function unitId(kind: AdKind) {
  const ios =
    kind === 'banner'
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER
      : kind === 'interstitial'
        ? process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL
        : process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN;
  const android =
    kind === 'banner'
      ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER
      : kind === 'interstitial'
        ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL
        : process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN;
  const fromEnv = Platform.OS === 'ios' ? ios : android;
  if (fromEnv) return fromEnv;
  if (!__DEV__) return null;
  if (Platform.OS === 'ios') {
    if (kind === 'banner') return TEST.iosBanner;
    if (kind === 'interstitial') return TEST.iosInterstitial;
    return TEST.iosAppOpen;
  }
  if (kind === 'banner') return TEST.androidBanner;
  if (kind === 'interstitial') return TEST.androidInterstitial;
  return TEST.androidAppOpen;
}

export function bannerUnitId() {
  if (Platform.OS === 'web') return null;
  return unitId('banner');
}

let createdAtMs: number | null = null;
let adsReady = false;

async function withinFirstDay() {
  if (createdAtMs == null) {
    try {
      const me = await api<{ createdAt?: string }>('/users/me');
      createdAtMs = me.createdAt ? new Date(me.createdAt).getTime() : 0;
    } catch {
      createdAtMs = 0;
    }
  }
  if (!createdAtMs) return false;
  return Date.now() - createdAtMs < 24 * 60 * 60 * 1000;
}

export async function markReminderStarted() {
  await AsyncStorage.setItem(REMINDER_KEY, String(Date.now()));
}

export async function maybeShowInterstitial() {
  if (Platform.OS === 'web') return;
  if (isSpeechActive()) return;
  if (await withinFirstDay()) return;
  const started = Number((await AsyncStorage.getItem(REMINDER_KEY)) || 0);
  if (started && Date.now() - started < 2 * 60 * 1000) return;
  const last = Number((await AsyncStorage.getItem(LAST_KEY)) || 0);
  if (last && Date.now() - last < COOLDOWN_MS) return;
  const count = Number((await AsyncStorage.getItem(COUNT_KEY)) || 0) + 1;
  await AsyncStorage.setItem(COUNT_KEY, String(count));
  if (count % 4 !== 0) return;
  const id = unitId('interstitial');
  if (!id) return;

  try {
    const ads = require('react-native-google-mobile-ads') as {
      default: () => { initialize: () => Promise<unknown> };
      InterstitialAd: {
        createForAdRequest: (unitId: string) => {
          load: () => void;
          show: () => void;
          addAdEventListener: (
            type: string,
            cb: () => void,
          ) => () => void;
        };
      };
      AdEventType: { LOADED: string; CLOSED: string; ERROR: string };
    };
    if (!adsReady) {
      await ads.default().initialize();
      adsReady = true;
    }
    const interstitial = ads.InterstitialAd.createForAdRequest(id);
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        unsubLoaded();
        unsubClosed();
        unsubError();
        resolve();
      };
      const unsubLoaded = interstitial.addAdEventListener(
        ads.AdEventType.LOADED,
        () => {
          interstitial.show();
        },
      );
      const unsubClosed = interstitial.addAdEventListener(
        ads.AdEventType.CLOSED,
        finish,
      );
      const unsubError = interstitial.addAdEventListener(
        ads.AdEventType.ERROR,
        finish,
      );
      interstitial.load();
      setTimeout(finish, 8000);
    });
    await AsyncStorage.setItem(LAST_KEY, String(Date.now()));
  } catch {
    /* Expo Go veya reklam modülü yok */
  }
}

type FullScreenAd = {
  load: () => void;
  show: () => void;
  addAdEventListener: (type: string, cb: () => void) => () => void;
};

/** Uygulama açılışı ve arka plandan dönüş. En fazla 30 dakikada bir. */
export function startAppOpenAds() {
  if (Platform.OS === 'web') return () => undefined;
  let stopped = false;
  let loaded = false;
  let showing = false;
  let loading = false;
  let ad: FullScreenAd | null = null;

  const showIfReady = async () => {
    if (stopped || !loaded || showing || !ad) return;
    if (isSpeechActive()) return;
    if (await withinFirstDay()) return;
    const started = Number((await AsyncStorage.getItem(REMINDER_KEY)) || 0);
    if (started && Date.now() - started < 2 * 60 * 1000) return;
    const lastAny = Number((await AsyncStorage.getItem(LAST_KEY)) || 0);
    if (lastAny && Date.now() - lastAny < COOLDOWN_MS) return;
    const lastOpen = Number((await AsyncStorage.getItem(APP_OPEN_KEY)) || 0);
    if (lastOpen && Date.now() - lastOpen < APP_OPEN_GAP_MS) return;
    showing = true;
    loaded = false;
    ad.show();
  };

  const load = () => {
    if (stopped || loading || loaded || showing || !ad) return;
    loading = true;
    ad.load();
  };

  void (async () => {
    const id = unitId('appOpen');
    if (!id || stopped) return;
    try {
      const ads = require('react-native-google-mobile-ads') as {
        default: () => { initialize: () => Promise<unknown> };
        AppOpenAd: { createForAdRequest: (unitId: string) => FullScreenAd };
        AdEventType: { LOADED: string; CLOSED: string; ERROR: string };
      };
      if (!adsReady) {
        await ads.default().initialize();
        adsReady = true;
      }
      if (stopped) return;
      ad = ads.AppOpenAd.createForAdRequest(id);
      ad.addAdEventListener(ads.AdEventType.LOADED, () => {
        loading = false;
        loaded = true;
        void showIfReady();
      });
      ad.addAdEventListener(ads.AdEventType.CLOSED, () => {
        showing = false;
        loaded = false;
        const now = String(Date.now());
        void AsyncStorage.setItem(LAST_KEY, now);
        void AsyncStorage.setItem(APP_OPEN_KEY, now);
        load();
      });
      ad.addAdEventListener(ads.AdEventType.ERROR, () => {
        loading = false;
        showing = false;
        loaded = false;
      });
      load();
    } catch {
      /* Expo Go veya reklam modülü yok */
    }
  })();

  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active' || stopped) return;
    if (loaded) void showIfReady();
    else load();
  });

  return () => {
    stopped = true;
    sub.remove();
  };
}
