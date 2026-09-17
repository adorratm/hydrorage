import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { colors } from '@/constants/theme';
import { VOLUME_PRESETS_ML } from '@hydrorage/shared';

// Slider may not be installed - I'll use Pressable presets only if slider fails
// Actually @react-native-community/slider might not be in package.json. Let me avoid it and use presets + simple volume buttons.

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

const FILTERS = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'WATER', label: 'Sular' },
  { key: 'CAFFEINE', label: 'Kafein' },
  { key: 'SUPPLEMENT', label: 'Takviye' },
] as const;

const DRINK_TYPES = [
  { type: 'WATER', label: 'Su', icon: 'water' },
  { type: 'COFFEE', label: 'Kahve', icon: 'cafe' },
  { type: 'TEA', label: 'Çay', icon: 'leaf' },
  { type: 'MINERAL', label: 'Maden Suyu', icon: 'flask' },
  { type: 'ALCOHOL', label: 'Alkol', icon: 'wine', danger: true },
  { type: 'PROTEIN', label: 'Protein', icon: 'barbell' },
  { type: 'MEDICINE', label: 'İlaç', icon: 'medkit' },
  { type: 'ENERGY', label: 'Enerji', icon: 'flash' },
] as const;

export default function IceceklerScreen() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('ALL');
  const [selectedType, setSelectedType] = useState('WATER');
  const [volume, setVolume] = useState(330);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard/today'),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api('/intake', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          label:
            DRINK_TYPES.find((d) => d.type === selectedType)?.label ??
            selectedType,
          amountMl: volume,
        }),
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: Error) => Alert.alert('Hata', e.message),
  });

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
  const riskLabel = score < 70 ? 'RİSKLİ' : score < 90 ? 'İDARE' : 'İYİ';

  return (
    <Screen
      subtitle="Bildirim & Tehdit Ayarları"
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Günlük Sıvı Dengesi</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              SKOR: %{score} ({riskLabel})
            </Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.metricLabel}>BRÜT TÜKETİM</Text>
            <Text style={styles.big}>{data?.grossMl ?? 0} ml</Text>
            <Text style={styles.metricLabel}>
              Saf Su: {data?.pureWaterMl ?? 0} ml
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.metricLabel, { color: colors.error }]}>
              DEHİDRASYON CEZASI
            </Text>
            <Text style={[styles.big, { color: colors.error }]}>
              -{data?.penaltyMl ?? 0} ml
            </Text>
            <Text style={styles.metricLabel}>Kahve / Diüretik Borcu</Text>
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
              <Text style={styles.alertTitle}>KAFEİN / DİÜRETİK CEZASI</Text>
              <Text style={styles.alertBody}>
                Bugün diüretik borcun sisteme yazıldı. Telafi için ekstra su
                dök, lan gevşek!
              </Text>
            </View>
          </View>
        )}
      </Card>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && { color: colors.primaryContainer },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.map((i) => (
        <Card key={i.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>{i.label}</Text>
            <Text style={styles.metricLabel}>
              {new Date(i.createdAt).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.itemMeta}>
            {i.amountMl} ml · net {i.netMl >= 0 ? '+' : ''}
            {i.netMl}
            {i.penaltyMl > 0 ? ` · ceza -${i.penaltyMl}` : ''}
          </Text>
        </Card>
      ))}

      <Card>
        <Text style={styles.title}>Hızlı Sıvı / İlaç Kaydı</Text>
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
              <Text style={styles.typeLabel}>{d.label}</Text>
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
        <Text style={styles.volSelected}>SEÇİLEN HACİM {volume} ml</Text>
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
          label="Tüketimi Kaydet ve Azarı Sıfırla"
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card danger>
        <Text style={styles.protocol}>OTOMATİK TEHDİT PROTOKOLÜ</Text>
        <Text style={styles.protocolBody}>
          Günün hidrasyon borcu kapanmazsa saat 22:00'de telefonun
          hoparlöründen en yüksek sesle bütün odaya rezil edileceksin. Bahanen
          yok, o suyu iç.
        </Text>
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
  title: { color: colors.onSurface, fontSize: 18, fontWeight: '700' },
  scoreBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scoreText: { color: colors.secondary, fontSize: 10, fontWeight: '800' },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  big: { color: colors.onSurface, fontSize: 22, fontWeight: '800' },
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
  alertTitle: { color: colors.error, fontSize: 12, fontWeight: '800' },
  alertBody: { color: colors.onSurface, fontSize: 12, marginTop: 2 },
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
  filterText: { color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  itemTitle: { color: colors.onSurface, fontWeight: '700' },
  itemMeta: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4 },
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
  typeLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '600' },
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
    fontSize: 12,
    fontWeight: '800',
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  protocolBody: { color: colors.onSurface, marginTop: 8, fontSize: 13 },
});
