import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { RadialProgress } from '@/components/RadialProgress';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { StreakPanel } from '@/components/StreakPanel';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';
import {
  QUICK_ADD_PRESETS,
  DEFAULT_QUICK_DRINK_ML,
  localeTag,
  stripYametePhrase,
} from '@hydrorage/shared';
import { buildWidgetPayload, publishWidgetPayload } from '@/lib/widget';
import { useLocale, useT } from '@/lib/i18n';
import { showAlert } from '@/lib/dialog';
import { maybeShowInterstitial } from '@/lib/ads';

function threatStatusLabel(
  status: string,
  tr: (
    key:
      | 'threat.status.pending'
      | 'threat.status.played'
      | 'threat.status.completed'
      | 'threat.status.missed',
  ) => string,
) {
  if (status === 'PLAYED') return tr('threat.status.played');
  if (status === 'COMPLETED') return tr('threat.status.completed');
  if (status === 'MISSED') return tr('threat.status.missed');
  return tr('threat.status.pending');
}

type Dashboard = {
  goalMl: number;
  netMl: number;
  percent: number;
  remaining: number;
  optimalPerHour: number;
  statusLabel: string;
  streakDays: number;
  scoldCount: number;
  glasses: number;
  missedGlasses: number;
  nextThreat: null | {
    id: string;
    message: string;
    scheduledAt: string;
    character?: { slug?: string | null } | null;
  };
  recentThreats: Array<{
    id: string;
    message: string;
    status: string;
    scheduledAt: string;
    character?: { slug?: string | null } | null;
  }>;
};

