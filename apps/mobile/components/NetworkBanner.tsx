import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useT } from '@/lib/i18n';

export function NetworkBanner() {
  const tr = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;
      setOffline(!online);
    });
    return () => sub();
  }, []);

  if (!offline) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel={tr('network.offline')}
    >
      <Ionicons name="cloud-offline" size={16} color={colors.onError} />
      <Text style={styles.text}>{tr('network.offline')}</Text>
      <Pressable
        onPress={() => NetInfo.fetch()}
        accessibilityRole="button"
        accessibilityLabel={tr('network.retry')}
      >
        <Text style={styles.retry}>{tr('network.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { color: colors.error, flex: 1, fontSize: 12, fontWeight: '700' },
  retry: { color: colors.onSurface, fontSize: 12, fontWeight: '800' },
});
