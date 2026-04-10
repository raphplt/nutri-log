import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { userProfile } from '@/db/schema';
import { todayString } from '@/lib/date';
import { useGoals } from '@/hooks/useGoals';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useDailyMeals } from '@/hooks/useDailyMeals';
import { useRecentWeights } from '@/hooks/useRecentWeights';
import { DateNav } from '@/components/DateNav';
import { MacroRing } from '@/components/MacroRing';
import { MealTimeline } from '@/components/MealTimeline';
import { WeightSparkline } from '@/components/WeightSparkline';
import { FAB } from '@/components/FAB';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [date, setDate] = useState(todayString);

  const { data: profiles } = useLiveQuery(db.select().from(userProfile));
  const goals = useGoals();
  const totals = useDailyTotals(date);
  const meals = useDailyMeals(date);
  const weights = useRecentWeights();

  if (profiles.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  const remaining = goals.kcalTarget - totals.totalKcal;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <DateNav date={date} onDateChange={setDate} />

        {/* Remaining kcal */}
        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>RESTANT</Text>
          <Text style={[styles.remainingValue, remaining < 0 && styles.remainingOver]}>
            {remaining}
          </Text>
          <Text style={styles.remainingUnit}>kcal</Text>
          <View style={styles.remainingRow}>
            <Text style={styles.remainingDetail}>
              Objectif {goals.kcalTarget} · Consommé {totals.totalKcal}
            </Text>
          </View>
        </View>

        {/* Macro rings */}
        <View style={styles.macroRow}>
          <MacroRing
            label="Protéines"
            current={totals.totalProtein}
            target={goals.proteinTargetG}
            color={colors.primary}
          />
          <MacroRing
            label="Glucides"
            current={totals.totalCarbs}
            target={goals.carbsTargetG}
            color={colors.success}
          />
          <MacroRing
            label="Lipides"
            current={totals.totalFat}
            target={goals.fatTargetG}
            color={colors.warning}
          />
        </View>

        {/* Meal timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repas</Text>
          <MealTimeline meals={meals} />
        </View>

        {/* Weight sparkline */}
        <View style={styles.section}>
          <WeightSparkline data={weights} />
        </View>
      </ScrollView>

      <FAB onPress={() => router.push('/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 160,
  },
  remainingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  remainingLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  remainingValue: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.xs,
  },
  remainingOver: {
    color: colors.danger,
  },
  remainingUnit: {
    fontSize: fontSize.md,
    color: colors.textDim,
  },
  remainingRow: {
    marginTop: spacing.sm,
  },
  remainingDetail: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  macroRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
});
