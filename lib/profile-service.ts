import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { userProfile, userGoals } from '@/db/schema';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateTargetKcal,
  getMacroPreset,
  macrosFromPercentages,
  type Sex,
  type ActivityLevel,
  type Goal,
  type MacroPreset,
} from './tdee';

interface ProfileUpdate {
  sex: Sex;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  trainingDaysPerWeek: number;
  goal: Goal;
  goalRate: number;
}

/** Update profile and recalculate goals. */
export async function updateProfileAndRecalculate(update: ProfileUpdate, macroPreset: MacroPreset) {
  const now = new Date().toISOString();

  await db
    .update(userProfile)
    .set({
      sex: update.sex,
      birthDate: update.birthDate,
      heightCm: update.heightCm,
      activityLevel: update.activityLevel,
      trainingDaysPerWeek: update.trainingDaysPerWeek,
      goal: update.goal,
      goalRate: update.goalRate,
      updatedAt: now,
    })
    .where(eq(userProfile.id, 'default'));

  await recalculateGoals(update, macroPreset);
}

/** Recalculate goals from current profile data. */
export async function recalculateGoals(
  profile: { sex: Sex; birthDate: string; heightCm: number; weightKg: number; activityLevel: ActivityLevel; goalRate: number },
  macroPreset: MacroPreset,
) {
  const now = new Date().toISOString();
  const age = calculateAge(profile.birthDate);
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const kcalTarget = calculateTargetKcal(tdee, profile.goalRate);

  const preset = macroPreset !== 'custom' ? getMacroPreset(macroPreset) : null;
  const macros = preset
    ? macrosFromPercentages(kcalTarget, preset.p, preset.c, preset.f)
    : { proteinG: 0, carbsG: 0, fatG: 0 };

  await db
    .update(userGoals)
    .set({
      kcalTarget,
      proteinTargetG: macros.proteinG,
      carbsTargetG: macros.carbsG,
      fatTargetG: macros.fatG,
      macroPreset,
      updatedAt: now,
    })
    .where(eq(userGoals.id, 'default'));
}
