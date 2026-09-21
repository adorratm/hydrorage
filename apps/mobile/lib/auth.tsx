import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AccessTokenRequest } from 'expo-auth-session';
import Constants from 'expo-constants';
import { api, clearSession, getStoredUser, saveSession } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

type User = { id: string; email: string; displayName: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  googleReady: boolean;
  appleAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function oauthExtra() {
  const extra = (Constants.expoConfig?.extra || {}) as {
    googleClientIdIos?: string;
    googleClientIdAndroid?: string;
    googleClientIdWeb?: string;
  };
  return extra;
}

function useSessionState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    getStoredUser()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));

    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  const applySession = useCallback(
    async (data: {
      accessToken: string;
      refreshToken: string;
      user: User;
    }) => {
      await saveSession(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      setUser(data.user);
    },
    [],
  );

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple ile giriş yalnızca iOS cihazlarda kullanılabilir');
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple identityToken alınamadı');
    }
    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({
        identityToken: credential.identityToken,
        fullName: fullName || undefined,
        email: credential.email || undefined,
      }),
    });
    await applySession(data);
  }, [applySession]);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    appleAvailable,
    applySession,
    signInWithApple,
    logout,
  };
}

function AuthProviderWithGoogle({ children }: { children: React.ReactNode }) {
  const session = useSessionState();
  const extra = oauthExtra();

  const webClientId = extra.googleClientIdWeb?.trim() || undefined;
  const iosClientId = extra.googleClientIdIos?.trim() || undefined;
  const androidClientId = extra.googleClientIdAndroid?.trim() || undefined;

  // Native: do NOT override redirectUri — Google provider uses
  // `${bundleId}:/oauthredirect` (e.g. com.hydrorage.app:/oauthredirect).
  // Custom hydrorage://… → Google Error 400 invalid_request.
  const [googleRequest, , googlePromptAsync] = Google.useIdTokenAuthRequest(
    {
      iosClientId,
      androidClientId,
      webClientId,
      clientId: Platform.OS === 'web' ? webClientId : undefined,
      selectAccount: true,
      ...(Platform.OS === 'web'
        ? {
            redirectUri:
              typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost:8081',
          }
        : {}),
    },
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('[Google OAuth]', {
        platform: Platform.OS,
        webClientId: webClientId
          ? `${webClientId.slice(0, 28)}…`
          : '(MISSING)',
        hasIos: !!iosClientId,
        hasAndroid: !!androidClientId,
        requestRedirectUri: googleRequest?.redirectUri,
      });
    }
  }, [webClientId, iosClientId, androidClientId, googleRequest?.redirectUri]);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web' && !webClientId) {
      throw new Error(
        'EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB eksik — apps/mobile/.env',
      );
    }
    if (!googleRequest) {
      throw new Error('Google girişi henüz hazır değil');
    }

    const result = await googlePromptAsync();
    if (result.type !== 'success') {
      throw new Error('Google girişi iptal edildi');
    }

    let idToken =
      result.params.id_token ||
      (result as { authentication?: { idToken?: string } }).authentication
        ?.idToken;

    // Native uses authorization code; promptAsync resolves before auto-exchange.
    // Exchange code → id_token ourselves (PKCE).
    if (!idToken && result.params.code) {
      const clientId =
        Platform.select({
          ios: iosClientId,
          android: androidClientId,
          default: webClientId,
        }) || webClientId;
      if (!clientId) {
        throw new Error('Google Client ID eksik');
      }
      const tokenResponse = await new AccessTokenRequest({
        clientId,
        code: result.params.code,
        redirectUri: googleRequest.redirectUri,
        extraParams: {
          code_verifier: googleRequest.codeVerifier || '',
        },
      }).performAsync(Google.discovery);
      idToken = tokenResponse.idToken;
    }

    if (!idToken) {
      throw new Error('Google idToken alınamadı');
    }
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    await session.applySession(data);
  }, [
    googlePromptAsync,
    googleRequest,
    session.applySession,
    webClientId,
    iosClientId,
    androidClientId,
  ]);

  const value = useMemo(
    () => ({
      user: session.user,
      loading: session.loading,
      googleReady:
        !!googleRequest && (Platform.OS !== 'web' || !!webClientId),
      appleAvailable: session.appleAvailable,
      signInWithGoogle,
      signInWithApple: session.signInWithApple,
      logout: session.logout,
    }),
    [
      session.user,
      session.loading,
      googleRequest,
      webClientId,
      session.appleAvailable,
      signInWithGoogle,
      session.signInWithApple,
      session.logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AuthProviderWithoutGoogle({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSessionState();

  const signInWithGoogle = useCallback(async () => {
    throw new Error(
      'Google Client ID eksik — EAS env / apps/mobile/.env kontrol et',
    );
  }, []);

  const value = useMemo(
    () => ({
      user: session.user,
      loading: session.loading,
      googleReady: false,
      appleAvailable: session.appleAvailable,
      signInWithGoogle,
      signInWithApple: session.signInWithApple,
      logout: session.logout,
    }),
    [
      session.user,
      session.loading,
      session.appleAvailable,
      signInWithGoogle,
      session.signInWithApple,
      session.logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function platformGoogleClientIdConfigured() {
  const extra = oauthExtra();
  if (Platform.OS === 'ios') return !!extra.googleClientIdIos?.trim();
  if (Platform.OS === 'android') return !!extra.googleClientIdAndroid?.trim();
  return !!extra.googleClientIdWeb?.trim();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // useIdTokenAuthRequest throws synchronously if platform clientId is missing.
  if (!platformGoogleClientIdConfigured()) {
    return (
      <AuthProviderWithoutGoogle>{children}</AuthProviderWithoutGoogle>
    );
  }
  return <AuthProviderWithGoogle>{children}</AuthProviderWithGoogle>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
