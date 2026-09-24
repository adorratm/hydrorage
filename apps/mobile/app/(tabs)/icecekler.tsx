import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { colors } from '@/constants/theme';
import {
  VOLUME_PRESETS_ML,
  fillTemplate,
  localeTag,
  type I18nKey,
} from '@hydrorage/shared';
import { caffeineAlertBody, isPlus18 } from '@/lib/tone';
import { confirmAction, promptText, showAlert } from '@/lib/dialog';
import { speakThreat } from '@/lib/speech';
import { maybeShowInterstitial } from '@/lib/ads';
import { useLocale, useT } from '@/lib/i18n';

type Dashboard = {
  goalMl: number;
  netMl: number;
  grossMl: number;
  pureWaterMl: number;
  penaltyMl: number;
  percent: number;
  intakes: Array<{
    id: string;
    type: string;
    label: string;
    amountMl: number;
    penaltyMl: number;
    netMl: number;
    createdAt: string;
  }>;
};

const FILTER_KEYS = ['ALL', 'WATER', 'CAFFEINE', 'SUPPLEMENT'] as const;

const DRINK_TYPES = [
  { type: 'WATER', icon: 'water', labelKey: 'drinks.type.WATER' as I18nKey },
  { type: 'COFFEE', icon: 'cafe', labelKey: 'drinks.type.COFFEE' as I18nKey },
  { type: 'TEA', icon: 'leaf', labelKey: 'drinks.type.TEA' as I18nKey },
  {
    type: 'MINERAL',
    icon: 'flask',
    labelKey: 'drinks.type.MINERAL' as I18nKey,
  },
  {
    type: 'ALCOHOL',
    icon: 'wine',
    labelKey: 'drinks.type.ALCOHOL' as I18nKey,
    danger: true,
  },
  {
    type: 'PROTEIN',
    icon: 'barbell',
    labelKey: 'drinks.type.PROTEIN' as I18nKey,
  },
  {
    type: 'MEDICINE',
    icon: 'medkit',
    labelKey: 'drinks.type.MEDICINE' as I18nKey,
  },
  { type: 'ENERGY', icon: 'flash', labelKey: 'drinks.type.ENERGY' as I18nKey },
] as const;

