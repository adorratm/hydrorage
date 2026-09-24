import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function Card({
  children,
  style,
  danger,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  danger?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        danger && styles.danger,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(98,114,164,0.35)',
  },
  danger: {
    borderColor: colors.danger,
    backgroundColor: colors.surfaceContainerHigh,
  },
});
