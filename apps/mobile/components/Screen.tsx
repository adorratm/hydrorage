import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { NetworkBanner } from '@/components/NetworkBanner';
import { colors, spacing } from '@/constants/theme';

export function Screen({
  children,
  subtitle,
  refreshing,
  onRefresh,
  onPressVolume,
}: {
  children: React.ReactNode;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressVolume?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <AppHeader subtitle={subtitle} onPressVolume={onPressVolume} />
      <NetworkBanner />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 96 },
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryContainer}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: {
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
