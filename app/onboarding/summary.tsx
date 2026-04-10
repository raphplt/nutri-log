import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/lib/onboarding-store';
import { ProgressBar } from '@/components/ProgressBar';
import { SelectCard } from '@/components/SelectCard';
import { NumericInput } from '@/components/NumericInput';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing, radii } from '@/constants/theme';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateTargetKcal,
  getMacroPreset,
  macrosFromPercentages,
  type MacroPreset,
} from '@/lib/tdee';

const PRESETS: { value: MacroPreset; title: string; detail: string }[] = [
  { value: 'balanced', title: 'Équilibré', detail: '30% P / 40% G / 30% L' },
  { value: 'high_protein', title: 'High protein', detail: '40% P / 35% G / 25% L' },
  { value: 'low_carb', title: 'Low carb', detail: '35% P / 25% G / 40% L' },
];

export default function SummaryScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const age = data.birthDate ? calculateAge(data.birthDate) : 0;
  const bmr = data.sex ? calculateBMR(data.sex, data.weightKg, data.heightCm, age) : 0;
  const tdee = data.activityLevel ? calculateTDEE(bmr, data.activityLevel) : 0;
  const targetKcal = data.kcalOverride ?? calculateTargetKcal(tdee, data.goalRate);

  const preset = data.macroPreset !== 'custom' ? getMacroPreset(data.macroPreset) : null;
  const macros = preset
    ? macrosFromPercentages(targetKcal, preset.p, preset.c, preset.f)
    : { proteinG: 0, carbsG: 0, fatG: 0 };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar current={5} total={6} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tes objectifs</Text>

        <View style={styles.statsRow}>
          <StatBox label="BMR" value={`${Math.round(bmr)}`} unit="kcal" />
          <StatBox label="TDEE" value={`${tdee}`} unit="kcal" />
        </View>

        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>OBJECTIF QUOTIDIEN</Text>
          <Text style={styles.targetValue}>{targetKcal}</Text>
          <Text style={styles.targetUnit}>kcal / jour</Text>
        </View>

        <NumericInput
          label="Ajuster manuellement"
          value={data.kcalOverride ?? calculateTargetKcal(tdee, data.goalRate)}
          onChangeValue={(v) => update({ kcalOverride: v })}
          unit="kcal"
          min={1000}
          max={6000}
        />

        <Text style={styles.subtitle}>Répartition macros</Text>
        {PRESETS.map((p) => (
          <SelectCard
            key={p.value}
            title={p.title}
            description={p.detail}
            selected={data.macroPreset === p.value}
            onPress={() => update({ macroPreset: p.value })}
          />
        ))}

        {preset && (
          <View style={styles.macroRow}>
            <MacroBox label="Protéines" grams={macros.proteinG} color={colors.primary} />
            <MacroBox label="Glucides" grams={macros.carbsG} color={colors.success} />
            <MacroBox label="Lipides" grams={macros.fatG} color={colors.warning} />
          </View>
        )}
      </ScrollView>
      <NextButton onPress={() => router.push('/onboarding/reminders')} />
    </SafeAreaView>
  );
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function MacroBox({ label, grams, color }: { label: string; grams: number; color: string }) {
  return (
    <View style={styles.macroBox}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroGrams}>{grams}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statUnit: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  targetCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: radii.md,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  targetLabel: {
    fontSize: fontSize.xs,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  targetValue: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  targetUnit: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  macroBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  macroGrams: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  macroLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
