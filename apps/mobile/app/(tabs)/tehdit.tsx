import React, { useState } from 'react';
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
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { speakThreat } from '@/lib/speech';
import { scheduleWaterReminder } from '@/lib/notifications';
import { colors } from '@/constants/theme';

type Settings = {
  voiceNotifications: boolean;
  profanityLevel: 'MOCKING' | 'NEIGHBORHOOD' | 'MILITARY' | 'UNFILTERED';
  activeCharacterId: string | null;
  officeMute: boolean;
  nightMode: boolean;
  remindWater: boolean;
  remindCaffeine: boolean;
  remindMedicine: boolean;
  remindElectrolyte: boolean;
  remindWalk: boolean;
  waterIntervalMinutes: number;
  activeCharacter?: { id: string; name: string } | null;
};

type Character = {
  id: string;
  name: string;
  unlocked: boolean;
};

const LEVELS = [
  { key: 'MOCKING', label: 'Alaycı' },
  { key: 'NEIGHBORHOOD', label: 'Mahalle' },
  { key: 'MILITARY', label: 'Askeriye' },
  { key: 'UNFILTERED', label: 'Filtresiz 🔥' },
] as const;

export default function TehditScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [preview, setPreview] = useState(
    'Kalk o suyu iç lan artık! Böbreklerin çöl kumuna döndü kurumuşsun!',
  );

  const { data: settings, isFetching, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/settings'),
  });

  const { data: characters } = useQuery({
    queryKey: ['characters'],
    queryFn: () => api<Character[]>('/characters'),
  });

  const save = useMutation({
    mutationFn: (body: Partial<Settings>) =>
      api('/settings', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
    onError: (e: Error) => Alert.alert('Hata', e.message),
  });

  const patch = (body: Partial<Settings>) => save.mutate(body);

  const onTest = async () => {
    try {
      const res = await api<{ message: string }>('/threats/preview', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setPreview(res.message);
      const muted = settings?.officeMute || !settings?.voiceNotifications;
      await speakThreat(res.message, muted);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
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
      );
      Alert.alert('Tehdit aktif', 'Azar motoru çalışıyor. Su iç.');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  return (
    <Screen
      subtitle="Bildirim & Tehdit Ayarları"
      refreshing={isFetching}
      onRefresh={() => refetch()}
      onPressVolume={onTest}
    >
      <Card danger>
        <Text style={styles.heroTitle}>Tehdit Aktif +18 Şiddet</Text>
        <Text style={styles.heroBody}>
          Su içmezsen desibel ve küfür frekansı artar. Bahanen yok.
        </Text>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>Azar & Tehdit Motoru</Text>
          <View style={styles.live}>
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.body}>Sesli Küfürlü Bildirimler</Text>
          <Switch
            value={settings?.voiceNotifications ?? true}
            onValueChange={(v) => patch({ voiceNotifications: v })}
            trackColor={{ true: colors.primaryContainer }}
          />
        </View>
        <Text style={[styles.metricLabel, { marginTop: 12 }]}>Küfür Seviyesi</Text>
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
        <Text style={[styles.metricLabel, { marginTop: 12 }]}>Karakter</Text>
        {(characters ?? []).map((c) => (
          <Pressable
            key={c.id}
            disabled={!c.unlocked}
            onPress={() => patch({ activeCharacterId: c.id })}
            style={[
              styles.charRow,
              settings?.activeCharacterId === c.id && styles.charActive,
              !c.unlocked && { opacity: 0.45 },
            ]}
          >
            <Ionicons
              name={
                settings?.activeCharacterId === c.id
                  ? 'radio-button-on'
                  : 'radio-button-off'
              }
              size={18}
              color={colors.primaryContainer}
            />
            <Text style={styles.charName}>{c.name}</Text>
            {!c.unlocked && <Text style={styles.lock}>Kilitli</Text>}
          </Pressable>
        ))}
      </Card>

      <Card>
        <Text style={styles.metricLabel}>96 DB ALARM</Text>
        <Text style={styles.preview}>“{preview}”</Text>
        <PrimaryButton
          label="Hoparlörden Test Et (+96dB)"
          variant="violet"
          onPress={onTest}
        />
      </Card>

      <Card>
        <Text style={styles.title}>Neleri Hatırlatsın?</Text>
        {(
          [
            ['remindWater', 'Su Hatırlatıcı', `Her ${settings?.waterIntervalMinutes ?? 45} dk`],
            ['remindCaffeine', 'Kahve & Kafein Limiti', '3 bardaktan sonra'],
            ['remindMedicine', 'İlaç & Takviye Saatleri', 'B12, Magnezyum'],
            ['remindElectrolyte', 'Bitki Çayı & Elektrolit', 'Akşam'],
            ['remindWalk', 'Kalk Dolaş', 'Ekrana yapışma'],
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
        <Text style={styles.title}>Rezil Olma Koruması</Text>
        <View style={styles.checkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>Ofiste / Toplantıda Küfrü Kıs</Text>
            <Text style={styles.metricLabel}>Gizli agresif titreşim</Text>
          </View>
          <Switch
            value={settings?.officeMute ?? true}
            onValueChange={(v) => patch({ officeMute: v })}
            trackColor={{ true: colors.primaryContainer }}
          />
        </View>
        <View style={styles.checkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>Gece Modu (23:00 - 08:00)</Text>
            <Text style={styles.metricLabel}>Sessiz bildirim</Text>
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
          label="Karakter Kütüphanesi"
          variant="secondary"
          onPress={() => router.push('/tehdit/karakterler')}
        />
        <PrimaryButton
          label="Rutin Planlayıcı"
          variant="secondary"
          onPress={() => router.push('/tehdit/rutinler')}
        />
        <PrimaryButton
          label="Şablonlarım"
          variant="secondary"
          onPress={() => router.push('/tehdit/sablonlar')}
        />
      </View>

      <PrimaryButton
        label="Ayarları Kaydet & Tehdidi Başlat"
        onPress={onSaveStart}
        loading={save.isPending}
      />
      <Text style={styles.disclaimer}>
        Küfürlü içerikten geliştiriciler sorumlu değildir. Kendi rezilliğin.
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
  charActive: { backgroundColor: 'rgba(139,233,253,0.08)' },
  charName: { color: colors.onSurface, flex: 1, fontWeight: '600' },
  lock: { color: colors.muted, fontSize: 10, fontWeight: '700' },
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
