import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * OAuth client ID'leri repo'da tutulmaz — apps/mobile/.env (gitignore).
 * Client ID'ler derlenmiş uygulamada yine görünür; asıl gizli olan CLIENT_SECRET
 * yalnızca API .env'de kalmalı.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HydroRage',
  slug: 'hydrorage',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'hydrorage',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#11131e',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.hydrorage.app',
    usesAppleSignIn: true,
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: '#11131e',
    },
    package: 'com.hydrorage.app',
    permissions: [
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'SCHEDULE_EXACT_ALARM',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-apple-authentication',
    'expo-web-browser',
    'expo-audio',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#BD93F9',
        sounds: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
    googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '',
    googleClientIdAndroid:
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '',
    googleClientIdWeb: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '',
  },
});
