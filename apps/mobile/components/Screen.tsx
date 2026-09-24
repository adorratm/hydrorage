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
  footer,
}: {
  children: React.ReactNode;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressVolume?: () => void;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <AppHeader subtitle={subtitle} onPressVolume={onPressVolume} />
      <NetworkBanner />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (footer ? 160 : 96) },
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
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: {
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});
