import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hydrorage.appTour.v2';

const listeners = new Set<() => void>();

export function subscribeAppTour(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestAppTour() {
  listeners.forEach((listener) => listener());
}

export async function hasSeenAppTour() {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

export async function markAppTourSeen() {
  await AsyncStorage.setItem(KEY, '1');
}
