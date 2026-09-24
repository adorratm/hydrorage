import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localizeCharacter, sampleLineForCharacter } from '@hydrorage/shared';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';
import { isPlus18 } from '@/lib/tone';
import { useLocale, useT } from '@/lib/i18n';

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
  unlockStreakDays: number;
  userStreakDays?: number;
};

export default function KarakterlerScreen() {
  const tr = useT();
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['characters', locale],
    queryFn: () => api<Character[]>('/characters'),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      api<{ activeCharacterId: string | null; plus18Mode: boolean }>('/settings'),
  });
  const plus18 = isPlus18(settings);

  const sampleFor = (c: Character) =>
    sampleLineForCharacter(c.slug, plus18, locale);

  const select = useMutation({
    mutationFn: (id: string) =>
      api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ activeCharacterId: id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      Alert.alert(tr('profile.saved'), tr('threat.characters'));
    },
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const display = (c: Character) =>
    localizeCharacter(c.slug, locale, {
      name: c.name,
      description: c.description,
      badge: c.badge ?? '',
      dosageLabel: c.dosageLabel,
    });

  const active =
    data?.find((c) => c.id === settings?.activeCharacterId) ?? data?.[0];
  const activeMeta = active ? display(active) : null;

  return (
    <Screen
      subtitle={tr('threat.characters')}
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryContainer} />
        <Text style={styles.backText}>{tr('common.close')}</Text>
      </Pressable>

      {active && activeMeta && (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{activeMeta.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeMeta.badge || '✓'}</Text>
            </View>
          </View>
          <Text style={styles.activeLabel}>{tr('threat.characters')}</Text>
          <Text style={styles.body}>{activeMeta.description}</Text>
          <View style={styles.stats}>
            <Mini label="#" value={String(active.recordingCount)} />
            <Mini label="dB" value={`${active.maxDb}`} />
            <Mini label="" value={activeMeta.dosageLabel} danger />
          </View>
          <PrimaryButton
            label={tr('threat.listen')}
            onPress={() =>
              speakThreat(sampleFor(active), false, {
                characterSlug: active.slug,
              })
            }
            style={{ marginTop: 12 }}
          />
        </Card>
      )}

      <Text style={styles.section}>{tr('threat.characters')}</Text>
      {(data ?? []).map((c) => {
        const meta = display(c);
        return (
          <Card key={c.id}>
            <View style={styles.rowBetween}>
              <Text style={styles.charName}>{meta.name}</Text>
            </View>
            <Text style={styles.body}>{meta.description}</Text>
            <View style={styles.actions}>
              <PrimaryButton
                label={tr('threat.listen')}
                variant="secondary"
                onPress={() =>
                  speakThreat(sampleFor(c), false, { characterSlug: c.slug })
                }
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={tr('common.ok')}
                onPress={() => select.mutate(c.id)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        );
      })}

      <Card>
        <Text style={styles.section}>{tr('threat.templates')}</Text>
        <Text style={styles.body}>
          {plus18 ? tr('threat.plus18') : tr('threat.safe')}
        </Text>
        <PrimaryButton
          label={tr('threat.templates')}
          variant="violet"
          onPress={() => router.push('/tehdit/sablonlar')}
          style={{ marginTop: 10 }}
        />
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
  title: { color: colors.onSurface, fontSize: 20, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  lockBadge: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  activeLabel: {
    color: colors.primaryContainer,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  body: { color: colors.onSurfaceVariant, marginTop: 6, fontSize: 16 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mini: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 8,
  },
  metricLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  miniVal: { color: colors.onSurface, fontWeight: '700', marginTop: 2 },
  section: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  charName: { color: colors.onSurface, fontWeight: '700', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
