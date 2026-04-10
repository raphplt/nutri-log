import { db } from '@/db/client';
import { userProfile, weightLog, userGoals, reminderSettings } from '@/db/schema';
import { createId } from './nanoid';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateTargetKcal,
  getMacroPreset,
  macrosFromPercentages,
} from './tdee';
import { scheduleAllReminders } from './reminders';
import type { OnboardingData } from './onboarding-store';

export async function finishOnboarding(data: OnboardingData) {
  const now = new Date().toISOString();
  const today = now.slice(0, 10); // YYYY-MM-DD

  // Compute targets
  const age = calculateAge(data.birthDate);
  const bmr = calculateBMR(data.sex!, data.weightKg, data.heightCm, age);
  const tdee = calculateTDEE(bmr, data.activityLevel!);
  const kcalTarget = data.kcalOverride ?? calculateTargetKcal(tdee, data.goalRate);

  const preset = data.macroPreset !== 'custom' ? getMacroPreset(data.macroPreset) : null;
  const macros = preset
    ? macrosFromPercentages(kcalTarget, preset.p, preset.c, preset.f)
    : { proteinG: 0, carbsG: 0, fatG: 0 };

  // Insert profile
  await db.insert(userProfile).values({
    id: 'default',
    sex: data.sex!,
    birthDate: data.birthDate,
    heightCm: data.heightCm,
    activityLevel: data.activityLevel!,
    trainingDaysPerWeek: data.trainingDaysPerWeek,
    goal: data.goal!,
    goalRate: data.goalRate,
    updatedAt: now,
  });

  // Insert first weight log
  await db.insert(weightLog).values({
    id: createId(),
    date: today,
    weightKg: data.weightKg,
    createdAt: now,
  });

  // Insert goals
  await db.insert(userGoals).values({
    id: 'default',
    kcalTarget,
    proteinTargetG: macros.proteinG,
    carbsTargetG: macros.carbsG,
    fatTargetG: macros.fatG,
    macroPreset: data.macroPreset,
    updatedAt: now,
  });

  // Insert reminder settings
  const reminderEntries = Object.entries(data.reminders) as [string, { enabled: boolean; hour: number; minute: number }][];
  for (const [mealType, r] of reminderEntries) {
    await db.insert(reminderSettings).values({
      id: createId(),
      mealType,
      enabled: r.enabled,
      hour: r.hour,
      minute: r.minute,
    });
  }

  // Schedule notifications
  await scheduleAllReminders(
    reminderEntries.map(([mealType, r]) => ({
      mealType,
      enabled: r.enabled,
      hour: r.hour,
      minute: r.minute,
    })),
  );
}
