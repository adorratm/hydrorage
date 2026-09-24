import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fillTemplate, localeTag } from '@hydrorage/shared';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';
import { isPlus18 } from '@/lib/tone';
import { useLocale, useT } from '@/lib/i18n';

type Log = {
  id: string;
  plannedAt: string;
  status: string;
  routine: {
    title: string;
    description: string | null;
    amountMl: number;
  };
};

export default function RutinlerScreen() {
  const tr = useT();
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [amountMl, setAmountMl] = useState('350');
  const [time, setTime] = useState('14:00');
  const [intensity, setIntensity] = useState<'LIGHT' | 'HARD' | 'SIREN'>('HARD');

  const { data: timeline, isFetching, refetch } = useQuery({
    queryKey: ['timeline'],
    queryFn: () => api<Log[]>('/routines/timeline'),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ plus18Mode: boolean }>('/settings'),
  });
  const plus18 = isPlus18(settings);

  const create = useMutation({
    mutationFn: () =>
      api('/routines', {
        method: 'POST',
        body: JSON.stringify({
          title: title || tr('routine.defaultTitle'),
          description: plus18
            ? tr('routine.descPlus18')
            : tr('routine.descSafe'),
          drinkType: 'WATER',
          amountMl: Number(amountMl) || 350,
          kind: 'SPECIFIC_TIMES',
          specificTimes: [time],
          intensity,
        }),
      }),
    onSuccess: () => {
      setTitle('');
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['routines'] });
      Alert.alert(tr('routine.addedTitle'), tr('routine.addedBody'));
    },
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const complete = useMutation({
    mutationFn: (id: string) =>
      api(`/routines/logs/${id}/complete`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeline'] }),
  });

  const done = (timeline ?? []).filter((t) => t.status === 'COMPLETED').length;
  const total = timeline?.length ?? 0;

  return (
    <Screen
      subtitle={tr('routine.subtitle')}
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryContainer} />
        <Text style={styles.backText}>{tr('routine.back')}</Text>
      </Pressable>

      {(timeline ?? []).some((t) => t.status === 'MISSED') && (
        <Card danger>
          <Text style={styles.violation}>{tr('routine.violation')}</Text>
          <Text style={styles.body}>{tr('routine.violationBody')}</Text>
        </Card>
      )}

      <View style={styles.rowBetween}>
        <Text style={styles.title}>{tr('routine.timeline')}</Text>
        <Text style={styles.metricLabel}>
          {fillTemplate(tr('routine.planned'), { done, total })}
        </Text>
      </View>

      {(timeline ?? []).map((log) => (
        <Card key={log.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.time}>
              {new Date(log.plannedAt).toLocaleTimeString(localeTag(locale), {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {log.routine.amountMl} ml
            </Text>
            <Text
              style={{
                color:
                  log.status === 'COMPLETED'
                    ? colors.success
                    : log.status === 'MISSED'
                      ? colors.error
                      : colors.warning,
                fontWeight: '700',
                fontSize: 14,
              }}
            >
              {log.status === 'COMPLETED'
                ? tr('routine.done')
                : log.status === 'MISSED'
                  ? tr('routine.missed')
                  : tr('routine.pending')}
            </Text>
          </View>
          <Text style={styles.itemTitle}>{log.routine.title}</Text>
          {!!log.routine.description && (
            <Text style={styles.body}>{log.routine.description}</Text>
          )}
          <View style={styles.actions}>
            {log.status !== 'COMPLETED' && (
              <PrimaryButton
                label={
                  log.status === 'MISSED'
                    ? tr('routine.makeUp')
                    : tr('routine.drankEarly')
                }
                onPress={() => complete.mutate(log.id)}
                style={{ flex: 1 }}
              />
            )}
            <PrimaryButton
              label={tr('routine.listen')}
              variant="secondary"
              onPress={() =>
                speakThreat(
                  fillTemplate(
                    plus18
                      ? tr('routine.listenPlus18')
                      : tr('routine.listenSafe'),
                    {
                      title: log.routine.title,
                      ml: log.routine.amountMl,
                    },
                  ),
                )
              }
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: colors.secondaryContainer }}>
        <Text style={styles.title}>{tr('routine.caffeineTitle')}</Text>
        <Text style={styles.body}>{tr('routine.caffeineBody')}</Text>
      </Card>

      <Card>
        <Text style={styles.title}>{tr('routine.addTitle')}</Text>
        <TextInput
          style={styles.input}
          placeholder={tr('routine.placeholderTitle')}
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="ml"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={amountMl}
            onChangeText={setAmountMl}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="HH:MM"
            placeholderTextColor={colors.muted}
            value={time}
            onChangeText={setTime}
          />
        </View>
        <View style={styles.intensityRow}>
          {(
            [
              ['LIGHT', tr('routine.intensity.light')],
              ['HARD', tr('routine.intensity.hard')],
              ['SIREN', tr('routine.intensity.siren')],
            ] as const
          ).map(([k, label]) => (
            <Pressable
              key={k}
              onPress={() => setIntensity(k)}
              style={[
                styles.intensity,
                intensity === k && styles.intensityActive,
              ]}
            >
              <Text
                style={[
                  styles.intensityText,
                  intensity === k && { color: colors.onPrimary },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label={tr('routine.addBtn')}
          onPress={() => create.mutate()}
          loading={create.isPending}
          style={{ marginTop: 10 }}
        />
      </Card>

      <PrimaryButton label={tr('routine.sync')} onPress={() => refetch()} />
    </Screen>
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
  title: { color: colors.onSurface, fontSize: 16, fontWeight: '700' },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  violation: { color: colors.error, fontWeight: '700', fontSize: 16 },
  body: { color: colors.onSurfaceVariant, fontSize: 16, marginTop: 6 },
  time: { color: colors.primaryContainer, fontWeight: '700', fontSize: 16 },
  itemTitle: { color: colors.onSurface, fontWeight: '700', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    color: colors.onSurface,
    marginTop: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  intensityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  intensity: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  intensityActive: { backgroundColor: colors.accent },
  intensityText: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
});
