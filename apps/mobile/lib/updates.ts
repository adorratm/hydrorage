import * as Updates from 'expo-updates';

/** Check & apply OTA update on cold start (no-op in __DEV__). */
export async function applyUpdateIfAvailable(): Promise<boolean> {
  if (__DEV__) return false;
  if (!Updates.isEnabled) return false;

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return false;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
