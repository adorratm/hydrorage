import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export function RadialProgress({
  current,
  goal,
}: {
  current: number;
  goal: number;
}) {
  const size = 144;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, goal > 0 ? current / goal : 0);
  const offset = c * (1 - pct);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceContainerHighest}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primaryContainer}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        <Ionicons name="water" size={22} color={colors.primaryContainer} />
        <Text style={styles.value}>{current.toLocaleString('tr-TR')}</Text>
        <Text style={styles.goal}>/ {goal.toLocaleString('tr-TR')} ml</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 144, height: 144, alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  goal: { color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
});
