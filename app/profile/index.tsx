import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { db } from '@/db/client';
import { userProfile, userGoals } from '@/db/schema';
import { updateProfileAndRecalculate } from '@/lib/profile-service';
import { SelectCard } from '@/components/SelectCard';
import { NumericInput } from '@/components/NumericInput';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing, radii } from '@/constants/theme';
import type { Sex, ActivityLevel, Goal, MacroPreset } from '@/lib/tdee';

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sédentaire' },
  { value: 'light', label: 'Légèrement actif' },
  { value: 'moderate', label: 'Modérément actif' },
  { value: 'active', label: 'Actif' },
  { value: 'very_active', label: 'Très actif' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profiles } = useLiveQuery(db.select().from(userProfile));
  const { data: goals } = useLiveQuery(db.select().from(userGoals));
  const profile = profiles[0];
  const goal = goals[0];

  const [sex, setSex] = useState<Sex>(profile?.sex as Sex ?? 'male');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ?? 170);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    (profile?.activityLevel as ActivityLevel) ?? 'moderate',
  );
  const [trainingDays, setTrainingDays] = useState(profile?.trainingDaysPerWeek ?? 3);
  const [goalType, setGoalType] = useState<Goal>((profile?.goal as Goal) ?? 'maintain');
  const [goalRate, setGoalRate] = useState(profile?.goalRate ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfileAndRecalculate(
        {
          sex,
          birthDate: profile.birthDate,
          heightCm,
          weightKg: 0, // will use latest weight from weightLog in recalculate
          activityLevel,
          trainingDaysPerWeek: trainingDays,
          goal: goalType,
          goalRate,
        },
        (goal?.macroPreset as MacroPreset) ?? 'balanced',
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>SEXE</Text>
      <View style={styles.toggleRow}>
        {(['male', 'female'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSex(s);
            }}
            style={[styles.toggle, sex === s && styles.toggleSelected]}
          >
            <Text style={[styles.toggleText, sex === s && styles.toggleTextSelected]}>
              {s === 'male' ? 'Homme' : 'Femme'}
            </Text>
          </Pressable>
        ))}
      </View>

      <NumericInput label="Taille" value={heightCm} onChangeValue={setHeightCm} unit="cm" min={100} max={250} />

      <Text style={styles.sectionLabel}>NIVEAU D'ACTIVITÉ</Text>
      {ACTIVITY_LABELS.map((a) => (
        <SelectCard
          key={a.value}
          title={a.label}
          selected={activityLevel === a.value}
          onPress={() => setActivityLevel(a.value)}
        />
      ))}

      <NumericInput
        label="Jours d'entraînement / semaine"
        value={trainingDays}
        onChangeValue={setTrainingDays}
        min={0}
        max={7}
      />

      <Text style={styles.sectionLabel}>OBJECTIF</Text>
      {(['lose', 'maintain', 'gain'] as const).map((g) => (
        <SelectCard
          key={g}
          title={g === 'lose' ? 'Perdre' : g === 'gain' ? 'Prendre' : 'Maintenir'}
          selected={goalType === g}
          onPress={() => {
            setGoalType(g);
            if (g === 'maintain') setGoalRate(0);
          }}
        />
      ))}

      {goalType !== 'maintain' && (
        <NumericInput
          label="Rythme (kg/semaine)"
          value={Math.abs(goalRate)}
          onChangeValue={(v) => setGoalRate(goalType === 'lose' ? -v : v)}
          unit="kg/sem"
          decimal
          min={0.25}
          max={1}
        />
      )}

      <NextButton
        label={saving ? 'Enregistrement...' : 'Sauvegarder'}
        onPress={handleSave}
        disabled={saving}
      />
    </ScrollView>
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
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  toggle: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  toggleText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextSelected: {
    color: colors.primaryLight,
  },
});
