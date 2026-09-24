import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { headerBadge, isPlus18 } from '@/lib/tone';
import { useLocale, useT } from '@/lib/i18n';

type Props = {
  subtitle?: string;
  onPressVolume?: () => void;
};

export function AppHeader({ subtitle, onPressVolume }: Props) {
  const tr = useT();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ plus18Mode: boolean }>('/settings'),
    enabled: !!user,
  });
  const plus18 = isPlus18(settings);
  const resolvedSubtitle = subtitle ?? tr('header.defaultSub');

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Pressable
          style={styles.brand}
          onPress={() => router.replace('/(tabs)/takip')}
          accessibilityRole="button"
          accessibilityLabel={tr('track.home')}
        >
          <View style={styles.logo}>
            <Ionicons name="water" size={22} color={colors.primaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>HydroRage</Text>
              <View style={[styles.badge, !plus18 && styles.badgeSafe]}>
                <Text style={[styles.badgeText, !plus18 && styles.badgeTextSafe]}>
                  {headerBadge(plus18, locale)}
                </Text>
              </View>
            </View>
            <Text style={styles.sub} numberOfLines={1}>
              {resolvedSubtitle}
            </Text>
          </View>
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            style={styles.iconBtn}
            onPress={
              onPressVolume ??
              (() => router.push('/(tabs)/tehdit'))
            }
            accessibilityRole="button"
            accessibilityLabel={tr('threat.listen')}
          >
            <Ionicons name="volume-high" size={20} color={colors.primaryContainer} />
          </Pressable>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel={tr('profile.title')}
          >
            <Ionicons name="person" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(25,27,38,0.92)',
    paddingHorizontal: spacing.margin,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(98,114,164,0.35)',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    color: colors.primaryContainer,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeSafe: {
    backgroundColor: 'rgba(80,250,123,0.18)',
  },
  badgeText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  badgeTextSafe: {
    color: '#50fa7b',
  },
  sub: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(39,41,53,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