export default function IceceklerScreen() {
  const tr = useT();
  const locale = useLocale();
  const tag = localeTag(locale);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTER_KEYS)[number]>('ALL');
  const [selectedType, setSelectedType] = useState('WATER');
  const [volume, setVolume] = useState(330);

  const filterLabel = (key: (typeof FILTER_KEYS)[number]) => {
    if (key === 'ALL') return tr('drinks.all');
    if (key === 'WATER') return tr('preset.WATER');
    if (key === 'CAFFEINE') return tr('preset.COFFEE');
    return tr('preset.PROTEIN');
  };

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['dashboard', locale],
    queryFn: () => api<Dashboard>('/dashboard/today'),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings', locale],
    queryFn: () => api<{ plus18Mode: boolean }>('/settings'),
  });
  const plus18 = isPlus18(settings);

  const drinkLabel = (type: string) => {
    const row = DRINK_TYPES.find((d) => d.type === type);
    return row ? tr(row.labelKey) : type;
  };

  const mutation = useMutation({
    mutationFn: () =>
      api('/intake', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          label: drinkLabel(selectedType),
          amountMl: volume,
        }),
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      void maybeShowInterstitial();
    },
    onError: (e: Error) => showAlert(tr('common.error'), e.message),
  });

  const updateIntake = useMutation({
    mutationFn: (body: { id: string; amountMl: number }) =>
      api(`/intake/${body.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ amountMl: Math.round(body.amountMl) }),
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showAlert(tr('common.save'), tr('profile.updated'));
    },
    onError: (e: Error) => showAlert(tr('common.error'), e.message),
  });

  const removeIntake = useMutation({
    mutationFn: (id: string) =>
      api(`/intake/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: Error) => showAlert(tr('common.error'), e.message),
  });

  const editIntake = (i: Dashboard['intakes'][number]) => {
    promptText({
      title: tr('common.edit'),
      message: `${i.label} — ml`,
      defaultValue: String(i.amountMl),
      keyboardType: 'numeric',
      onSubmit: (raw) => {
        const amountMl = Math.round(Number(raw.replace(',', '.')));
        if (!Number.isFinite(amountMl) || amountMl < 1) {
          showAlert(tr('common.error'), '1 ml+');
          return;
        }
        updateIntake.mutate({ id: i.id, amountMl });
      },
    });
  };

  const deleteIntake = (i: Dashboard['intakes'][number]) => {
    confirmAction({
      title: tr('dialog.confirmDelete'),
      message: `${i.label} (${i.amountMl} ml)`,
      confirmLabel: tr('common.delete'),
      destructive: true,
      onConfirm: () => removeIntake.mutate(i.id),
    });
  };

  const filtered = useMemo(() => {
    const list = data?.intakes ?? [];
    if (filter === 'ALL') return list;
    if (filter === 'WATER')
      return list.filter((i) =>
        ['WATER', 'BOTTLE', 'MINERAL', 'ELECTROLYTE'].includes(i.type),
      );
    if (filter === 'CAFFEINE')
      return list.filter((i) =>
        ['COFFEE', 'ESPRESSO', 'FILTER_COFFEE', 'TEA', 'ENERGY'].includes(
          i.type,
        ),
      );
    return list.filter((i) =>
      ['PROTEIN', 'MEDICINE'].includes(i.type),
    );
  }, [data, filter]);

  const score = data?.percent ?? 0;
  const riskLabel =
    score < 70
      ? tr('drinks.risk.low')
      : score < 90
        ? tr('drinks.risk.mid')
        : tr('drinks.risk.high');

  return (
    <Screen
      subtitle={tr('drinks.title')}
      refreshing={isFetching}
      onRefresh={() => refetch()}
      onPressVolume={() =>
        void speakThreat(
          plus18
            ? tr('drinks.voiceTestPlus18')
            : tr('drinks.voiceTestSafe'),
        )
      }
    >
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{tr('drinks.title')}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              {fillTemplate(tr('drinks.score'), { score, risk: riskLabel })}
            </Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.metricLabel}>{tr('drinks.gross')}</Text>
            <Text style={styles.big}>{data?.grossMl ?? 0} ml</Text>
            <Text style={styles.metricLabel}>
              {fillTemplate(tr('drinks.pureWater'), {
                ml: data?.pureWaterMl ?? 0,
              })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.metricLabel, { color: colors.error }]}>
              {tr('drinks.penalty')}
            </Text>
            <Text style={[styles.big, { color: colors.error }]}>
              -{data?.penaltyMl ?? 0} ml
            </Text>
            <Text style={styles.metricLabel}>{tr('drinks.caffeineDebt')}</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, ((data?.pureWaterMl ?? 0) / (data?.goalMl || 2500)) * 100)}%`,
              },
            ]}
          />
          <View
            style={[
              styles.barDebt,
              {
                width: `${Math.min(30, ((data?.penaltyMl ?? 0) / (data?.goalMl || 2500)) * 100)}%`,
              },
            ]}
          />
        </View>
        {(data?.penaltyMl ?? 0) > 0 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={18} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {tr('drinks.caffeineAlert')}
              </Text>
              <Text style={styles.alertBody}>
                {caffeineAlertBody(plus18, locale)}
              </Text>
            </View>
          </View>
        )}
      </Card>

      <View style={styles.filters}>
        {FILTER_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterChip, filter === key && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === key && { color: colors.primaryContainer },
              ]}
            >
              {filterLabel(key)}
            </Text>
          </Pressable>
        ))}
      </View>

      {!filtered.length ? (
        <Text style={styles.metricLabel}>{tr('drinks.empty')}</Text>
      ) : null}

      {filtered.map((i) => (
        <Card key={i.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>{i.label}</Text>
            <Text style={styles.metricLabel}>
              {new Date(i.createdAt).toLocaleTimeString(tag, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.itemMeta}>
            {i.amountMl} ml · net {i.netMl >= 0 ? '+' : ''}
            {i.netMl}
            {i.penaltyMl > 0 ? ` · -${i.penaltyMl}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <PrimaryButton
              label={tr('common.edit')}
              variant="secondary"
              style={{ flex: 1 }}
              loading={updateIntake.isPending}
              onPress={() => editIntake(i)}
            />
            <PrimaryButton
              label={tr('common.delete')}
              variant="danger"
              style={{ flex: 1 }}
              loading={removeIntake.isPending}
              onPress={() => deleteIntake(i)}
            />
          </View>
        </Card>
      ))}

      <Card>
        <Text style={styles.title}>{tr('drinks.add')}</Text>
        <View style={styles.typeGrid}>
          {DRINK_TYPES.map((d) => (
            <Pressable
              key={d.type}
              onPress={() => setSelectedType(d.type)}
              style={[
                styles.typeBtn,
                selectedType === d.type && styles.typeActive,
                'danger' in d && d.danger && { borderColor: colors.danger },
              ]}
            >
              <Ionicons
                name={d.icon as any}
                size={18}
                color={
                  selectedType === d.type
                    ? colors.primaryContainer
                    : colors.onSurfaceVariant
                }
              />
              <Text style={styles.typeLabel}>{tr(d.labelKey)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.volRow}>
          {VOLUME_PRESETS_ML.map((v) => (
            <Pressable
              key={v}
              onPress={() => setVolume(v)}
              style={[styles.volBtn, volume === v && styles.volActive]}
            >
              <Text
                style={[
                  styles.volText,
                  volume === v && { color: colors.onPrimary },
                ]}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.volSelected}>
          {fillTemplate(tr('drinks.volumeSelected'), { ml: volume })}
        </Text>
        <View style={styles.volAdjust}>
          <Pressable
            style={styles.adjustBtn}
            onPress={() => setVolume((v) => Math.max(50, v - 50))}
          >
            <Text style={styles.adjustText}>-50</Text>
          </Pressable>
          <Pressable
            style={styles.adjustBtn}
            onPress={() => setVolume((v) => Math.min(1500, v + 50))}
          >
            <Text style={styles.adjustText}>+50</Text>
          </Pressable>
        </View>
        <PrimaryButton
          label={tr('common.save')}
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card danger>
        <Text style={styles.protocol}>{tr('drinks.protocolTitle')}</Text>
        <Text style={styles.protocolBody}>{tr('drinks.protocolBody')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.onSurface, fontSize: 20, fontWeight: '700' },
  scoreBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scoreText: { color: colors.secondary, fontSize: 14, fontWeight: '700' },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  big: { color: colors.onSurface, fontSize: 20, fontWeight: '700' },
  barTrack: {
    height: 10,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 999,
    marginTop: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primaryContainer },
  barDebt: { height: '100%', backgroundColor: colors.danger },
  alert: {
    marginTop: 12,
    backgroundColor: 'rgba(147,0,10,0.35)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
  },
  alertTitle: { color: colors.error, fontSize: 16, fontWeight: '700' },
  alertBody: { color: colors.onSurface, fontSize: 16, marginTop: 2 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
  },
  filterActive: {
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  filterText: { color: colors.onSurfaceVariant, fontSize: 16, fontWeight: '700' },
  itemTitle: { color: colors.onSurface, fontWeight: '700' },
  itemMeta: { color: colors.onSurfaceVariant, fontSize: 16, marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  typeBtn: {
    width: '22%',
    minWidth: 70,
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeActive: { borderColor: colors.primaryContainer },
  typeLabel: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  volRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  volBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHigh,
  },
  volActive: { backgroundColor: colors.primaryContainer },
  volText: { color: colors.onSurface, fontWeight: '700' },
  volSelected: {
    marginTop: 12,
    color: colors.primaryContainer,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  volAdjust: { flexDirection: 'row', gap: 8, marginTop: 8 },
  adjustBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHighest,
  },
  adjustText: { color: colors.onSurface, fontWeight: '700' },
  protocol: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  protocolBody: { color: colors.onSurface, marginTop: 8, fontSize: 16 },
});
