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
  owner: "adorratm",
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  description:
    'Hidrasyon takibi ve sesli hatırlatma. +18 veya güvenli mod. Su içmezsen küfür yersin — istersen küfürsüz.',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#11131e',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.hydrorage.app',
    usesAppleSignIn: true,
    associatedDomains: ['applinks:hydrorage.com.tr', 'applinks:www.hydrorage.com.tr'],
    infoPlist: {
      UIBackgroundModes: ['remote-notification', 'audio'],
      NSUserTrackingUsageDescription:
        'Hatırlatmalar ve hidrasyon takibi için kullanılır.',
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [],
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
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'hydrorage.com.tr',
            pathPrefix: '/app',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
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
    privacyPolicyUrl: 'https://hydrorage.com.tr/gizlilik',
    termsUrl: 'https://hydrorage.com.tr/kosullar',
    eas: {
      // Expo: @adorratm/hydrorage — override with EXPO_PUBLIC_EAS_PROJECT_ID if needed
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
        '2b597587-307d-478c-9947-4de65b8aa943',
    },
  },
});
