import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Share,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/constants/theme';
import { getLocale, setLocale, useLocale, useT } from '@/lib/i18n';

type Me = {
  id: string;
  email: string;
  displayName: string;
  dailyGoalMl: number;
  streakDays: number;
};

export default function ProfileScreen() {
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const qc = useQueryClient();
  const locale = useLocale();

  const { data: me, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/users/me'),
  });

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    if (!me) return;
    setName(me.displayName);
    setGoal(String(me.dailyGoalMl));
  }, [me?.id, me?.displayName, me?.dailyGoalMl]);

  const save = useMutation({
    mutationFn: () =>
      api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: name.trim() || me?.displayName,
          dailyGoalMl: Number(goal) || me?.dailyGoalMl,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert(tr('profile.saved'), tr('profile.updated'));
    },
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const exportData = useMutation({
    mutationFn: () => api<Record<string, unknown>>('/users/me/export'),
    onSuccess: async (data) => {
      await Share.share({
        message: JSON.stringify(data, null, 2).slice(0, 100000),
        title: 'HydroRage',
      });
    },
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api('/users/me', { method: 'DELETE' }),
    onSuccess: async () => {
      await logout();
      router.replace('/(auth)/login');
    },
    onError: (e: Error) => Alert.alert(tr('common.error'), e.message),
  });

  const confirmDelete = () => {
    Alert.alert(tr('profile.delete'), tr('dialog.confirmDelete'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('common.delete'),
        style: 'destructive',
        onPress: () => deleteAccount.mutate(),
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        padding: spacing.margin,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
        gap: 12,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel={tr('common.close')}
      >
        <Ionicons name="arrow-back" size={20} color={colors.primaryContainer} />
        <Text style={styles.backText}>{tr('common.close')}</Text>
      </Pressable>

      <Text style={styles.title}>{tr('profile.title')}</Text>
      <Text style={styles.sub}>{me?.email}</Text>

      <Card>
        <Text style={styles.label}>{tr('profile.title')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.muted}
        />
        <Text style={[styles.label, { marginTop: 12 }]}>
          {tr('track.goal')} (ml)
        </Text>
        <TextInput
          style={styles.input}
          value={goal}
          onChangeText={setGoal}
          keyboardType="number-pad"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.meta}>
          {tr('track.streak')}: {me?.streakDays ?? 0}
        </Text>
        <PrimaryButton
          label={tr('common.save')}
          onPress={() => save.mutate()}
          loading={save.isPending}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card>
        <Text style={styles.label}>{tr('common.language')}</Text>
        <View style={styles.row}>
          {(['tr', 'en'] as const).map((code) => (
            <Pressable
              key={code}
              onPress={() => {
                void setLocale(code).then(() => {
                  void api('/settings', {
                    method: 'PATCH',
                    body: JSON.stringify({ locale: code }),
                  }).catch(() => {});
                  void qc.invalidateQueries();
                });
              }}
              style={[styles.chip, locale === code && styles.chipOn]}
            >
              <Text style={styles.chipText}>
                {code === 'tr' ? 'Türkçe' : 'English'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.meta}>{getLocale().toUpperCase()}</Text>
      </Card>

      <Card>
        <Text style={styles.disclaimerTitle}>{tr('profile.medicalTitle')}</Text>
        <Text style={styles.disclaimer}>{tr('profile.medicalBody')}</Text>
      </Card>

      <PrimaryButton
        label={tr('profile.export')}
        variant="secondary"
        onPress={() => exportData.mutate()}
        loading={exportData.isPending}
      />
      <PrimaryButton
        label={tr('profile.logout')}
        variant="secondary"
        onPress={logout}
      />
      <PrimaryButton
        label={tr('profile.delete')}
        variant="danger"
        onPress={confirmDelete}
        loading={deleteAccount.isPending}
      />
      <PrimaryButton
        label={tr('network.retry')}
        variant="secondary"
        onPress={() => void refetch()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: colors.primaryContainer, fontWeight: '700' },
  title: {
    color: colors.primaryContainer,
    fontSize: 28,
    fontWeight: '700',
  },
  sub: { color: colors.onSurfaceVariant },
  label: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.onSurface,
    fontWeight: '700',
  },
  meta: { color: colors.muted, marginTop: 8, fontSize: 16 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.onSurface, fontWeight: '700', fontSize: 16 },
  disclaimerTitle: {
    color: colors.warning,
    fontWeight: '700',
    marginBottom: 6,
  },
  disclaimer: { color: colors.onSurfaceVariant, fontSize: 16, lineHeight: 18 },
});
