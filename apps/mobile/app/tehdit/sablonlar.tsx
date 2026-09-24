import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fillTemplate, firstName, localizeCharacter, stripYametePhrase, withRandomJapaneseTail } from '@hydrorage/shared';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { colors } from '@/constants/theme';
import { confirmAction, showAlert } from '@/lib/dialog';
import { useLocale, useT } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

type Template = {
  id: string;
  text: string;
  profanityLevel: string;
  isSystem: boolean;
  isActive: boolean;
  playCount: number;
  character?: { name: string; slug?: string } | null;
};

const LEVELS = ['SAFE', 'MOCKING', 'NEIGHBORHOOD', 'MILITARY', 'UNFILTERED'] as const;

const LEVEL_LABEL = {
  SAFE: 'threat.level.safe',
  MOCKING: 'threat.level.mocking',
  NEIGHBORHOOD: 'threat.level.neighborhood',
  MILITARY: 'threat.level.military',
  UNFILTERED: 'threat.level.unfiltered',
} as const;

export default function SablonlarScreen() {
  const tr = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [level, setLevel] =
    useState<(typeof LEVELS)[number]>('UNFILTERED');

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['templates', locale],
    queryFn: () => api<Template[]>('/templates'),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings', locale],
    queryFn: () =>
      api<{ activeCharacter?: { slug?: string | null } | null }>('/settings'),
  });
  const { data: dash } = useQuery({
    queryKey: ['dashboard', locale],
    queryFn: () => api<{ remaining: number }>('/dashboard/today'),
  });

  const spoken = (text: string) =>
    fillTemplate(text, {
      name: firstName(user?.displayName),
      debtMl: dash?.remaining ?? 0,
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
    onError: (e: Error) => showAlert(tr('common.error'), e.message),
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
      subtitle={tr('templates.title')}
      refreshing={isFetching}
      onRefresh={() => refetch()}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryContainer} />
        <Text style={styles.backText}>{tr('routine.back')}</Text>
      </Pressable>

      <Card>
        <Text style={styles.title}>{tr('templates.new')}</Text>
        <Text style={styles.hint}>{tr('templates.hint')}</Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder={tr('templates.placeholder')}
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
                {tr(LEVEL_LABEL[l])}
              </Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          label={tr('templates.save')}
          disabled={text.trim().length < 5}
          loading={create.isPending}
          onPress={() => create.mutate()}
          style={{ marginTop: 10 }}
        />
      </Card>

      {(data ?? []).map((tpl) => {
        const charName = tpl.character
          ? localizeCharacter(tpl.character.slug, locale, {
              name: tpl.character.name,
            }).name
          : null;
        return (
          <Card key={tpl.id}>
            <View style={styles.rowBetween}>
              <Text style={styles.meta}>
                {tpl.isSystem ? tr('templates.system') : tr('templates.yours')} ·{' '}
                {tr(
                  LEVEL_LABEL[tpl.profanityLevel as (typeof LEVELS)[number]] ??
                    'threat.level.safe',
                )}{' '}
                · {tpl.playCount}x
              </Text>
              <Text
                style={{
                  color: tpl.isActive ? colors.success : colors.muted,
                }}
              >
                {tpl.isActive
                  ? tr('templates.active')
                  : tr('templates.inactive')}
              </Text>
            </View>
            <Text style={styles.text}>“{stripYametePhrase(spoken(tpl.text))}”</Text>
            {!!charName && <Text style={styles.hint}>{charName}</Text>}
            <View style={styles.actions}>
              <PrimaryButton
                label={tr('templates.listen')}
                variant="secondary"
                onPress={() => {
                  const slug =
                    tpl.character?.slug ?? settings?.activeCharacter?.slug;
                  speakThreat(
                    withRandomJapaneseTail(spoken(tpl.text), slug, !tpl.isSystem),
                    false,
                    { characterSlug: slug },
                  );
                }}
                style={{ flex: 1 }}
              />
              {!tpl.isSystem && (
                <>
                  <PrimaryButton
                    label={
                      tpl.isActive
                        ? tr('templates.deactivate')
                        : tr('templates.activate')
                    }
                    variant="secondary"
                    onPress={() => toggle.mutate(tpl)}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    label={tr('common.delete')}
                    variant="danger"
                    onPress={() =>
                      confirmAction({
                        title: tr('templates.deleteConfirm'),
                        message: tr('templates.deleteBody'),
                        confirmLabel: tr('common.delete'),
                        destructive: true,
                        onConfirm: () => remove.mutate(tpl.id),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                </>
              )}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: colors.primaryContainer, fontWeight: '700' },
  title: { color: colors.onSurface, fontSize: 16, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 14, marginTop: 4 },
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
  chipText: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '700' },
  text: { color: colors.onSurface, marginTop: 8, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
});
