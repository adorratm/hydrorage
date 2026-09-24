import * as Updates from 'expo-updates';

export type UpdateResult = 'applied' | 'none' | 'unavailable';

/** Mağaza derlemesinde OTA varsa indirir ve uygulamayı yeniden açar. */
export async function applyUpdateIfAvailable(): Promise<UpdateResult> {
  if (__DEV__ || !Updates.isEnabled) return 'unavailable';

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return 'none';
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return 'applied';
  } catch {
    return 'unavailable';
  }
}
