import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Tarayıcı deposu. Node SSR'de window yok; global localStorage'a dokunma. */
function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** SecureStore native'de; web'de localStorage (SecureStore web'de desteklenmez). */
export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return browserStorage()?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      browserStorage()?.setItem(key, value);
    } catch {
      /* private mode etc. */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      browserStorage()?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
