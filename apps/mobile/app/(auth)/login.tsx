import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/lib/auth';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const {
    signInWithGoogle,
    signInWithApple,
    googleReady,
    appleAvailable,
  } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const onGoogle = async () => {
    try {
      setLoadingGoogle(true);
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Google girişi başarısız', e.message || 'Bilinmeyen hata');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const onApple = async () => {
    try {
      setLoadingApple(true);
      await signInWithApple();
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple girişi başarısız', e.message || 'Bilinmeyen hata');
    } finally {
      setLoadingApple(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <Ionicons name="water" size={48} color={colors.primaryContainer} />
        <Text style={styles.title}>HydroRage</Text>
        <Text style={styles.sub}>
          Su içmezsen küfür yersin. Google ile gir
          {Platform.OS === 'ios' ? ', iPhone’da Apple da olur' : ''}.
        </Text>
      </View>

      <PrimaryButton
        label="Google ile devam et"
        onPress={onGoogle}
        loading={loadingGoogle}
        disabled={!googleReady}
      />

      {Platform.OS === 'ios' && appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={14}
          style={styles.appleBtn}
          onPress={onApple}
        />
      ) : null}

      {Platform.OS === 'ios' && appleAvailable && loadingApple ? (
        <Text style={styles.hint}>Apple girişi hazırlanıyor…</Text>
      ) : null}

      {Platform.OS !== 'ios' ? (
        <Text style={styles.hint}>
          Apple ile giriş yalnızca iOS cihazlarda sunulur.
        </Text>
      ) : null}

      <Pressable>
        <Text style={styles.disclaimer}>
          Giriş yaparak küfürlü bildirim tonunu kabul etmiş sayılırsın.
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.margin,
    justifyContent: 'center',
    gap: 14,
  },
  brand: { alignItems: 'center', marginBottom: 28, gap: 8 },
  title: {
    color: colors.primaryContainer,
    fontSize: 32,
    fontWeight: '800',
  },
  sub: { color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  appleBtn: { width: '100%', height: 48 },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
