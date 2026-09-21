import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

export type StreakPayload = {
  streakDays: number;
  lastGoalDate: string | null;
  todayNetMl: number;
  dailyGoalMl: number;
  percent: number;
  milestones: Array<{ days: number; reached: boolean }>;
  recentDays: Array<{ date: string; netMl: number; goalMet: boolean }>;
};

type Props = {
  /** Fallback while streak endpoint loads */
  streakDays?: number;
  todayNetMl?: number;
  dailyGoalMl?: number;
};

export function StreakPanel({
  streakDays = 0,
  todayNetMl = 0,
  dailyGoalMl = 2500,
}: Props) {
  const tr = useT();
  const { data } = useQuery({
    queryKey: ['dashboard', 'streak'],
    queryFn: () => api<StreakPayload>('/dashboard/streak'),
  });

  const days = data?.streakDays ?? streakDays;
  const net = data?.todayNetMl ?? todayNetMl;
  const goal = data?.dailyGoalMl ?? dailyGoalMl;
  const percent = data?.percent ?? Math.min(100, Math.round((net / goal) * 100));
  const strip = (data?.recentDays ?? []).slice(-14);
  const milestones = data?.milestones ?? [
    { days: 7, reached: days >= 7 },
    { days: 14, reached: days >= 14 },
    { days: 30, reached: days >= 30 },
    { days: 100, reached: days >= 100 },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.flameRow}>
          <Ionicons name="flame" size={28} color={colors.secondaryFixedDim} />
          <Text style={styles.heroNum}>{days}</Text>
          <Text style={styles.heroUnit}>{tr('streak.days')}</Text>
        </View>
        <Text style={styles.heroLabel}>{tr('streak.title')}</Text>
        {days === 0 ? (
          <Text style={styles.empty}>{tr('streak.empty')}</Text>
        ) : null}
      </View>

      <View style={styles.today}>
        <View style={styles.todayRow}>
          <Text style={styles.todayLabel}>{tr('streak.today')}</Text>
          <Text style={styles.todayValue}>
            {net} / {goal} ml · {percent}%
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>
      </View>

      {strip.length > 0 ? (
        <View style={styles.stripBlock}>
          <Text style={styles.section}>{tr('streak.recent')}</Text>
          <View style={styles.strip}>
            {strip.map((d) => (
              <View
                key={d.date}
                style={[styles.dot, d.goalMet ? styles.dotOn : styles.dotOff]}
                accessibilityLabel={`${d.date}: ${d.goalMet ? tr('streak.met') : tr('streak.missed')}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.msBlock}>
        <Text style={styles.section}>{tr('streak.milestones')}</Text>
        <View style={styles.msRow}>
          {milestones.map((m) => (
            <View
              key={m.days}
              style={[styles.msChip, m.reached && styles.msChipOn]}
            >
              <Text style={[styles.msText, m.reached && styles.msTextOn]}>
                {m.days}d
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    paddingVertical: 4,
  },
  hero: {
    alignItems: 'flex-start',
    gap: 4,
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  heroNum: {
    fontFamily: fonts.bold,
    fontSize: 40,
    fontWeight: '800',
    color: colors.onSurface,
    lineHeight: 44,
  },
  heroUnit: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroLabel: {
    color: colors.secondaryFixedDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  empty: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  today: { gap: 6 },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  todayValue: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primaryContainer,
  },
  stripBlock: { gap: 8 },
  section: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  strip: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: colors.secondaryFixedDim,
  },
  dotOff: {
    backgroundColor: colors.outlineVariant,
    opacity: 0.55,
  },
  msBlock: { gap: 8 },
  msRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  msChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  msChipOn: {
    borderColor: colors.primaryContainer,
    backgroundColor: 'rgba(189, 147, 249, 0.18)',
  },
  msText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  msTextOn: {
    color: colors.primaryContainer,
  },
});
