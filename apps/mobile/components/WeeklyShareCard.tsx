import React from 'react';
import { View, Text, StyleSheet, Share, Pressable } from 'react-native';
import { colors } from '@/constants/theme';
import { useT } from '@/lib/i18n';

type Props = {
  rageLevel: number;
  grade: string;
  totalLiters: number;
  scoldCount: number;
  shareQuote: string;
};

/** Haftalık karne paylaşım kartı (metin + görsel his) */
export function WeeklyShareCard({
  rageLevel,
  grade,
  totalLiters,
  scoldCount,
  shareQuote,
}: Props) {
  const tr = useT();
  const onShare = async () => {
    const message = [
      tr('share.weeklyTitle'),
      `${tr('share.note')}: ${grade} · Rage ${rageLevel}/5`,
      `${totalLiters}L · ${scoldCount} ${tr('share.scold')}`,
      shareQuote,
      'https://hydrorage.com.tr',
    ].join('\n');
    await Share.share({ message, title: tr('share.weeklyTitle') });
  };

  return (
    <Pressable
      onPress={onShare}
      accessibilityRole="button"
      accessibilityLabel={tr('share.tap')}
      style={styles.card}
    >
      <Text style={styles.kicker}>{tr('share.weeklyTitle')}</Text>
      <Text style={styles.grade}>{grade}</Text>
      <Text style={styles.quote}>“{shareQuote}”</Text>
      <View style={styles.row}>
        <Text style={styles.stat}>Rage {rageLevel}/5</Text>
        <Text style={styles.stat}>{totalLiters}L</Text>
        <Text style={styles.stat}>
          {scoldCount} {tr('share.scold')}
        </Text>
      </View>
      <Text style={styles.hint}>{tr('share.tap')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 8,
  },
  kicker: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  grade: {
    color: colors.onSurface,
    fontSize: 28,
    fontWeight: '800',
  },
  quote: { color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  stat: { color: colors.primaryContainer, fontWeight: '800', fontSize: 12 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
});
