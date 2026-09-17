import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Props = {
  subtitle?: string;
  onPressVolume?: () => void;
};

export function AppHeader({
  subtitle = 'Bildirim & Tehdit Ayarları',
  onPressVolume,
}: Props) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="water" size={22} color={colors.primaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>HydroRage</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>KÜFÜRLÜ 🔥</Text>
              </View>
            </View>
            <Text style={styles.sub} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} onPress={onPressVolume}>
            <Ionicons name="volume-high" size={20} color={colors.primaryContainer} />
          </Pressable>
          <Pressable style={styles.avatar} onPress={logout}>
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sub: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700', marginTop: 2 },
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
