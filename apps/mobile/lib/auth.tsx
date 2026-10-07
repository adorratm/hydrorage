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
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  api,
  getStoredUser,
  logoutSession,
  onSessionChange,
  saveSession,
} from '@/lib/api';

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

async function exchangeGoogleIdToken(
  idToken: string,
  applySession: (data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => Promise<void>,
) {
  const data = await api<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  await applySession(data);
}

function useSessionState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    const stop = onSessionChange(setUser);
    getStoredUser()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));

    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
    return stop;
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
    if (Platform.OS === 'android') {
      try {
        await GoogleSignin.signOut();
      } catch {
        /* ignore */
      }
    }
    await logoutSession();
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

/** Android: Play Services native sign-in. AuthSession browser flow → 400 invalid_request. */
function AuthProviderAndroid({ children }: { children: React.ReactNode }) {
  const session = useSessionState();
  const extra = oauthExtra();
  const webClientId = extra.googleClientIdWeb?.trim() || undefined;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!webClientId) {
      setReady(false);
      return;
    }
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    setReady(true);
  }, [webClientId]);

  const signInWithGoogle = useCallback(async () => {
    if (!webClientId) {
      throw new Error(
        'EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB eksik — Android idToken için gerekli',
      );
    }
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) {
        throw new Error('Google girişi iptal edildi');
      }
      if (!isSuccessResponse(response)) {
        throw new Error('Google girişi başarısız');
      }
      let idToken = response.data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) {
        throw new Error(
          'Google idToken alınamadı — Web Client ID ve SHA-1 kontrol et',
        );
      }
      await exchangeGoogleIdToken(idToken, session.applySession);
    } catch (e) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.SIGN_IN_CANCELLED) {
          throw new Error('Google girişi iptal edildi');
        }
        if (e.code === statusCodes.IN_PROGRESS) {
          throw new Error('Google girişi zaten sürüyor');
        }
        if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error('Google Play Services yok veya güncel değil');
        }
        if (e.code === 'DEVELOPER_ERROR' || e.message?.includes('DEVELOPER')) {
          throw new Error(
            'Google Android yapılandırması hatalı — paket adı com.hydrorage.app ve EAS SHA-1 Google Cloud Android OAuth istemcisinde olmalı',
          );
        }
      }
      throw e;
    }
  }, [session.applySession, webClientId]);

  const value = useMemo(
    () => ({
      user: session.user,
      loading: session.loading,
      googleReady: ready && !!webClientId,
      appleAvailable: session.appleAvailable,
      signInWithGoogle,
      signInWithApple: session.signInWithApple,
      logout: session.logout,
    }),
    [
      session.user,
      session.loading,
      ready,
      webClientId,
      session.appleAvailable,
      signInWithGoogle,
      session.signInWithApple,
      session.logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** iOS / web: AuthSession (iOS’ta çalışıyor). */
function AuthProviderAuthSession({ children }: { children: React.ReactNode }) {
  const session = useSessionState();
  const extra = oauthExtra();

  const webClientId = extra.googleClientIdWeb?.trim() || undefined;
  const iosClientId = extra.googleClientIdIos?.trim() || undefined;

  const [googleRequest, , googlePromptAsync] = Google.useIdTokenAuthRequest({
    iosClientId,
    webClientId,
    clientId: Platform.OS === 'web' ? webClientId : undefined,
    selectAccount: true,
    shouldAutoExchangeCode: false,
    ...(Platform.OS === 'web'
      ? {
          redirectUri:
            typeof window !== 'undefined'
              ? window.location.origin
              : 'http://localhost:8081',
        }
      : {}),
  });

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
    if (result.type === 'error') {
      const detail =
        result.error?.message ||
        result.params.error_description ||
        result.params.error ||
        result.errorCode ||
        'error';
      throw new Error(`Google girişi başarısız: ${detail}`);
    }
    if (result.type !== 'success') {
      throw new Error('Google girişi iptal edildi');
    }

    let idToken =
      result.params.id_token ||
      (result as { authentication?: { idToken?: string } }).authentication
        ?.idToken;

    if (!idToken && result.params.code) {
      const clientId = iosClientId || webClientId;
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
    await exchangeGoogleIdToken(idToken, session.applySession);
  }, [
    googlePromptAsync,
    googleRequest,
    session.applySession,
    webClientId,
    iosClientId,
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
  // Android native sign-in needs Web client ID to mint idToken.
  if (Platform.OS === 'android') return !!extra.googleClientIdWeb?.trim();
  if (Platform.OS === 'ios') return !!extra.googleClientIdIos?.trim();
  return !!extra.googleClientIdWeb?.trim();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!platformGoogleClientIdConfigured()) {
    return (
      <AuthProviderWithoutGoogle>{children}</AuthProviderWithoutGoogle>
    );
  }
  if (Platform.OS === 'android') {
    return <AuthProviderAndroid>{children}</AuthProviderAndroid>;
  }
  return <AuthProviderAuthSession>{children}</AuthProviderAuthSession>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
