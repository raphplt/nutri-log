import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DateNav } from "@/components/DateNav";
import { FAB } from "@/components/FAB";
import { MacroRing } from "@/components/MacroRing";
import { MealTimeline } from "@/components/MealTimeline";
import { RecalculBanner } from "@/components/RecalculBanner";
import { WeightSparkline } from "@/components/WeightSparkline";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { userGoals as userGoalsTable, userProfile } from "@/db/schema";
import { useDailyMeals } from "@/hooks/useDailyMeals";
import { useDailyTotals } from "@/hooks/useDailyTotals";
import { useGoals } from "@/hooks/useGoals";
import { useRecentWeights } from "@/hooks/useRecentWeights";
import { todayString } from "@/lib/date";
import { recalculateGoals } from "@/lib/profile-service";
import type { ActivityLevel, MacroPreset, Sex } from "@/lib/tdee";

export default function DashboardScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [date, setDate] = useState(todayString);
	const [bannerDismissed, setBannerDismissed] = useState(false);

	const { data: profiles, updatedAt: profilesUpdatedAt } = useLiveQuery(
		db.select().from(userProfile),
	);
	const { data: goalsData } = useLiveQuery(db.select().from(userGoalsTable));
	const goals = useGoals();
	const totals = useDailyTotals(date);
	const meals = useDailyMeals(date);
	const weights = useRecentWeights();

	const profile = profiles[0];
	const latestWeight =
		weights.length > 0 ? weights[weights.length - 1].weightKg : null;
	const onboardingWeight = weights.length > 0 ? weights[0].weightKg : null;
	const weightDelta =
		latestWeight && onboardingWeight ? latestWeight - onboardingWeight : 0;
	const showRecalcBanner = !bannerDismissed && Math.abs(weightDelta) >= 2;

	const handleRecalculate = useCallback(async () => {
		if (!profile || !latestWeight) return;
		const macroPreset =
			(goalsData[0]?.macroPreset as MacroPreset) ?? "balanced";
		await recalculateGoals(
			{
				sex: profile.sex as Sex,
				birthDate: profile.birthDate,
				heightCm: profile.heightCm,
				weightKg: latestWeight,
				activityLevel: profile.activityLevel as ActivityLevel,
				goalRate: profile.goalRate ?? 0,
			},
			macroPreset,
		);
		setBannerDismissed(true);
	}, [profile, latestWeight, goalsData]);

	if (profilesUpdatedAt === undefined) {
		return null;
	}

	if (profiles.length === 0) {
		return <Redirect href="/onboarding" />;
	}

	const remaining = goals.kcalTarget - totals.totalKcal;

	return (
		<View style={styles.screen}>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<DateNav date={date} onDateChange={setDate} />

				{showRecalcBanner && (
					<RecalculBanner
						deltaKg={weightDelta}
						onRecalculate={handleRecalculate}
						onDismiss={() => setBannerDismissed(true)}
					/>
				)}

				{/* Remaining kcal */}
				<View style={styles.remainingCard}>
					<Text style={styles.remainingLabel}>{t("dashboard.remaining")}</Text>
					<Text
						style={[
							styles.remainingValue,
							remaining < 0 && styles.remainingOver,
						]}
					>
						{remaining}
					</Text>
					<Text style={styles.remainingUnit}>{t("common.kcal")}</Text>
					<View style={styles.remainingRow}>
						<Text style={styles.remainingDetail}>
							{t("dashboard.goalLine", {
								target: goals.kcalTarget,
								consumed: totals.totalKcal,
							})}
						</Text>
					</View>
				</View>

				{/* Macro rings */}
				<View style={styles.macroRow}>
					<MacroRing
						label={t("macro.protein")}
						current={totals.totalProtein}
						target={goals.proteinTargetG}
						color={colors.primary}
					/>
					<MacroRing
						label={t("macro.carbs")}
						current={totals.totalCarbs}
						target={goals.carbsTargetG}
						color={colors.success}
					/>
					<MacroRing
						label={t("macro.fat")}
						current={totals.totalFat}
						target={goals.fatTargetG}
						color={colors.warning}
					/>
				</View>

				{/* Meal timeline */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("dashboard.mealsTitle")}</Text>
					<MealTimeline meals={meals} />
				</View>

				{/* Weight sparkline */}
				<View style={styles.section}>
					<WeightSparkline data={weights} />
				</View>
			</ScrollView>

			<FAB onPress={() => router.push("/add")} />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingBottom: 160,
	},
	remainingCard: {
		alignItems: "center",
		paddingVertical: spacing.xl,
		marginHorizontal: spacing.xl,
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		marginBottom: spacing.lg,
	},
	remainingLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1.5,
	},
	remainingValue: {
		fontSize: fontSize.hero,
		fontWeight: "700",
		color: colors.success,
		marginTop: spacing.xs,
	},
	remainingOver: {
		color: colors.danger,
	},
	remainingUnit: {
		fontSize: fontSize.md,
		color: colors.textDim,
	},
	remainingRow: {
		marginTop: spacing.sm,
	},
	remainingDetail: {
		fontSize: fontSize.sm,
		color: colors.textDim,
	},
	macroRow: {
		flexDirection: "row",
		paddingHorizontal: spacing.xl,
		marginBottom: spacing.xl,
		gap: spacing.sm,
	},
	section: {
		paddingHorizontal: spacing.xl,
		marginBottom: spacing.lg,
	},
	sectionTitle: {
		fontSize: fontSize.lg,
		fontWeight: "600",
		color: colors.text,
		marginBottom: spacing.md,
	},
});
