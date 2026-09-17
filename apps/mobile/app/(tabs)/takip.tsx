import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { RadialProgress } from '@/components/RadialProgress';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors, spacing } from '@/constants/theme';
import { QUICK_ADD_PRESETS, DEFAULT_QUICK_DRINK_ML } from '@hydrorage/shared';

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
  };
  recentThreats: Array<{
    id: string;
    message: string;
    status: string;
    scheduledAt: string;
  }>;
};

export default function TakipScreen() {
  const qc = useQueryClient();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard/today'),
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
    },
    onError: (e: Error) => Alert.alert('Hata', e.message),
  });

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
        label: preset.label,
        amountMl: preset.amountMl,
      });
    },
    [intakeMutation],
  );

  return (
    <Screen
      subtitle="Anasayfa / Takip"
      refreshing={isFetching}
      onRefresh={() => refetch()}
      onPressVolume={() =>
        data?.nextThreat && speakThreat(data.nextThreat.message)
      }
    >
      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.labelError}>
              Sıradaki Tehdit:{' '}
              {data?.nextThreat
                ? new Date(data.nextThreat.scheduledAt).toLocaleTimeString(
                    'tr-TR',
                    { hour: '2-digit', minute: '2-digit' },
                  )
                : '--:--'}
            </Text>
          </View>
          <Text style={styles.chip}>
            {minsLeft != null ? `${minsLeft} dk kaldı` : 'Yok'}
          </Text>
        </View>
        <View style={styles.threatBox}>
          <Ionicons name="megaphone" size={20} color={colors.error} />
          <Text style={styles.threatText} numberOfLines={2}>
            “
            {data?.nextThreat?.message ??
              'Henüz planlı tehdit yok. Su içmeyi unutursan geliriz.'}
            ”
          </Text>
          <Pressable
            style={styles.listenBtn}
            onPress={() =>
              speakThreat(
                data?.nextThreat?.message ??
                  'Kalk o suyu iç lan artık!',
              )
            }
          >
            <Ionicons name="volume-high" size={14} color={colors.primaryContainer} />
            <Text style={styles.listenText}>Dinle</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionLabel}>GÜNLÜK HEDEF</Text>
            <Text style={styles.sectionTitle}>Günün Durumu</Text>
          </View>
          <View style={styles.pctChip}>
            <Ionicons name="flash" size={14} color={colors.primaryContainer} />
            <Text style={styles.pctText}>%{data?.percent ?? 0} Tamamlandı</Text>
          </View>
        </View>
        <View style={styles.gaugeRow}>
          <RadialProgress
            current={data?.netMl ?? 0}
            goal={data?.goalMl ?? 2500}
          />
          <View style={styles.metrics}>
            <Text style={styles.metricLabel}>Kalan Hacim</Text>
            <Text style={styles.metricValue}>{data?.remaining ?? 0} ml</Text>
            <Text style={[styles.metricLabel, { marginTop: 8 }]}>
              Optimal Aralık
            </Text>
            <Text style={styles.metricSecondary}>
              Saatte ~{data?.optimalPerHour ?? 150} ml
            </Text>
            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {data?.statusLabel ?? 'İDARE EDER DURUM'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.streak}>
          <View style={styles.row}>
            <Ionicons name="flame" size={18} color={colors.secondaryFixedDim} />
            <Text style={styles.streakText}>
              Seri: <Text style={{ fontWeight: '800' }}>{data?.streakDays ?? 0} Gün</Text>{' '}
              Dehidrasyonsuz
            </Text>
          </View>
          <Text style={styles.pctText}>Temponu Bozma</Text>
        </View>
      </Card>

      <Card style={{ backgroundColor: colors.surfaceContainerHigh }}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Ionicons name="warning" size={18} color={colors.error} />
            <Text style={styles.sectionTitle}>Günün Azar Sayacı</Text>
          </View>
          <View style={styles.rageBadge}>
            <Text style={styles.rageText}>RAGE MODE</Text>
          </View>
        </View>
        <View style={styles.grid2}>
          <View style={styles.statBox}>
            <Text style={styles.metricLabel}>Yediğin Fırça</Text>
            <Text style={styles.statError}>
              {data?.scoldCount ?? 0}{' '}
              <Text style={styles.statErrorSm}>Azar 😡</Text>
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.metricLabel}>Tüketim / Kaçırılan</Text>
            <Text style={styles.statPrimary}>
              {data?.glasses ?? 0}{' '}
              <Text style={styles.metricLabel}>Bardak</Text>{' '}
              <Text style={styles.statErrorSm}>
                ({data?.missedGlasses ?? 0} ⚠️)
              </Text>
            </Text>
          </View>
        </View>
        <PrimaryButton
          label={`+ Suyu Dikledim! (${DEFAULT_QUICK_DRINK_ML} ml)`}
          loading={intakeMutation.isPending}
          onPress={() =>
            intakeMutation.mutate({
              type: 'WATER',
              label: 'Suyu Dikledim',
              amountMl: DEFAULT_QUICK_DRINK_ML,
            })
          }
          style={{ marginTop: 8 }}
        />
      </Card>

      <View>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Hızlı Sıvı Ekle</Text>
          <Text style={styles.metricLabel}>Hassas Tüketim</Text>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ADD_PRESETS.map((p) => (
            <Pressable
              key={p.label}
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
                  <Text style={styles.quickLabel}>{p.label}</Text>
                  <Text style={styles.quickAmount}>
                    +{p.amountMl} ml
                    {'penaltyMl' in p ? ` (-${(p as any).penaltyMl} telafi)` : ''}
                  </Text>
                </View>
              </View>
              <Ionicons name="add" size={16} color={colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Son Gelen Tehditler & Azarlar</Text>
        {(data?.recentThreats ?? []).slice(0, 5).map((t) => (
          <Card key={t.id} style={{ marginTop: 8 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.metricLabel}>
                {new Date(t.scheduledAt).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.pctText}>{t.status}</Text>
            </View>
            <Text style={styles.threatListText}>“{t.message}”</Text>
            <Pressable onPress={() => speakThreat(t.message)}>
              <Text style={styles.listenText}>Sesli dinle</Text>
            </Pressable>
          </Card>
        ))}
        {!data?.recentThreats?.length && (
          <Text style={[styles.metricLabel, { marginTop: 8 }]}>
            Bugün henüz azar yok. Şimdilik.
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chip: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
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
  threatText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  listenText: { color: colors.primaryContainer, fontSize: 10, fontWeight: '700' },
  sectionLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sectionTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '700' },
  pctChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pctText: { color: colors.primaryContainer, fontSize: 10, fontWeight: '700' },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  metrics: { flex: 1, paddingLeft: 8 },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  metricValue: { color: colors.onSurface, fontSize: 18, fontWeight: '700' },
  metricSecondary: { color: colors.secondaryFixedDim, fontSize: 12 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
  },
  statusText: {
    color: colors.primaryContainer,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  streak: {
    marginTop: 12,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakText: { color: colors.onSurface, fontSize: 12 },
  rageBadge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rageText: { color: colors.error, fontSize: 10, fontWeight: '800' },
  grid2: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 10,
  },
  statError: { color: colors.error, fontSize: 22, fontWeight: '800' },
  statErrorSm: { color: colors.error, fontSize: 10, fontWeight: '700' },
  statPrimary: { color: colors.primary, fontSize: 22, fontWeight: '800' },
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
  quickLabel: { color: colors.onSurface, fontSize: 12, fontWeight: '700' },
  quickAmount: { color: colors.primaryContainer, fontSize: 12, fontWeight: '800' },
  threatListText: { color: colors.onSurface, fontSize: 12, marginVertical: 6 },
});
