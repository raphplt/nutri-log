import { db } from "@/db/client";
import {
	reminderSettings,
	userGoals,
	userProfile,
	weightLog,
} from "@/db/schema";
import { createId } from "./nanoid";
import type { OnboardingData } from "./onboarding-store";
import { scheduleAllReminders } from "./reminders";
import {
	calculateBMR,
	calculateTargetKcal,
	calculateTDEE,
	getMacroPreset,
	macrosFromPercentages,
} from "./tdee";

export async function finishOnboarding(data: OnboardingData) {
	const now = new Date().toISOString();
	const today = now.slice(0, 10); // YYYY-MM-DD
	const birthDate = `${new Date().getFullYear() - data.age}-01-01`;

	// Compute targets
	const bmr = calculateBMR(data.sex!, data.weightKg, data.heightCm, data.age);
	const tdee = calculateTDEE(bmr, data.activityLevel!);
	const kcalTarget =
		data.kcalOverride ?? calculateTargetKcal(tdee, data.goalRate);

	const preset =
		data.macroPreset !== "custom" ? getMacroPreset(data.macroPreset) : null;
	const macros = preset
		? macrosFromPercentages(kcalTarget, preset.p, preset.c, preset.f)
		: { proteinG: 0, carbsG: 0, fatG: 0 };

	// Upsert profile (id is fixed to 'default')
	await db
		.insert(userProfile)
		.values({
			id: "default",
			sex: data.sex!,
			birthDate,
			heightCm: data.heightCm,
			activityLevel: data.activityLevel!,
			trainingDaysPerWeek: data.trainingDaysPerWeek,
			goal: data.goal!,
			goalRate: data.goalRate,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: userProfile.id,
			set: {
				sex: data.sex!,
				birthDate,
				heightCm: data.heightCm,
				activityLevel: data.activityLevel!,
				trainingDaysPerWeek: data.trainingDaysPerWeek,
				goal: data.goal!,
				goalRate: data.goalRate,
				updatedAt: now,
			},
		});

	// Upsert first weight log for today
	await db
		.insert(weightLog)
		.values({
			id: createId(),
			date: today,
			weightKg: data.weightKg,
			createdAt: now,
		})
		.onConflictDoUpdate({
			target: weightLog.date,
			set: { weightKg: data.weightKg },
		});

	// Upsert goals
	await db
		.insert(userGoals)
		.values({
			id: "default",
			kcalTarget,
			proteinTargetG: macros.proteinG,
			carbsTargetG: macros.carbsG,
			fatTargetG: macros.fatG,
			macroPreset: data.macroPreset,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: userGoals.id,
			set: {
				kcalTarget,
				proteinTargetG: macros.proteinG,
				carbsTargetG: macros.carbsG,
				fatTargetG: macros.fatG,
				macroPreset: data.macroPreset,
				updatedAt: now,
			},
		});

	// Reset reminder settings
	await db.delete(reminderSettings);
	const reminderEntries = Object.entries(data.reminders) as [
		string,
		{ enabled: boolean; hour: number; minute: number },
	][];
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
