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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const extra = oauthExtra();

  const [googleRequest, , googlePromptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: extra.googleClientIdIos,
    androidClientId: extra.googleClientIdAndroid,
    webClientId: extra.googleClientIdWeb || extra.googleClientIdIos,
  });

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

  const signInWithGoogle = useCallback(async () => {
    const result = await googlePromptAsync();
    if (result.type !== 'success') {
      throw new Error('Google girişi iptal edildi');
    }
    const idToken =
      result.params.id_token ||
      (result as { authentication?: { idToken?: string } }).authentication
        ?.idToken;
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
    await applySession(data);
  }, [googlePromptAsync, applySession]);

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
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
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

  const value = useMemo(
    () => ({
      user,
      loading,
      googleReady: !!googleRequest,
      appleAvailable,
      signInWithGoogle,
      signInWithApple,
      logout,
    }),
    [
      user,
      loading,
      googleRequest,
      appleAvailable,
      signInWithGoogle,
      signInWithApple,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
