import type { ExpoConfig, ConfigContext } from 'expo/config';

const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  '2b597587-307d-478c-9947-4de65b8aa943';

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
  scheme: ['hydrorage', 'com.hydrorage.app'],
  owner: 'adorratm',
  userInterfaceStyle: 'dark',
  description:
    'Hidrasyon takibi ve sesli hatırlatma. +18 veya güvenli mod. Su içmezsen küfür yersin — istersen küfürsüz.',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.hydrorage.app',
    usesAppleSignIn: true,
    associatedDomains: [
      'applinks:hydrorage.com.tr',
      'applinks:www.hydrorage.com.tr',
    ],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
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
      monochromeImage: './assets/images/android-icon-monochrome.png',
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
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    'expo-dev-client',
    'expo-router',
    'expo-secure-store',
    'expo-apple-authentication',
    'expo-web-browser',
    'expo-audio',
    'expo-updates',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        backgroundColor: '#11131e',
        imageWidth: 220,
        resizeMode: 'contain',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
          'ca-app-pub-3940256099942544~3347511713',
        iosAppId:
          process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
          'ca-app-pub-3940256099942544~1458002511',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#BD93F9',
        sounds: [],
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          enableSceneSupport: true,
        },
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
      projectId: EAS_PROJECT_ID,
    },
  },
});
