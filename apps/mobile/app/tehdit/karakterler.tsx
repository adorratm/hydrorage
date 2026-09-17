import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CHARACTER_SAMPLE_LINES } from '@hydrorage/shared';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';

type Character = {
  id: string;
  slug: string;
  name: string;
  description: string;
  badge: string | null;
  maxDb: number;
  dosageLabel: string;
  recordingCount: number;
  unlocked: boolean;
};

function sampleFor(c: Character) {
  return (
    CHARACTER_SAMPLE_LINES[c.slug] ??
    `${c.name} diyor ki: Kalk suyu iç, tembellik etme!`
  );
}

export default function KarakterlerScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['characters'],
    queryFn: () => api<Character[]>('/characters'),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ activeCharacterId: string | null }>('/settings'),
  });

  const select = useMutation({
    mutationFn: (id: string) =>
      api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ activeCharacterId: id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      Alert.alert('Kaydedildi', 'Karakter aktif.');
    },
  });

  const active =
    data?.find((c) => c.id === settings?.activeCharacterId) ?? data?.[0];

  return (
    <Screen
      subtitle="Karakter & Tehdit Kütüphanesi"
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryContainer} />
        <Text style={styles.backText}>Geri</Text>
      </Pressable>

      {active && (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{active.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{active.badge ?? 'AKTİF'}</Text>
            </View>
          </View>
          <Text style={styles.activeLabel}>AKTİF KULLANILIYOR</Text>
          <Text style={styles.body}>{active.description}</Text>
          <View style={styles.stats}>
            <Mini label="Kayıt" value={String(active.recordingCount)} />
            <Mini label="Maks Ses" value={`${active.maxDb} dB`} />
            <Mini label="Dozaj" value={active.dosageLabel} danger />
          </View>
          <PrimaryButton
            label="Son Azarı Dinle"
            onPress={() =>
              speakThreat(sampleFor(active), false, {
                characterSlug: active.slug,
              })
            }
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      <Text style={styles.section}>Ses / Karakter Havuzu</Text>
      {(data ?? []).map((c) => (
        <Card key={c.id}>
          <Text style={styles.charName}>{c.name}</Text>
          <Text style={styles.body}>{c.description}</Text>
          <View style={styles.actions}>
            <PrimaryButton
              label="Örnek Dinle"
              variant="secondary"
              onPress={() =>
                speakThreat(sampleFor(c), false, { characterSlug: c.slug })
              }
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Seç & Uygula"
              onPress={() => select.mutate(c.id)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ))}

      <Card>
        <Text style={styles.section}>Özel Tehdit Şablonları</Text>
        <Text style={styles.body}>
          Kendi küfürlü şablonlarını ekle; motor bunlardan rastgele seçer.
        </Text>
        <PrimaryButton
          label="Şablonları Yönet"
          variant="violet"
          onPress={() => router.push('/tehdit/sablonlar')}
          style={{ marginTop: 10 }}
        />
      </Card>

      <Card>
        <Text style={styles.section}>Toplum İçinde Rezil Olma Koruması</Text>
        <Text style={styles.body}>
          Ofis/gece modu açıksa ses yerine titreşim kullanılır (45 dB whisper
          yerine sessiz).
        </Text>
      </Card>
    </Screen>
  );
}

function Mini({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.mini}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.miniVal, danger && { color: colors.error }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: colors.primaryContainer, fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.onSurface, fontSize: 18, fontWeight: '800', flex: 1 },
  badge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { color: colors.error, fontSize: 10, fontWeight: '800' },
  activeLabel: {
    color: colors.primaryContainer,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
  },
  body: { color: colors.onSurfaceVariant, marginTop: 6, fontSize: 13 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mini: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 8,
  },
  metricLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
  },
  miniVal: { color: colors.onSurface, fontWeight: '800', marginTop: 2 },
  section: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  charName: { color: colors.onSurface, fontWeight: '800', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
