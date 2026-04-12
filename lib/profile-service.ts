import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userGoals, userProfile } from "@/db/schema";
import {
	type ActivityLevel,
	calculateAge,
	calculateBMR,
	calculateTargetKcal,
	calculateTDEE,
	computeRecommendedMacros,
	type Goal,
	type MacroPreset,
	type Sex,
} from "./tdee";
import { getLatestWeightKg } from "./weight-service";

interface ProfileUpdate {
	sex: Sex;
	birthDate: string;
	heightCm: number;
	weightKg?: number;
	activityLevel: ActivityLevel;
	trainingDaysPerWeek: number;
	goal: Goal;
	goalRate: number;
}

/** Update profile and recalculate goals using the latest weight on record. */
export async function updateProfileAndRecalculate(
	update: ProfileUpdate,
	macroPreset: MacroPreset,
) {
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
		.where(eq(userProfile.id, "default"));

	const weightKg = update.weightKg ?? (await getLatestWeightKg()) ?? 70;
	await recalculateGoals({ ...update, weightKg }, macroPreset);
}

/** Recalculate goals from a complete profile snapshot. */
export async function recalculateGoals(
	profile: {
		sex: Sex;
		birthDate: string;
		heightCm: number;
		weightKg: number;
		activityLevel: ActivityLevel;
		trainingDaysPerWeek: number;
		goal: Goal;
		goalRate: number;
	},
	macroPreset: MacroPreset,
) {
	const now = new Date().toISOString();
	const age = calculateAge(profile.birthDate);
	const bmr = calculateBMR(
		profile.sex,
		profile.weightKg,
		profile.heightCm,
		age,
	);
	const tdee = calculateTDEE(bmr, profile.activityLevel);
	const kcalTarget = calculateTargetKcal(tdee, profile.goalRate);

	const macros =
		macroPreset === "custom"
			? { proteinG: 0, carbsG: 0, fatG: 0 }
			: computeRecommendedMacros(
					{
						kcalTarget,
						weightKg: profile.weightKg,
						goal: profile.goal,
						trainingDaysPerWeek: profile.trainingDaysPerWeek,
					},
					macroPreset,
				);

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
		.where(eq(userGoals.id, "default"));
}
