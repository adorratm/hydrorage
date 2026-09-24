import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fillTemplate } from '@hydrorage/shared';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useT } from '@/lib/i18n';
import {
  hasSeenAppTour,
  markAppTourSeen,
  subscribeAppTour,
} from '@/lib/tour';

const STEPS = [
  {
    route: '/(tabs)/takip',
    icon: 'water',
    title: 'tour.trackTitle',
    body: 'tour.trackBody',
  },
  {
    route: '/(tabs)/icecekler',
    icon: 'cafe',
    title: 'tour.drinksTitle',
    body: 'tour.drinksBody',
  },
  {
    route: '/(tabs)/icecekler',
    icon: 'remove-circle',
    title: 'tour.drinksDebtTitle',
    body: 'tour.drinksDebtBody',
  },
  {
    route: '/(tabs)/tehdit',
    icon: 'megaphone',
    title: 'tour.threatTitle',
    body: 'tour.threatBody',
  },
  {
    route: '/tehdit/karakterler',
    icon: 'people',
    title: 'tour.charactersTitle',
    body: 'tour.charactersBody',
  },
  {
    route: '/tehdit/rutinler',
    icon: 'alarm',
    title: 'tour.routinesTitle',
    body: 'tour.routinesBody',
  },
  {
    route: '/tehdit/sablonlar',
    icon: 'document-text',
    title: 'tour.templatesTitle',
    body: 'tour.templatesBody',
  },
  {
    route: '/tehdit/sablonlar',
    icon: 'create',
    title: 'tour.templatesOwnTitle',
    body: 'tour.templatesOwnBody',
  },
  {
    route: '/(tabs)/istatistik',
    icon: 'bar-chart',
    title: 'tour.statsTitle',
    body: 'tour.statsBody',
  },
  {
    route: '/profile',
    icon: 'person',
    title: 'tour.profileTitle',
    body: 'tour.profileBody',
  },
] as const;

export function AppTour() {
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    void hasSeenAppTour().then((seen) => {
      if (!seen) setOpen(true);
    });
    return subscribeAppTour(() => {
      setStep(0);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    router.navigate(STEPS[step].route);
  }, [open, step, router]);

  if (!open) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const close = () => {
    setOpen(false);
    void markAppTourSeen();
    router.navigate('/(tabs)/takip');
  };

  return (
    <View style={styles.overlay} accessibilityLabel={tr('tour.a11y')}>
      <Pressable style={styles.dim} onPress={close} accessibilityLabel={tr('tour.skip')} />
      <View style={[styles.card, { marginBottom: insets.bottom + 76 }]}>
        <View style={styles.iconWrap}>
          <Ionicons name={current.icon} size={28} color={colors.primaryContainer} />
        </View>
        <Text style={styles.progress}>
          {fillTemplate(tr('onboarding.step'), {
            current: step + 1,
            total: STEPS.length,
          })}
        </Text>
        <Text style={styles.title}>{tr(current.title)}</Text>
        <ScrollView style={styles.bodyScroll} bounces={false}>
          <Text style={styles.body}>{tr(current.body)}</Text>
        </ScrollView>
        <View style={styles.actions}>
          {!last ? (
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={tr('tour.skip')}>
              <Text style={styles.skip}>{tr('tour.skip')}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <PrimaryButton
            label={last ? tr('tour.done') : tr('tour.next')}
            onPress={() => {
              if (last) close();
              else setStep((value) => value + 1);
            }}
            style={styles.next}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 10, 18, 0.72)',
  },
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: spacing.lg,
    gap: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  progress: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '700',
  },
  bodyScroll: {
    maxHeight: 140,
  },
  body: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  skip: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 12,
    paddingRight: 8,
  },
  next: {
    minWidth: 140,
  },
});
