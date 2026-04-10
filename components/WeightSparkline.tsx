import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

interface WeightPoint {
  date: string;
  weightKg: number;
}

interface Props {
  data: WeightPoint[];
}

export function WeightSparkline({ data }: Props) {
  if (data.length < 2) return null;

  const chartData = data.map((d) => ({
    value: d.weightKg,
  }));

  const min = Math.min(...data.map((d) => d.weightKg));
  const max = Math.max(...data.map((d) => d.weightKg));
  const latest = data[data.length - 1].weightKg;
  const delta = latest - data[0].weightKg;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Poids</Text>
        <Text style={styles.value}>
          {latest.toFixed(1)} kg{' '}
          <Text style={delta <= 0 ? styles.deltaNeg : styles.deltaPos}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </Text>
        </Text>
      </View>
      <LineChart
        data={chartData}
        height={50}
        width={280}
        color={colors.primary}
        thickness={2}
        curved
        hideDataPoints
        hideYAxisText
        hideAxesAndRules
        yAxisOffset={min - 1}
        maxValue={max - min + 2}
        areaChart
        startFillColor={colors.primary + '30'}
        endFillColor={colors.primary + '05'}
        isAnimated
        animationDuration={600}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  deltaNeg: {
    color: colors.success,
  },
  deltaPos: {
    color: colors.warning,
  },
});
