import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fillTemplate, localizeCharacter } from '@hydrorage/shared';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { ensureNotificationPermissions, registerExpoPushToken } from '@/lib/notifications';
import { colors, spacing } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

type Character = { id: string; name: string; slug: string };

const GOALS = [2000, 2500, 3000, 3500] as const;

export default function OnboardingScreen() {
  const tr = useT();
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [goalMl, setGoalMl] = useState(2500);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [plus18, setPlus18] = useState(true);
  const [ageOk, setAgeOk] = useState(false);

  const { data: characters } = useQuery({
    queryKey: ['characters', locale],
    queryFn: () => api<Character[]>('/characters'),
  });

  const selectedId = useMemo(
    () => characterId ?? characters?.[0]?.id ?? null,
    [characterId, characters],
  );

  const finish = useMutation({
    mutationFn: async () => {
      if (plus18 && !ageOk) {
        throw new Error(tr('onboarding.ageRequired'));
      }
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ dailyGoalMl: goalMl }),
      });
      await api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          plus18Mode: plus18,
          activeCharacterId: selectedId,
          onboardingCompleted: true,
        }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.replace('/(tabs)/takip');
    },
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const onNext = async () => {
    if (step === 3 && plus18 && !ageOk) {
      Alert.alert(tr('onboarding.ageTitle'), tr('onboarding.ageBody'));
      return;
    }
    if (step === 4) {
      await ensureNotificationPermissions();
      await registerExpoPushToken();
      finish.mutate();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      accessibilityLabel={tr('onboarding.a11yWizard')}
    >
      <Text style={styles.progress}>
        {fillTemplate(tr('onboarding.step'), {
          current: step + 1,
          total: 5,
        })}
      </Text>

      {step === 0 && (
        <View style={styles.block}>
          <Text style={styles.title}>{tr('onboarding.goalTitle')}</Text>
          <Text style={styles.body}>{tr('onboarding.goalBody')}</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGoalMl(g)}
                style={[styles.chip, goalMl === g && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: goalMl === g }}
                accessibilityLabel={`${g} mililitre`}
              >
                <Text style={styles.chipText}>{g} ml</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={styles.block}>
          <Text style={styles.title}>{tr('onboarding.characterTitle')}</Text>
          {(characters ?? []).map((c) => {
            const name = localizeCharacter(c.slug, locale, { name: c.name }).name;
            return (
            <Pressable
              key={c.id}
              onPress={() => setCharacterId(c.id)}
              style={[styles.row, selectedId === c.id && styles.rowOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedId === c.id }}
              accessibilityLabel={name}
            >
              <Ionicons
                name={
                  selectedId === c.id ? 'radio-button-on' : 'radio-button-off'
                }
                size={18}
                color={colors.primaryContainer}
              />
              <Text style={styles.rowText}>{name}</Text>
            </Pressable>
            );
          })}
        </View>
      )}

      {step === 2 && (
        <View style={styles.block}>
          <Text style={styles.title}>{tr('onboarding.modeTitle')}</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>
                {plus18 ? tr('onboarding.modePlus18') : tr('onboarding.modeSafe')}
              </Text>
            </View>
            <Switch
              value={plus18}
              onValueChange={setPlus18}
              accessibilityLabel={tr('threat.plus18')}
            />
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.block}>
          <Text style={styles.title}>{tr('onboarding.ageTitle')}</Text>
          <Text style={styles.body}>{tr('onboarding.ageBody')}</Text>
          {plus18 ? (
            <Pressable
              style={styles.checkRow}
              onPress={() => setAgeOk((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageOk }}
            >
              <Ionicons
                name={ageOk ? 'checkbox' : 'square-outline'}
                size={22}
                color={colors.primaryContainer}
              />
              <Text style={styles.rowText}>{tr('onboarding.ageConfirm')}</Text>
            </Pressable>
          ) : (
            <Text style={styles.body}>{tr('onboarding.modeSafe')}</Text>
          )}
        </View>
      )}

      {step === 4 && (
        <View style={styles.block}>
          <Text style={styles.title}>{tr('onboarding.notifTitle')}</Text>
          <Text style={styles.body}>{tr('onboarding.notifBody')}</Text>
        </View>
      )}

      <PrimaryButton
        label={step === 4 ? tr('onboarding.finish') : tr('onboarding.next')}
        onPress={onNext}
        loading={finish.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.margin, gap: 16, paddingBottom: 40 },
  progress: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  block: { gap: 12 },
  title: {
    color: colors.primaryContainer,
    fontSize: 22,
    fontWeight: '800',
  },
  body: { color: colors.onSurfaceVariant, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.onSurface, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(98,114,164,0.25)',
  },
  rowOn: { backgroundColor: 'rgba(189,147,249,0.12)' },
  rowText: { color: colors.onSurface, fontWeight: '600', flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
