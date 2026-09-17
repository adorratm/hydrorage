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
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';

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

  const create = useMutation({
    mutationFn: () =>
      api('/routines', {
        method: 'POST',
        body: JSON.stringify({
          title: title || 'Su Seansı',
          description: 'Snooze basarsan küfür hoparlöre gider.',
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
      Alert.alert('Eklendi', 'Rutin tehdit listesine girdi.');
    },
    onError: (e: Error) => Alert.alert('Hata', e.message),
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
      subtitle="Özel Hatırlatıcı / Rutin"
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryContainer} />
        <Text style={styles.backText}>Geri</Text>
      </Pressable>

      {(timeline ?? []).some((t) => t.status === 'MISSED') && (
        <Card danger>
          <Text style={styles.violation}>BUGÜNKÜ İHLAL RAPORU</Text>
          <Text style={styles.body}>
            Kaçırdığın seanslar için mahalle rezaleti azarı hoparlöre
            basıldı.
          </Text>
        </Card>
      )}

      <View style={styles.rowBetween}>
        <Text style={styles.title}>Günlük Zaman Çizelgesi</Text>
        <Text style={styles.metricLabel}>
          {done}/{total} Planlı
        </Text>
      </View>

      {(timeline ?? []).map((log) => (
        <Card key={log.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.time}>
              {new Date(log.plannedAt).toLocaleTimeString('tr-TR', {
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
                fontWeight: '800',
                fontSize: 10,
              }}
            >
              {log.status === 'COMPLETED'
                ? 'Tamamlandı'
                : log.status === 'MISSED'
                  ? 'Kaçırıldı!'
                  : 'Bekliyor'}
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
                  log.status === 'MISSED' ? 'Şimdi Telafi Et' : 'Önceden İçtim'
                }
                onPress={() => complete.mutate(log.id)}
                style={{ flex: 1 }}
              />
            )}
            <PrimaryButton
              label="Cezayı Dinle"
              variant="secondary"
              onPress={() =>
                speakThreat(
                  `Ulan ${log.routine.title} seansını kaçırma! ${log.routine.amountMl} ml hemen iç!`,
                )
              }
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: colors.secondaryContainer }}>
        <Text style={styles.title}>Kafein & Alkol Dengeleme Algoritması</Text>
        <Text style={styles.body}>
          Espresso +150ml · Filtre kahve +200ml · Alkol +500ml otomatik su
          borcu.
        </Text>
      </Card>

      <Card>
        <Text style={styles.title}>Yeni Rutin / Takviye Ekle</Text>
        <TextInput
          style={styles.input}
          placeholder="Başlık"
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
              ['LIGHT', 'Hafif Alaycı'],
              ['HARD', 'Sert Tokat'],
              ['SIREN', 'Acil Siren'],
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
          label="+ Bu Rutini Tehdit Listesine Ekle"
          onPress={() => create.mutate()}
          loading={create.isPending}
          style={{ marginTop: 10 }}
        />
      </Card>

      <PrimaryButton
        label="Rutinleri & Cezaları Senkronize Et"
        onPress={() => refetch()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: colors.primaryContainer, fontWeight: '700' },
  violation: { color: colors.error, fontWeight: '800', letterSpacing: 0.5 },
  body: { color: colors.onSurfaceVariant, marginTop: 6, fontSize: 13 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.onSurface, fontSize: 16, fontWeight: '800' },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  time: { color: colors.primaryContainer, fontWeight: '700' },
  itemTitle: { color: colors.onSurface, fontWeight: '700', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 10,
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
  intensityActive: { backgroundColor: colors.danger },
  intensityText: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' },
});
