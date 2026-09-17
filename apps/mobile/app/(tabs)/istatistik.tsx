import React from 'react';
import { View, Text, StyleSheet, Share, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';

type Weekly = {
  rageLevel: number;
  grade: string;
  flavorText: string;
  scoldCount: number;
  missedGlasses: number;
  totalLiters: number;
  daily: Array<{
    label: string;
    liters: number;
    tone: 'met' | 'close' | 'fail';
    callout: string | null;
  }>;
  topScolds: Array<{
    text: string;
    count: number;
    characterName: string;
    maxDb: number;
  }>;
  kidneyIndex: number;
  risk: string;
  caffeineWaterRatio: string;
  savedGlasses: string;
  savedRate: number;
  shareQuote: string;
  dailyGoalMl: number;
};

export default function IstatistikScreen() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['stats-weekly'],
    queryFn: () => api<Weekly>('/stats/weekly'),
  });

  const maxL = Math.max(2.5, ...(data?.daily.map((d) => d.liters) ?? [2.5]));

  const onShare = async () => {
    if (!data) return;
    await Share.share({
      message: `HYDRO-RAGE RESMİ İFŞASI\n${data.shareQuote}\nRage ${data.rageLevel}/5 · ${data.totalLiters}L · ${data.scoldCount} azar`,
    });
  };

  return (
    <Screen
      subtitle="PERFORMANS ANALİZİ"
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Haftalık Tehdit Karnesi</Text>
        <View style={styles.ragePill}>
          <Text style={styles.ragePillText}>
            RAGE SEVİYESİ {data?.rageLevel ?? 1}/5
          </Text>
        </View>
      </View>
      <Text style={styles.flavor}>{data?.flavorText}</Text>

      <Card>
        <View style={styles.gradeBox}>
          <Ionicons name="skull" size={22} color={colors.error} />
          <Text style={styles.grade}>{data?.grade ?? '—'}</Text>
        </View>
        <View style={styles.statsRow}>
          <Stat n={data?.scoldCount ?? 0} label="Yenen Fırça" />
          <Stat n={data?.missedGlasses ?? 0} label="Kaçan Bardak" />
          <Stat
            n={`${data?.totalLiters ?? 0}`}
            label="İçilen Su (L)"
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.section}>Haftalık İnfaz Grafiği</Text>
        <Text style={styles.metricLabel}>
          Günde en az {(data?.dailyGoalMl ?? 2500) / 1000}L su hedeflendi
        </Text>
        <View style={styles.chart}>
          <Svg width="100%" height={140} viewBox="0 0 280 140">
            {(data?.daily ?? []).map((d, i) => {
              const h = Math.max(4, (d.liters / maxL) * 100);
              const x = 16 + i * 38;
              const y = 120 - h;
              const fill =
                d.tone === 'met'
                  ? colors.primaryContainer
                  : d.tone === 'close'
                    ? colors.violet
                    : colors.danger;
              return (
                <Rect
                  key={d.label}
                  x={x}
                  y={y}
                  width={24}
                  height={h}
                  rx={4}
                  fill={fill}
                />
              );
            })}
          </Svg>
          <View style={styles.dayLabels}>
            {(data?.daily ?? []).map((d) => (
              <Text key={d.label} style={styles.dayLabel}>
                {d.label}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.legend}>
          <Legend color={colors.primaryContainer} label="Hedef Tutuldu" />
          <Legend color={colors.violet} label="Direkten Döndü" />
          <Legend color={colors.danger} label="Ağır Hakaret" />
        </View>
      </Card>

      <Card>
        <Text style={styles.section}>En Çok Yenen Fırçalar</Text>
        {(data?.topScolds ?? []).map((s, idx) => (
          <View key={idx} style={styles.scoldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoldText} numberOfLines={2}>
                “{s.text}”
              </Text>
              <Text style={styles.metricLabel}>
                {s.characterName} · {s.count}x · {s.maxDb} dB
              </Text>
            </View>
            <Pressable onPress={() => speakThreat(s.text)}>
              <Ionicons name="play-circle" size={28} color={colors.primaryContainer} />
            </Pressable>
          </View>
        ))}
        {!data?.topScolds?.length && (
          <Text style={styles.metricLabel}>Henüz azar yok — şanslısın.</Text>
        )}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.section}>Böbrek Barometresi</Text>
          <Text style={{ color: colors.error, fontWeight: '800' }}>
            RİSK: {data?.risk ?? '—'}
          </Text>
        </View>
        <Text style={styles.body}>
          Böbrek Sağlık İndeksi %{data?.kidneyIndex ?? 0}
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${data?.kidneyIndex ?? 0}%` },
            ]}
          />
        </View>
        <Text style={[styles.metricLabel, { marginTop: 8 }]}>
          Biraz daha su içmezsen taş dökeceksin haberin yok, kaktüse döndün.
        </Text>
        <View style={styles.rowBetween}>
          <Text style={styles.metricLabel}>
            Kafein/Su {data?.caffeineWaterRatio}
          </Text>
          <Text style={styles.metricLabel}>
            Kurtarılan {data?.savedGlasses} (%{data?.savedRate})
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.section}>HYDRO-RAGE RESMİ İFŞASI</Text>
        <Text style={styles.shareQuote}>“{data?.shareQuote}”</Text>
        <PrimaryButton
          label="Utanç Raporunu Dışa Aktar"
          onPress={onShare}
        />
      </Card>
    </Screen>
  );
}

function Stat({ n, label }: { n: string | number; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: { color: colors.primary, fontSize: 22, fontWeight: '800', flex: 1 },
  ragePill: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ragePillText: { color: colors.error, fontSize: 10, fontWeight: '800' },
  flavor: { color: colors.onSurfaceVariant, fontSize: 13 },
  gradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(147,0,10,0.35)',
    padding: 10,
    borderRadius: 10,
  },
  grade: { color: colors.error, fontSize: 16, fontWeight: '800' },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  statN: { color: colors.onSurface, fontSize: 24, fontWeight: '800' },
  section: { color: colors.onSurface, fontSize: 16, fontWeight: '700' },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  chart: { marginTop: 8 },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-around' },
  dayLabel: { color: colors.muted, fontSize: 10, width: 38, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  scoldRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(98,114,164,0.25)',
  },
  scoldText: { color: colors.onSurface, fontSize: 13 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: { color: colors.onSurface, marginTop: 8, fontWeight: '600' },
  barTrack: {
    height: 10,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.danger,
  },
  shareQuote: { color: colors.onSurface, marginVertical: 10, fontStyle: 'italic' },
});
