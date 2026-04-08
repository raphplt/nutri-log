export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type MacroPreset = 'balanced' | 'high_protein' | 'low_carb' | 'custom';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const MACRO_PRESETS: Record<Exclude<MacroPreset, 'custom'>, { p: number; c: number; f: number }> = {
  balanced: { p: 30, c: 40, f: 30 },
  high_protein: { p: 40, c: 35, f: 25 },
  low_carb: { p: 35, c: 25, f: 40 },
};

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateTargetKcal(tdee: number, goalRateKgPerWeek: number): number {
  // 1 kg fat ~ 7700 kcal -> 7700/7 ~ 1100 kcal/day
  const dailyDelta = Math.round(goalRateKgPerWeek * 1100);
  return tdee + dailyDelta;
}

export function getMacroPreset(preset: Exclude<MacroPreset, 'custom'>) {
  return MACRO_PRESETS[preset];
}

export function macrosFromPercentages(kcalTarget: number, pPct: number, cPct: number, fPct: number) {
  return {
    proteinG: Math.round((kcalTarget * pPct) / 400), // 1g protein = 4 kcal
    carbsG: Math.round((kcalTarget * cPct) / 400),   // 1g carb = 4 kcal
    fatG: Math.round((kcalTarget * fPct) / 900),      // 1g fat = 9 kcal
  };
}
