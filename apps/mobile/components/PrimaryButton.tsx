import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'violet';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  style,
  loading,
  disabled,
  icon,
}: Props) {
  const bg =
    variant === 'primary'
      ? colors.primaryContainer
      : variant === 'danger'
        ? colors.danger
        : variant === 'violet'
          ? colors.secondaryContainer
          : 'transparent';
  const color =
    variant === 'secondary' ? colors.foreground : colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.85 : 1 },
        variant === 'secondary' && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.labelRow}>
          {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
          <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.muted,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
