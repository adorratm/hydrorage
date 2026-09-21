import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fillTemplate, localizeCharacter } from '@hydrorage/shared';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { scheduleWaterReminder } from '@/lib/notifications';
import { colors } from '@/constants/theme';
import { fallbackThreat, isPlus18 } from '@/lib/tone';
import { getLocale, setLocale, useLocale, useT } from '@/lib/i18n';

type Settings = {
  voiceNotifications: boolean;
  plus18Mode: boolean;
  profanityLevel: 'SAFE' | 'MOCKING' | 'NEIGHBORHOOD' | 'MILITARY' | 'UNFILTERED';
  activeCharacterId: string | null;
  officeMute: boolean;
  nightMode: boolean;
  publicShameProtection: boolean;
  whisperVolume: number;
  remindWater: boolean;
  remindCaffeine: boolean;
  remindMedicine: boolean;
  remindElectrolyte: boolean;
  remindWalk: boolean;
  waterIntervalMinutes: number;
  activeCharacter?: { id: string; name: string; slug?: string } | null;
};

type Character = {
  id: string;
  slug: string;
  name: string;
  unlocked: boolean;
  unlockStreakDays?: number;
};

export default function TehditScreen() {
  const tr = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const locale = useLocale();
  const [preview, setPreview] = useState(() => fallbackThreat(true, locale));

  const LEVELS = [
    { key: 'MOCKING' as const, label: tr('threat.level.mocking') },
    { key: 'NEIGHBORHOOD' as const, label: tr('threat.level.neighborhood') },
    { key: 'MILITARY' as const, label: tr('threat.level.military') },
    { key: 'UNFILTERED' as const, label: tr('threat.level.unfiltered') },
  ];

  const { data: settings, isFetching, refetch } = useQuery({
    queryKey: ['settings', locale],
    queryFn: () => api<Settings>('/settings'),
  });

  const plus18 = isPlus18(settings);

  useEffect(() => {
    setPreview(fallbackThreat(plus18, locale));
  }, [locale, plus18]);

  const { data: characters } = useQuery({
    queryKey: ['characters', locale],
    queryFn: () => api<Character[]>('/characters'),
  });

  const save = useMutation({
    mutationFn: (body: Partial<Settings>) =>
      api('/settings', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const patch = (body: Partial<Settings>) => save.mutate(body);

  const onTest = async () => {
    try {
      const res = await api<{ message: string }>('/threats/preview', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setPreview(res.message);
      const slug =
        settings?.activeCharacter?.slug ??
        characters?.find((c) => c.id === settings?.activeCharacterId)?.slug;
      await speakThreat(res.message, false, {
        forceSpeak: true,
        characterSlug: slug,
      });
    } catch (e: any) {
      Alert.alert(tr('common.error'), e.message);
    }
  };

  const onSaveStart = async () => {
    try {
      const threat = await api<{ message: string; scheduledAt: string }>(
        '/threats/schedule-next',
        { method: 'POST', body: '{}' },
      );
      await scheduleWaterReminder(
        settings?.waterIntervalMinutes ?? 45,
        threat.message,
        plus18,
      );
      Alert.alert(tr('threat.title'), tr('threat.start'));
    } catch (e: any) {
      Alert.alert(tr('common.error'), e.message);
    }
  };

  const mins = settings?.waterIntervalMinutes ?? 45;

  return (
    <Screen
      subtitle={tr('threat.title')}
      refreshing={isFetching}
      onRefresh={() => refetch()}
      onPressVolume={onTest}
    >
      <Card danger={plus18}>
        <Text style={[styles.heroTitle, !plus18 && styles.heroTitleSafe]}>
          {plus18 ? tr('threat.plus18') : tr('threat.safe')}
        </Text>
        <Text style={styles.heroBody}>
          {plus18 ? tr('threat.heroPlus18') : tr('threat.heroSafe')}
        </Text>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>{tr('threat.plus18')}</Text>
            <Text style={styles.metricLabel}>
              {plus18 ? tr('threat.plus18') : tr('threat.safe')}
            </Text>
          </View>
          <Switch
            value={plus18}
            onValueChange={(v) => {
              patch({ plus18Mode: v });
              setPreview(fallbackThreat(v, locale));
            }}
            trackColor={{ true: colors.primaryContainer }}
            accessibilityLabel={tr('threat.plus18')}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>{tr('common.language')}</Text>
        <View style={styles.levelRow}>
          {(['tr', 'en'] as const).map((code) => (
            <Pressable
              key={code}
              onPress={() => {
                void setLocale(code).then(() => {
                  void qc.invalidateQueries();
                });
              }}
              style={[
                styles.levelChip,
                locale === code && styles.levelActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: locale === code }}
              accessibilityLabel={code === 'tr' ? 'Türkçe' : 'English'}
            >
              <Text
                style={[
                  styles.levelText,
                  locale === code && { color: colors.onPrimary },
                ]}
              >
                {code === 'tr' ? 'Türkçe' : 'English'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.metricLabel, { marginTop: 8 }]}>
          {fillTemplate(tr('threat.localeActive'), {
            code: getLocale().toUpperCase(),
          })}
        </Text>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>
            {plus18 ? tr('threat.enginePlus18') : tr('threat.engineSafe')}
          </Text>
          <View style={styles.live}>
            <Text style={styles.liveText}>{tr('threat.live')}</Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.body}>
            {plus18 ? tr('threat.voicePlus18') : tr('threat.voiceSafe')}
          </Text>
          <Switch
            value={settings?.voiceNotifications ?? true}
            onValueChange={(v) => patch({ voiceNotifications: v })}
            trackColor={{ true: colors.primaryContainer }}
          />
        </View>
        {plus18 && (
          <>
            <Text style={[styles.metricLabel, { marginTop: 12 }]}>
              {tr('threat.profanityLevel')}
            </Text>
            <View style={styles.levelRow}>
              {LEVELS.map((l) => (
                <Pressable
                  key={l.key}
                  onPress={() => patch({ profanityLevel: l.key })}
                  style={[
                    styles.levelChip,
                    settings?.profanityLevel === l.key && styles.levelActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.levelText,
                      settings?.profanityLevel === l.key && {
                        color: colors.onPrimary,
                      },
                    ]}
                  >
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Text style={[styles.metricLabel, { marginTop: 12 }]}>
          {tr('threat.voiceCharacter')}
        </Text>
        {(characters ?? []).map((c) => {
          const meta = localizeCharacter(c.slug, locale, { name: c.name });
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                if (!c.unlocked) {
                  Alert.alert(
                    tr('threat.locked'),
                    fillTemplate(tr('threat.lockedBody'), {
                      days: c.unlockStreakDays ?? '?',
                    }),
                  );
                  return;
                }
                patch({ activeCharacterId: c.id });
              }}
              style={[
                styles.charRow,
                settings?.activeCharacterId === c.id && styles.charActive,
                !c.unlocked && { opacity: 0.5 },
              ]}
            >
              <Ionicons
                name={
                  !c.unlocked
                    ? 'lock-closed'
                    : settings?.activeCharacterId === c.id
                      ? 'radio-button-on'
                      : 'radio-button-off'
                }
                size={18}
                color={colors.primaryContainer}
              />
              <Text style={styles.charName}>
                {meta.name}
                {!c.unlocked ? ` · ${c.unlockStreakDays}d` : ''}
              </Text>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <Text style={styles.metricLabel}>
          {plus18 ? tr('threat.alarm96') : tr('threat.previewSafe')}
        </Text>
        <Text style={styles.preview}>“{preview}”</Text>
        <PrimaryButton
          label={tr('threat.listen')}
          variant="violet"
          onPress={onTest}
        />
      </Card>

      <Card>
        <Text style={styles.title}>{tr('threat.remindTitle')}</Text>
        {(
          [
            [
              'remindWater',
              tr('threat.remind.water'),
              fillTemplate(tr('threat.remind.waterHint'), { mins }),
            ],
            [
              'remindCaffeine',
              tr('threat.remind.caffeine'),
              tr('threat.remind.caffeineHint'),
            ],
            [
              'remindMedicine',
              tr('threat.remind.medicine'),
              tr('threat.remind.medicineHint'),
            ],
            [
              'remindElectrolyte',
              tr('threat.remind.electrolyte'),
              tr('threat.remind.electrolyteHint'),
            ],
            [
              'remindWalk',
              tr('threat.remind.walk'),
              tr('threat.remind.walkHint'),
            ],
          ] as const
        ).map(([key, label, hint]) => (
          <View key={key} style={styles.checkRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>{label}</Text>
              <Text style={styles.metricLabel}>{hint}</Text>
            </View>
            <Switch
              value={!!settings?.[key]}
              onValueChange={(v) => patch({ [key]: v } as any)}
              trackColor={{ true: colors.primaryContainer }}
            />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.title}>
          {plus18
            ? tr('threat.protectionPlus18')
            : tr('threat.protectionSafe')}
        </Text>
        <View style={styles.checkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>{tr('threat.shame')}</Text>
            <Text style={styles.metricLabel}>{tr('threat.shameHint')}</Text>
          </View>
          <Switch
            value={settings?.publicShameProtection ?? true}
            onValueChange={(v) => patch({ publicShameProtection: v })}
            trackColor={{ true: colors.primaryContainer }}
            accessibilityLabel={tr('threat.shame')}
          />
        </View>
        <Text style={[styles.metricLabel, { marginTop: 4 }]}>
          {fillTemplate(tr('threat.whisperVol'), {
            vol: settings?.whisperVolume ?? 45,
          })}
        </Text>
        <View style={styles.levelRow}>
          {[0, 25, 45, 70].map((v) => (
            <Pressable
              key={v}
              onPress={() => patch({ whisperVolume: v })}
              style={[
                styles.levelChip,
                (settings?.whisperVolume ?? 45) === v && styles.levelActive,
              ]}
            >
              <Text
                style={[
                  styles.levelText,
                  (settings?.whisperVolume ?? 45) === v && {
                    color: colors.onPrimary,
                  },
                ]}
              >
                {v === 0 ? tr('threat.silent') : `%${v}`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.checkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>
              {plus18 ? tr('threat.officePlus18') : tr('threat.officeSafe')}
            </Text>
            <Text style={styles.metricLabel}>{tr('threat.officeHint')}</Text>
          </View>
          <Switch
            value={settings?.officeMute ?? true}
            onValueChange={(v) => patch({ officeMute: v })}
            trackColor={{ true: colors.primaryContainer }}
          />
        </View>
        <View style={styles.checkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>{tr('threat.night')}</Text>
            <Text style={styles.metricLabel}>{tr('threat.nightHint')}</Text>
          </View>
          <Switch
            value={settings?.nightMode ?? true}
            onValueChange={(v) => patch({ nightMode: v })}
            trackColor={{ true: colors.primaryContainer }}
          />
        </View>
      </Card>

      <View style={styles.navLinks}>
        <PrimaryButton
          label={tr('threat.characters')}
          variant="secondary"
          onPress={() => router.push('/tehdit/karakterler')}
        />
        <PrimaryButton
          label={tr('threat.routines')}
          variant="secondary"
          onPress={() => router.push('/tehdit/rutinler')}
        />
        <PrimaryButton
          label={tr('threat.templates')}
          variant="secondary"
          onPress={() => router.push('/tehdit/sablonlar')}
        />
      </View>

      <PrimaryButton
        label={tr('threat.start')}
        onPress={onSaveStart}
        loading={save.isPending}
      />
      <Text style={styles.disclaimer}>
        {plus18 ? tr('threat.disclaimerPlus18') : tr('threat.disclaimerSafe')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitleSafe: {
    color: colors.primaryContainer,
  },
  heroBody: { color: colors.onSurface, marginTop: 6, fontSize: 13 },
  title: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  live: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveText: { color: colors.onPrimary, fontSize: 10, fontWeight: '800' },
  body: { color: colors.onSurface, fontSize: 14, fontWeight: '600' },
  metricLabel: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  levelChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  levelActive: { backgroundColor: colors.accent },
  levelText: { color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '700' },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(98,114,164,0.25)',
  },
  charActive: { backgroundColor: 'rgba(189,147,249,0.12)' },
  charName: { color: colors.onSurface, flex: 1, fontWeight: '600' },
  preview: { color: colors.onSurface, marginVertical: 10, fontSize: 13 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  navLinks: { gap: 8 },
  disclaimer: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
  },
});
