import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import {
  Ubuntu_300Light,
  Ubuntu_400Regular,
  Ubuntu_500Medium,
  Ubuntu_700Bold,
  useFonts,
} from '@expo-google-fonts/ubuntu';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { ActivityIndicator, AppState, View } from 'react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/constants/theme';
import { patchTextToUbuntu } from '@/lib/ubuntu-text';
import {
  startNotificationSpeechListeners,
  registerExpoPushToken,
} from '@/lib/notifications';
import { api, startSessionKeepAlive } from '@/lib/api';
import { getLocale, loadLocale } from '@/lib/i18n';
import { AppQueryProvider } from '@/lib/query-provider';
import { DialogHost } from '@/components/DialogHost';
import { applyUpdateIfAvailable } from '@/lib/updates';
import { AppTour } from '@/components/AppTour';
import { ThreatBanner } from '@/components/ThreatBanner';
import { startLiveThreats } from '@/lib/live-threat';
import { startAppOpenAds } from '@/lib/ads';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function routeFromUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const path = (parsed.path || '').replace(/^\//, '');
    if (path.startsWith('app/tehdit') || path.includes('tehdit')) {
      return '/(tabs)/tehdit';
    }
    if (path.startsWith('app/istatistik') || path.includes('stats')) {
      return '/(tabs)/istatistik';
    }
    if (path.startsWith('app/onboarding')) return '/onboarding';
    if (path.startsWith('app')) return '/(tabs)/takip';
  } catch {
    /* ignore */
  }
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [bootstrapped, setBootstrapped] = useState(false);

  const { data: settings, isFetched } = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      api<{ onboardingCompleted?: boolean }>('/settings'),
    enabled: !!user,
  });

  useEffect(() => {
    void loadLocale().finally(() => setBootstrapped(true));
  }, []);

  useEffect(() => {
    if (loading || !bootstrapped) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }
    if (!user) return;
    if (!isFetched) return;

    const done = settings?.onboardingCompleted === true;
    if (!done && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (done && (inOnboarding || inAuth)) {
      router.replace('/(tabs)/takip');
    }
  }, [
    user,
    loading,
    segments,
    router,
    settings?.onboardingCompleted,
    isFetched,
    bootstrapped,
  ]);

  useEffect(() => {
    if (!user || !bootstrapped || settings?.onboardingCompleted !== true) {
      return;
    }
    return startAppOpenAds();
  }, [user, bootstrapped, settings?.onboardingCompleted]);

  useEffect(() => {
    if (!user || !bootstrapped) return;
    const stop = startNotificationSpeechListeners();
    const stopLive = startLiveThreats();
    const stopSession = startSessionKeepAlive();
    void registerExpoPushToken();
    const ping = () => {
      void api('/users/me/seen', { method: 'POST', body: '{}' }).catch(() => {});
      void api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ locale: getLocale() }),
      }).catch(() => {});
    };
    ping();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') ping();
    });
    return () => {
      stop();
      stopLive();
      stopSession();
      sub.remove();
    };
  }, [user, bootstrapped]);

  useEffect(() => {
    const handle = (url: string) => {
      const target = routeFromUrl(url);
      if (target && user) router.push(target as never);
    };
    Linking.getInitialURL().then((url) => {
      if (url) handle(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [user, router]);

  if (loading || !bootstrapped) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primaryContainer} size="large" />
      </View>
    );
  }

  return (
    <>
      {children}
      {settings?.onboardingCompleted === true ? <AppTour /> : null}
      {user ? <ThreatBanner /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Ubuntu_300Light,
    Ubuntu_400Regular,
    Ubuntu_500Medium,
    Ubuntu_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    patchTextToUbuntu();
    void (async () => {
      await applyUpdateIfAvailable();
      await SplashScreen.hideAsync().catch(() => undefined);
    })();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void applyUpdateIfAvailable();
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primaryContainer} size="large" />
      </View>
    );
  }

  return (
    <AppQueryProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.surface },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="tehdit/karakterler" />
            <Stack.Screen name="tehdit/rutinler" />
            <Stack.Screen name="tehdit/sablonlar" />
          </Stack>
        </AuthGate>
        <DialogHost />
      </AuthProvider>
    </AppQueryProvider>
  );
}
