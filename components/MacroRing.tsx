import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

interface Props {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroRing({ label, current, target, color, unit = 'g' }: Props) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const remaining = Math.max(1 - pct, 0);

  const data = [
    { value: pct, color },
    { value: remaining, color: colors.surfaceLight },
  ];

  return (
    <View style={styles.container}>
      <PieChart
        data={data}
        donut
        radius={32}
        innerRadius={24}
        innerCircleColor={colors.background}
        centerLabelComponent={() => (
          <Text style={styles.centerText}>{Math.round(pct * 100)}%</Text>
        )}
      />
      <Text style={styles.value}>
        {current}/{target}
        <Text style={styles.unit}>{unit}</Text>
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  centerText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
