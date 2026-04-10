import { useState } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { todayString } from '@/lib/date';
import { upsertWeight } from '@/lib/weight-service';
import { useRecentWeights } from '@/hooks/useRecentWeights';
import { NumericInput } from '@/components/NumericInput';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

export default function WeightScreen() {
  const weights = useRecentWeights(60);
  const [weightKg, setWeightKg] = useState(weights[weights.length - 1]?.weightKg ?? 70);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await upsertWeight(todayString(), weightKg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
  };

  const chartData = weights.map((w) => ({ value: w.weightKg }));
  const min = weights.length > 0 ? Math.min(...weights.map((w) => w.weightKg)) : 60;
  const max = weights.length > 0 ? Math.max(...weights.map((w) => w.weightKg)) : 90;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Input */}
      <NumericInput
        label="Poids aujourd'hui"
        value={weightKg}
        onChangeValue={setWeightKg}
        unit="kg"
        decimal
        min={30}
        max={300}
      />
      <NextButton
        label={saving ? 'Enregistrement...' : 'Enregistrer'}
        onPress={handleSave}
        disabled={saving}
      />

      {/* Chart */}
      {weights.length >= 2 && (
        <View style={styles.chartCard}>
          <Text style={styles.sectionLabel}>ÉVOLUTION</Text>
          <LineChart
            data={chartData}
            height={160}
            color={colors.primary}
            thickness={2}
            curved
            hideDataPoints={weights.length > 15}
            dataPointsColor={colors.primary}
            yAxisTextStyle={{ color: colors.textDim, fontSize: 10 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border + '40'}
            yAxisOffset={Math.floor(min) - 1}
            maxValue={Math.ceil(max) - Math.floor(min) + 2}
            noOfSections={4}
            areaChart
            startFillColor={colors.primary + '30'}
            endFillColor={colors.primary + '05'}
            isAnimated
            animationDuration={600}
          />
        </View>
      )}

      {/* History */}
      <Text style={styles.sectionLabel}>HISTORIQUE</Text>
      {weights.length === 0 ? (
        <Text style={styles.empty}>Aucune pesée enregistrée</Text>
      ) : (
        [...weights].reverse().map((w) => (
          <View key={w.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{w.date}</Text>
            <Text style={styles.historyWeight}>{w.weightKg.toFixed(1)} kg</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.textDim,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.lg,
    marginBottom: spacing.xs,
  },
  historyDate: { fontSize: fontSize.md, color: colors.textMuted },
  historyWeight: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
});
