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

type Template = {
  id: string;
  text: string;
  profanityLevel: string;
  isSystem: boolean;
  isActive: boolean;
  playCount: number;
  character?: { name: string } | null;
};

const LEVELS = ['MOCKING', 'NEIGHBORHOOD', 'MILITARY', 'UNFILTERED'] as const;

export default function SablonlarScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [level, setLevel] =
    useState<(typeof LEVELS)[number]>('UNFILTERED');

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api<Template[]>('/templates'),
  });

  const create = useMutation({
    mutationFn: () =>
      api('/templates', {
        method: 'POST',
        body: JSON.stringify({
          text,
          profanityLevel: level,
          isActive: true,
        }),
      }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (e: Error) => Alert.alert('Hata', e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  const toggle = useMutation({
    mutationFn: (t: Template) =>
      api(`/templates/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !t.isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  return (
    <Screen
      subtitle="Tehdit Şablonları"
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryContainer} />
        <Text style={styles.backText}>Geri</Text>
      </Pressable>

      <Card>
        <Text style={styles.title}>Yeni Şablon</Text>
        <Text style={styles.hint}>
          Placeholder: {'{{name}}'}, {'{{debtMl}}'}
        </Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Kalk o suyu iç {{name}}! {{debtMl}} ml borcun var!"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
        />
        <View style={styles.levels}>
          {LEVELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLevel(l)}
              style={[styles.chip, level === l && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  level === l && { color: colors.onPrimary },
                ]}
              >
                {l}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label="Şablonu Kaydet"
          disabled={text.trim().length < 5}
          loading={create.isPending}
          onPress={() => create.mutate()}
          style={{ marginTop: 10 }}
        />
      </Card>

      {(data ?? []).map((t) => (
        <Card key={t.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.meta}>
              {t.isSystem ? 'SİSTEM' : 'SENİN'} · {t.profanityLevel} ·{' '}
              {t.playCount}x
            </Text>
            <Text style={{ color: t.isActive ? colors.success : colors.muted }}>
              {t.isActive ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
          <Text style={styles.text}>“{t.text}”</Text>
          {!!t.character && (
            <Text style={styles.hint}>{t.character.name}</Text>
          )}
          <View style={styles.actions}>
            <PrimaryButton
              label="Dinle"
              variant="secondary"
              onPress={() => speakThreat(t.text)}
              style={{ flex: 1 }}
            />
            {!t.isSystem && (
              <>
                <PrimaryButton
                  label={t.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                  variant="secondary"
                  onPress={() => toggle.mutate(t)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label="Sil"
                  variant="danger"
                  onPress={() =>
                    Alert.alert('Sil?', 'Şablon silinecek', [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: () => remove.mutate(t.id),
                      },
                    ])
                  }
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: colors.primaryContainer, fontWeight: '700' },
  title: { color: colors.onSurface, fontSize: 16, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  input: {
    marginTop: 8,
    minHeight: 90,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 10,
    padding: 12,
    color: colors.onSurface,
  },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  text: { color: colors.onSurface, marginTop: 8, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
});
