import { db } from "@/db/client";
import { userGoals, userProfile } from "@/db/schema";
import { getMeta, setMeta } from "./app-meta";
import { recalculateGoals } from "./profile-service";
import type { ActivityLevel, Goal, MacroPreset, Sex } from "./tdee";
import { getLatestWeightKg } from "./weight-service";

const FLAG = "macro_engine_v2";

/**
 * One-shot: recompute user goals using the science-based macro engine.
 * Runs once after upgrade. Custom macros are left untouched.
 */
export async function migrateMacrosIfNeeded(): Promise<void> {
	if (await getMeta(FLAG)) return;

	const [profile] = await db.select().from(userProfile).limit(1);
	const [goals] = await db.select().from(userGoals).limit(1);

	if (profile && goals && goals.macroPreset !== "custom") {
		const weightKg = (await getLatestWeightKg()) ?? 70;
		await recalculateGoals(
			{
				sex: profile.sex as Sex,
				birthDate: profile.birthDate,
				heightCm: profile.heightCm,
				weightKg,
				activityLevel: profile.activityLevel as ActivityLevel,
				trainingDaysPerWeek: profile.trainingDaysPerWeek,
				goal: profile.goal as Goal,
				goalRate: profile.goalRate ?? 0,
			},
			goals.macroPreset as MacroPreset,
		);
	}

	await setMeta(FLAG, String(Date.now()));
}
