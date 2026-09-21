/**
 * Home-screen widget iskeleti (Phase 4).
 *
 * Expo’da native widget için ayrı native target / `expo-widgets` (veya
 * react-native-android-widget / WidgetKit) gerekir. Bu dosya kalan ml verisini
 * widget köprüsüne hazırlar; native build’de bağlanacak.
 */

export type HydrationWidgetPayload = {
  netMl: number;
  goalMl: number;
  remainingMl: number;
  percent: number;
  updatedAt: string;
};

export function buildWidgetPayload(input: {
  netMl: number;
  goalMl: number;
}): HydrationWidgetPayload {
  const remainingMl = Math.max(0, input.goalMl - input.netMl);
  const percent =
    input.goalMl > 0
      ? Math.min(100, Math.round((input.netMl / input.goalMl) * 100))
      : 0;
  return {
    netMl: input.netMl,
    goalMl: input.goalMl,
    remainingMl,
    percent,
    updatedAt: new Date().toISOString(),
  };
}

/** Native widget eklendiğinde SharedPreferences / App Group’a yazılacak. */
export async function publishWidgetPayload(
  payload: HydrationWidgetPayload,
): Promise<void> {
  if (__DEV__) {
    console.log('[widget] payload ready', payload);
  }
}
