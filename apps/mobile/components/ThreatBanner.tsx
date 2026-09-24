import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import {
  subscribeThreatNotice,
  type ThreatNotice,
} from '@/lib/live-threat';

export function ThreatBanner() {
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<ThreatNotice | null>(null);
  const shift = useRef(new Animated.Value(-180)).current;
  const shown = useRef<ThreatNotice | null>(null);

  useEffect(() => {
    return subscribeThreatNotice((next) => {
      if (next) {
        shown.current = next;
        setNotice(next);
        shift.setValue(-180);
        Animated.spring(shift, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 5,
          speed: 14,
        }).start();
        return;
      }
      if (!shown.current) return;
      Animated.timing(shift, {
        toValue: -200,
        duration: 280,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        shown.current = null;
        setNotice(null);
      });
    });
  }, [shift]);

  if (!notice) return null;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Animated.View
        style={[
          styles.card,
          { marginTop: insets.top + 8, transform: [{ translateY: shift }] },
        ]}
      >
        <Ionicons name="megaphone" size={20} color={colors.primaryContainer} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {notice.title}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {notice.body}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
  },
  card: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(189, 147, 249, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 19,
  },
});