export default function TakipScreen() {
  const tr = useT();
  const locale = useLocale();
  const tag = localeTag(locale);
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['dashboard', locale],
    queryFn: () => api<Dashboard>('/dashboard/today'),
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (!data) return;
    void publishWidgetPayload(
      buildWidgetPayload({ netMl: data.netMl, goalMl: data.goalMl }),
    );
  }, [data?.netMl, data?.goalMl]);

  useEffect(() => {
    const streak = data?.streakDays ?? 0;
    if (![7, 14, 30].includes(streak)) return;
    const key = `streak-celebrated-${streak}`;
    void AsyncStorage.getItem(key).then((v) => {
      if (v) return;
      showAlert(
        `${tr('track.streak')}!`,
        `${streak} · ${tr('track.streak')}`,
      );
      void AsyncStorage.setItem(key, '1');
    });
  }, [data?.streakDays, tr]);

  const snooze = useMutation({
    mutationFn: (id: string) =>
      api(`/threats/${id}/snooze`, {
        method: 'POST',
        body: JSON.stringify({ minutes: 5 }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showAlert(tr('common.ok'), tr('web.phone.snooze'));
    },
    onError: (e: Error) => showAlert(tr('common.error'), e.message),
  });

  const intakeMutation = useMutation({
    mutationFn: (body: {
      type: string;
      label: string;
      amountMl: number;
    }) =>
      api('/intake', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['intake'] });
      void maybeShowInterstitial();
    },
    onError: (e: Error) => showAlert(tr('common.error'), e.message),
  });

  const playHeaderVolume = useCallback(async () => {
    if (data?.nextThreat?.message) {
      await speakThreat(data.nextThreat.message, false, {
        characterSlug: data.nextThreat.character?.slug ?? undefined,
      });
      return;
    }
    try {
      const res = await api<{ message: string; characterSlug?: string | null }>(
        '/threats/preview',
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
      await speakThreat(res.message, false, {
        forceSpeak: true,
        characterSlug: res.characterSlug ?? undefined,
      });
    } catch (e) {
      await speakThreat(
        tr('track.voiceTest'),
        false,
        { forceSpeak: true },
      );
      if (e instanceof Error) {
        console.warn('[volume]', e.message);
      }
    }
  }, [data?.nextThreat?.message, tr]);

  const minsLeft = data?.nextThreat
    ? Math.max(
        0,
        Math.round(
          (new Date(data.nextThreat.scheduledAt).getTime() - Date.now()) /
            60000,
        ),
      )
    : null;

  const onQuick = useCallback(
    (preset: (typeof QUICK_ADD_PRESETS)[number]) => {
      intakeMutation.mutate({
        type: preset.type,
        label: tr(preset.labelKey),
        amountMl: preset.amountMl,
      });
    },
    [intakeMutation, tr],
  );

  return (
    <Screen
      subtitle={tr('track.home')}
      refreshing={isFetching}
      onRefresh={() => refetch()}
      onPressVolume={() => void playHeaderVolume()}
    >
      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.labelError}>
              {tr('threat.title')}:{' '}
              {data?.nextThreat
                ? new Date(data.nextThreat.scheduledAt).toLocaleTimeString(
                    tag,
                    { hour: '2-digit', minute: '2-digit' },
                  )
                : '--:--'}
            </Text>
          </View>
          <Text style={styles.chip}>
            {minsLeft != null ? `${minsLeft} dk` : '—'}
          </Text>
        </View>
        {data?.nextThreat ? (
          <View style={styles.threatBox}>
            <Ionicons name="megaphone" size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.threatText} numberOfLines={2}>
                “{stripYametePhrase(data.nextThreat.message)}”
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable
                  style={styles.listenBtn}
                  onPress={() =>
                    speakThreat(data.nextThreat!.message, false, {
                      characterSlug: data.nextThreat!.character?.slug ?? undefined,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={tr('threat.listen')}
                >
                  <Ionicons
                    name="volume-high"
                    size={14}
                    color={colors.primaryContainer}
                  />
                  <Text style={styles.listenText}>{tr('threat.listen')}</Text>
                </Pressable>
                <Pressable
                  style={styles.listenBtn}
                  onPress={() => snooze.mutate(data.nextThreat!.id)}
                  accessibilityRole="button"
                  accessibilityLabel={tr('web.phone.snooze')}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.primaryContainer}
                  />
                  <Text style={styles.listenText}>{tr('web.phone.snooze')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.threatBoxEmpty}>
            <EmptyState
              icon="megaphone-outline"
              title={tr('empty.threats')}
              body={tr('empty.threatsBody')}
              actionLabel={tr('threat.title')}
              onAction={() => router.push('/(tabs)/tehdit')}
            />
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionLabel}>{tr('track.goal')}</Text>
            <Text style={styles.sectionTitle}>{tr('track.title')}</Text>
          </View>
          <View style={styles.pctChip}>
            <Ionicons name="flash" size={14} color={colors.primaryContainer} />
            <Text style={styles.pctText}>%{data?.percent ?? 0}</Text>
          </View>
        </View>
        <View style={styles.gaugeRow}>
          <RadialProgress
            current={data?.netMl ?? 0}
            goal={data?.goalMl ?? 2500}
          />
          <View style={styles.metrics}>
            <Text style={styles.metricLabel}>{tr('track.debt')}</Text>
            <Text style={styles.metricValue}>{data?.remaining ?? 0} ml</Text>
            <Text style={[styles.metricLabel, { marginTop: 8 }]}>
              ~{data?.optimalPerHour ?? 150} ml
            </Text>
            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {data?.statusLabel ?? '—'}
              </Text>
            </View>
          </View>
        </View>
        <StreakPanel
          streakDays={data?.streakDays ?? 0}
          todayNetMl={data?.netMl ?? 0}
          dailyGoalMl={data?.goalMl ?? 2500}
        />
      </Card>

      <Card style={{ backgroundColor: colors.surfaceContainerHigh }}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Ionicons name="warning" size={18} color={colors.error} />
            <Text style={styles.sectionTitle}>{tr('stats.scolds')}</Text>
          </View>
        </View>
        <View style={styles.grid2}>
          <View style={styles.statBox}>
            <Text style={styles.metricLabel}>{tr('stats.scolds')}</Text>
            <Text style={styles.statError}>
              {data?.scoldCount ?? 0}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.metricLabel}>
              {data?.glasses ?? 0} / {data?.missedGlasses ?? 0}
            </Text>
          </View>
        </View>
        <PrimaryButton
          label={`${tr('track.drank')} (${DEFAULT_QUICK_DRINK_ML} ml)`}
          loading={intakeMutation.isPending}
          onPress={() =>
            intakeMutation.mutate({
              type: 'WATER',
              label: tr('track.drank'),
              amountMl: DEFAULT_QUICK_DRINK_ML,
            })
          }
          style={{ marginTop: 8 }}
        />
      </Card>

      <View>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>{tr('drinks.add')}</Text>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ADD_PRESETS.map((p) => (
            <Pressable
              key={p.labelKey}
              style={styles.quickCard}
              onPress={() => onQuick(p)}
            >
              <View style={styles.row}>
                <View style={styles.quickIcon}>
                  <Ionicons
                    name={p.icon as any}
                    size={18}
                    color={
                      'penaltyMl' in p
                        ? colors.secondaryFixedDim
                        : colors.primaryContainer
                    }
                  />
                </View>
                <View>
                  <Text style={styles.quickLabel}>{tr(p.labelKey)}</Text>
                  <Text style={styles.quickAmount}>
                    +{p.amountMl} ml
                    {'penaltyMl' in p ? ` (-${(p as any).penaltyMl})` : ''}
                  </Text>
                </View>
              </View>
              <Ionicons name="add" size={16} color={colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>{tr('threat.title')}</Text>
        {(data?.recentThreats ?? []).slice(0, 5).map((item) => (
          <Card key={item.id} style={{ marginTop: 8 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.metricLabel}>
                {new Date(item.scheduledAt).toLocaleTimeString(tag, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.pctText}>{threatStatusLabel(item.status, tr)}</Text>
            </View>
            <Text style={styles.threatListText}>“{stripYametePhrase(item.message)}”</Text>
            <Pressable
              onPress={() =>
                speakThreat(item.message, false, {
                  characterSlug: item.character?.slug ?? undefined,
                })
              }
            >
              <Text style={styles.listenText}>{tr('threat.listen')}</Text>
            </Pressable>
          </Card>
        ))}
        {!data?.recentThreats?.length && (
          <Text style={[styles.metricLabel, { marginTop: 8 }]}>
            {tr('empty.threats')}
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  labelError: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chip: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  threatBox: {
    marginTop: 10,
    backgroundColor: 'rgba(11,14,24,0.8)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  threatBoxEmpty: {
    marginTop: 10,
    backgroundColor: 'rgba(11,14,24,0.8)',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  threatText: {
    flex: 1,
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
  },
  listenText: { color: colors.primaryContainer, fontSize: 14, fontWeight: '700' },
  sectionLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sectionTitle: { color: colors.onSurface, fontSize: 20, fontWeight: '700' },
  pctChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pctText: { color: colors.primaryContainer, fontSize: 14, fontWeight: '700' },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  metrics: { flex: 1, paddingLeft: 8 },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  metricValue: { color: colors.onSurface, fontSize: 20, fontWeight: '700' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
  },
  statusText: {
    color: colors.primaryContainer,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  grid2: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 10,
  },
  statError: { color: colors.error, fontSize: 20, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  quickCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(98,114,164,0.35)',
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { color: colors.onSurface, fontSize: 16, fontWeight: '700' },
  quickAmount: { color: colors.primaryContainer, fontSize: 16, fontWeight: '700' },
  threatListText: { color: colors.onSurface, fontSize: 16, marginVertical: 6 },
});
