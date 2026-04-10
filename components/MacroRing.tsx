import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { colors, fontSize, spacing } from '@/constants/theme';

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
    { value: remaining, color: colors.surface },
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
        {current}/{target}{unit}
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
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
