import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { db } from '@/db/client';
import { reminderSettings, userProfile, userGoals } from '@/db/schema';
import { scheduleAllReminders } from '@/lib/reminders';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Goûter',
  dinner: 'Dîner',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { data: reminders } = useLiveQuery(db.select().from(reminderSettings));
  const { data: profiles } = useLiveQuery(db.select().from(userProfile));
  const { data: goals } = useLiveQuery(db.select().from(userGoals));

  const profile = profiles[0];
  const goal = goals[0];

  const toggleReminder = async (id: string, current: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await db
      .update(reminderSettings)
      .set({ enabled: !current })
      .where(eq(reminderSettings.id, id));

    // Re-schedule all
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !current } : r,
    );
    await scheduleAllReminders(
      updated.map((r) => ({
        mealType: r.mealType,
        enabled: r.enabled ?? true,
        hour: r.hour,
        minute: r.minute,
      })),
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Profile section */}
      <Text style={styles.sectionLabel}>PROFIL</Text>
      {profile && (
        <Pressable onPress={() => router.push('/profile')} style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>
              {profile.sex === 'male' ? 'Homme' : 'Femme'} · {profile.heightCm}cm
            </Text>
            <Text style={styles.rowSub}>
              {profile.goal === 'lose' ? 'Perte' : profile.goal === 'gain' ? 'Prise' : 'Maintien'}
              {' · '}{profile.activityLevel}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textDim} />
        </Pressable>
      )}

      {/* Goals section */}
      <Text style={styles.sectionLabel}>OBJECTIFS</Text>
      {goal && (
        <View style={styles.goalsCard}>
          <GoalRow label="Calories" value={`${goal.kcalTarget} kcal`} />
          <GoalRow label="Protéines" value={`${goal.proteinTargetG}g`} />
          <GoalRow label="Glucides" value={`${goal.carbsTargetG}g`} />
          <GoalRow label="Lipides" value={`${goal.fatTargetG}g`} />
        </View>
      )}

      {/* Weight */}
      <Text style={styles.sectionLabel}>POIDS</Text>
      <Pressable onPress={() => router.push('/weight')} style={styles.row}>
        <Text style={styles.rowTitle}>Suivi du poids</Text>
        <FontAwesome name="chevron-right" size={14} color={colors.textDim} />
      </Pressable>

      {/* Reminders section */}
      <Text style={styles.sectionLabel}>RAPPELS</Text>
      {reminders.map((r) => (
        <View key={r.id} style={styles.reminderRow}>
          <View>
            <Text style={styles.rowTitle}>{MEAL_LABELS[r.mealType] ?? r.mealType}</Text>
            <Text style={styles.rowSub}>
              {String(r.hour).padStart(2, '0')}:{String(r.minute).padStart(2, '0')}
            </Text>
          </View>
          <Switch
            value={r.enabled ?? true}
            onValueChange={() => toggleReminder(r.id, r.enabled ?? true)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function GoalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalLabel}>{label}</Text>
      <Text style={styles.goalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  goalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  goalLabel: { fontSize: fontSize.md, color: colors.textMuted },
  goalValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
});
