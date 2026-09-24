import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/PrimaryButton';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'water-outline',
  title,
  body,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${body}`}
    >
      <Ionicons name={icon} size={36} color={colors.primaryContainer} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={{ marginTop: 12, alignSelf: 'center', minWidth: 180 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 8,
  },
  title: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  body: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 18,
    alignSelf: 'stretch',
  },
});
