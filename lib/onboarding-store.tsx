import { createContext, type ReactNode, useContext, useState } from "react";
import type { ActivityLevel, Goal, MacroPreset, Sex } from "./tdee";

export interface OnboardingData {
	// Screen 1: Goal
	goal: Goal | null;
	goalRate: number; // kg/week

	// Screen 2: Body
	sex: Sex | null;
	age: number;
	heightCm: number;
	weightKg: number;

	// Screen 3: Activity
	activityLevel: ActivityLevel | null;

	// Screen 4: Training
	trainingDaysPerWeek: number;

	// Screen 5: Summary
	macroPreset: MacroPreset;
	kcalOverride: number | null; // manual override

	// Screen 6: Reminders
	reminders: {
		breakfast: { enabled: boolean; hour: number; minute: number };
		lunch: { enabled: boolean; hour: number; minute: number };
		snack: { enabled: boolean; hour: number; minute: number };
		dinner: { enabled: boolean; hour: number; minute: number };
	};
}

const DEFAULT_DATA: OnboardingData = {
	goal: null,
	goalRate: 0,
	sex: null,
	age: 25,
	heightCm: 170,
	weightKg: 70,
	activityLevel: null,
	trainingDaysPerWeek: 3,
	macroPreset: "balanced",
	kcalOverride: null,
	reminders: {
		breakfast: { enabled: true, hour: 8, minute: 0 },
		lunch: { enabled: true, hour: 12, minute: 30 },
		snack: { enabled: true, hour: 16, minute: 0 },
		dinner: { enabled: true, hour: 20, minute: 0 },
	},
};

interface OnboardingContextValue {
	data: OnboardingData;
	update: (partial: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
	const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

	const update = (partial: Partial<OnboardingData>) => {
		setData((prev) => ({ ...prev, ...partial }));
	};

	return (
		<OnboardingContext.Provider value={{ data, update }}>
			{children}
		</OnboardingContext.Provider>
	);
}

export function useOnboarding() {
	const ctx = useContext(OnboardingContext);
	if (!ctx)
		throw new Error("useOnboarding must be used within OnboardingProvider");
	return ctx;
}
