/**
 * TDEE + macro computation, calibrated from the current sports-nutrition
 * literature:
 *
 * - Mifflin-St Jeor (1990, Roza & Shizgal rev.): most accurate predictive
 *   RMR equation for non-athletic adults.
 * - Harris-Benedict activity multipliers 1.2 → 1.9: clinical standard when
 *   paired with Mifflin-St Jeor RMR.
 * - Wishnofsky (1958): 1 kg body mass ≈ 7700 kcal — still the working
 *   approximation for daily calorie deltas.
 * - Helms et al. 2014 (protein in deficit, resistance-trained, systematic
 *   review), Morton et al. 2018 (hypertrophy protein meta-analysis, plateau
 *   ~1.6 g/kg), ISSN 2017 position stand (Jäger et al.), Phillips & Van Loon
 *   2011: protein g/kg by goal and training volume.
 * - IOM 2005 AMDR / DRI: fat 20-35 % kcal, carbs ≥ 130 g/day (brain glucose).
 * - Mumford et al. 2016 / ISSN: ~0.5-0.6 g/kg fat floor for hormonal health.
 */

export type Sex = "male" | "female";
export type ActivityLevel =
	| "sedentary"
	| "light"
	| "moderate"
	| "active"
	| "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type MacroPreset = "balanced" | "high_protein" | "low_carb" | "custom";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
	sedentary: 1.2,
	light: 1.375,
	moderate: 1.55,
	active: 1.725,
	very_active: 1.9,
};

/**
 * Protein g/kg recommendation keyed by goal and weekly training volume.
 *
 * Key references:
 * - Helms 2014: 2.3-3.1 g/kg lean mass ≈ 1.8-2.7 g/kg total for cutting
 *   resistance-trained athletes.
 * - Morton 2018: 1.6 g/kg is the diminishing-returns plateau for hypertrophy.
 * - ISSN 2017: 1.4-2.0 g/kg for generally active individuals.
 * - Sedentary non-training: RDA of 0.8 g/kg is a floor, not an optimum —
 *   0.9-1.2 is healthier for older adults (Deutz 2014).
 */
const PROTEIN_G_PER_KG: Record<Goal, (trainDays: number) => number> = {
	lose: (d) => {
		if (d === 0) return 1.5;
		if (d <= 3) return 1.8;
		if (d <= 5) return 2.2;
		return 2.4;
	},
	maintain: (d) => {
		if (d === 0) return 1.0;
		if (d <= 3) return 1.4;
		if (d <= 5) return 1.6;
		return 1.8;
	},
	gain: (d) => {
		if (d === 0) return 1.2;
		if (d <= 3) return 1.6;
		if (d <= 5) return 1.8;
		return 2.0;
	},
};

const MIN_FAT_G_PER_KG = 0.6; // hormonal-health floor
const MIN_CARBS_G = 130; // IOM brain-glucose minimum
const KCAL_PER_KG_BODYMASS = 7700;

export function calculateAge(birthDate: string): number {
	const birth = new Date(birthDate);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
	return age;
}

export function calculateBMR(
	sex: Sex,
	weightKg: number,
	heightCm: number,
	age: number,
): number {
	const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
	return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(
	bmr: number,
	activityLevel: ActivityLevel,
): number {
	return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateTargetKcal(
	tdee: number,
	goalRateKgPerWeek: number,
): number {
	const dailyDelta = Math.round((goalRateKgPerWeek * KCAL_PER_KG_BODYMASS) / 7);
	return tdee + dailyDelta;
}

export interface MacroInputs {
	kcalTarget: number;
	weightKg: number;
	goal: Goal;
	trainingDaysPerWeek: number;
}

export interface MacroResult {
	proteinG: number;
	carbsG: number;
	fatG: number;
	proteinGPerKg: number;
}

/** Reference protein target in g/kg for the given goal × training volume. */
export function proteinTargetPerKg(
	goal: Goal,
	trainingDaysPerWeek: number,
): number {
	return PROTEIN_G_PER_KG[goal](trainingDaysPerWeek);
}

/**
 * Compute macros for a non-custom preset.
 *
 * Strategy (scientific):
 * 1. Protein = weight-based (g/kg), not %-based. Scales correctly whatever the
 *    kcal target — the classic mistake of "30 % protein" on a 3000 kcal diet
 *    gives absurd 225 g P regardless of body weight.
 * 2. Fat = % of kcal with a hormonal floor (min 0.6 g/kg).
 * 3. Carbs = remainder, clamped to ≥ 130 g/day (brain glucose requirement).
 *    If clamped, fat is reduced proportionally (but kept above its floor).
 */
export function computeRecommendedMacros(
	inp: MacroInputs,
	preset: Exclude<MacroPreset, "custom">,
): MacroResult {
	const baseGPerKg = PROTEIN_G_PER_KG[inp.goal](inp.trainingDaysPerWeek);
	let proteinGPerKg = baseGPerKg;
	let fatPct = 0.25;
	if (preset === "high_protein") {
		proteinGPerKg = baseGPerKg + 0.4;
		fatPct = 0.25;
	} else if (preset === "low_carb") {
		proteinGPerKg = baseGPerKg;
		fatPct = 0.4;
	}

	const proteinG = proteinGPerKg * inp.weightKg;
	const fatFloorG = MIN_FAT_G_PER_KG * inp.weightKg;
	let fatG = Math.max((inp.kcalTarget * fatPct) / 9, fatFloorG);
	let carbsG = (inp.kcalTarget - proteinG * 4 - fatG * 9) / 4;

	if (carbsG < MIN_CARBS_G) {
		carbsG = MIN_CARBS_G;
		fatG = Math.max(
			fatFloorG,
			(inp.kcalTarget - proteinG * 4 - carbsG * 4) / 9,
		);
	}

	return {
		proteinG: Math.round(proteinG),
		carbsG: Math.round(Math.max(0, carbsG)),
		fatG: Math.round(fatG),
		proteinGPerKg: Number(proteinGPerKg.toFixed(2)),
	};
}

/** Compute macros from user-chosen %. Used only by the "custom" preset. */
export function computeCustomMacros(
	kcalTarget: number,
	weightKg: number,
	pPct: number,
	cPct: number,
	fPct: number,
): MacroResult {
	const proteinG = Math.round((kcalTarget * pPct) / 400);
	return {
		proteinG,
		carbsG: Math.round((kcalTarget * cPct) / 400),
		fatG: Math.round((kcalTarget * fPct) / 900),
		proteinGPerKg: Number((proteinG / Math.max(weightKg, 1)).toFixed(2)),
	};
}
