import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useAuth } from '@/lib/auth';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useT } from '@/lib/i18n';

export default function LoginScreen() {
  const tr = useT();
  const {
    signInWithGoogle,
    signInWithApple,
    googleReady,
    appleAvailable,
  } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const privacyUrl =
    (Constants.expoConfig?.extra as { privacyPolicyUrl?: string })
      ?.privacyPolicyUrl ?? 'https://hydrorage.com.tr/gizlilik';
  const termsUrl =
    (Constants.expoConfig?.extra as { termsUrl?: string })?.termsUrl ??
    'https://hydrorage.com.tr/kosullar';

  const onGoogle = async () => {
    try {
      setLoadingGoogle(true);
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(tr('common.error'), e.message || tr('common.error'));
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
      Alert.alert(tr('common.error'), e.message || tr('common.error'));
    } finally {
      setLoadingApple(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <Ionicons name="water" size={48} color={colors.primaryContainer} />
        <Text style={styles.title}>HydroRage</Text>
        <Text style={styles.sub}>{tr('login.tagline')}</Text>
      </View>

      <PrimaryButton
        label={tr('login.google')}
        onPress={onGoogle}
        loading={loadingGoogle}
        disabled={!googleReady}
        style={styles.authBtn}
      />

      {Platform.OS === 'ios' && appleAvailable ? (
        <View style={styles.appleWrap}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={onApple}
          />
        </View>
      ) : null}

      {Platform.OS === 'ios' && appleAvailable && loadingApple ? (
        <Text style={styles.hint}>{tr('common.loading')}</Text>
      ) : null}

      <Text style={styles.disclaimer}>{tr('login.legal')}</Text>
      <View style={styles.legalRow}>
        <Pressable
          onPress={() => Linking.openURL(privacyUrl)}
          accessibilityRole="link"
          accessibilityLabel={tr('web.footer.privacy')}
        >
          <Text style={styles.legalLink}>{tr('web.footer.privacy')}</Text>
        </Pressable>
        <Text style={styles.hint}>·</Text>
        <Pressable
          onPress={() => Linking.openURL(termsUrl)}
          accessibilityRole="link"
          accessibilityLabel={tr('web.footer.terms')}
        >
          <Text style={styles.legalLink}>{tr('web.footer.terms')}</Text>
        </Pressable>
      </View>
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
    fontSize: 28,
    fontWeight: '700',
  },
  sub: { color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  authBtn: { width: '100%', height: 48 },
  appleWrap: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  appleBtn: { width: '100%', height: 48 },
  hint: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    color: colors.primaryContainer,
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
