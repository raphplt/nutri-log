import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { ProgressBar } from "@/components/ProgressBar";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";
import {
	calculateBMR,
	calculateTargetKcal,
	calculateTDEE,
	computeRecommendedMacros,
	type MacroPreset,
} from "@/lib/tdee";

const PRESET_VALUES: MacroPreset[] = ["balanced", "high_protein", "low_carb"];

export default function SummaryScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();

	const bmr = data.sex
		? calculateBMR(data.sex, data.weightKg, data.heightCm, data.age)
		: 0;
	const tdee = data.activityLevel ? calculateTDEE(bmr, data.activityLevel) : 0;
	const targetKcal =
		data.kcalOverride ?? calculateTargetKcal(tdee, data.goalRate);

	const macros =
		data.macroPreset === "custom" || !data.goal
			? { proteinG: 0, carbsG: 0, fatG: 0, proteinGPerKg: 0 }
			: computeRecommendedMacros(
					{
						kcalTarget: targetKcal,
						weightKg: data.weightKg,
						goal: data.goal,
						trainingDaysPerWeek: data.trainingDaysPerWeek,
					},
					data.macroPreset,
				);

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={5} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<Text style={styles.title}>{t("onboarding.summaryTitle")}</Text>

				<View style={styles.statsRow}>
					<StatBox
						label={t("onboarding.bmr")}
						value={`${Math.round(bmr)}`}
						unit={t("common.kcal")}
					/>
					<StatBox
						label={t("onboarding.tdee")}
						value={`${tdee}`}
						unit={t("common.kcal")}
					/>
				</View>

				<View style={styles.targetCard}>
					<Text style={styles.targetLabel}>{t("onboarding.dailyGoal")}</Text>
					<Text style={styles.targetValue}>{targetKcal}</Text>
					<Text style={styles.targetUnit}>{t("onboarding.kcalPerDay")}</Text>
				</View>

				<NumericInput
					label={t("onboarding.adjustManually")}
					value={data.kcalOverride ?? calculateTargetKcal(tdee, data.goalRate)}
					onChangeValue={(v) => update({ kcalOverride: v })}
					unit={t("common.kcal")}
					min={1000}
					max={6000}
				/>

				<Text style={styles.subtitle}>{t("macro.distribution")}</Text>
				{PRESET_VALUES.map((value) => (
					<SelectCard
						key={value}
						title={t(`macro.${value}` as const)}
						description={t(`macro.${value}Detail` as const)}
						selected={data.macroPreset === value}
						onPress={() => update({ macroPreset: value })}
					/>
				))}

				{data.macroPreset !== "custom" && (
					<>
						<View style={styles.macroRow}>
							<MacroBox
								label={t("macro.protein")}
								grams={macros.proteinG}
								color={colors.primary}
							/>
							<MacroBox
								label={t("macro.carbs")}
								grams={macros.carbsG}
								color={colors.success}
							/>
							<MacroBox
								label={t("macro.fat")}
								grams={macros.fatG}
								color={colors.warning}
							/>
						</View>
						{macros.proteinGPerKg > 0 && (
							<Text style={styles.proteinHint}>
								{t("macro.proteinPerKg", {
									value: macros.proteinGPerKg.toFixed(1),
								})}
							</Text>
						)}
					</>
				)}
			</ScrollView>
			<NextButton onPress={() => router.push("/onboarding/reminders")} />
		</SafeAreaView>
	);
}

function StatBox({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit: string;
}) {
	return (
		<View style={styles.statBox}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statUnit}>{unit}</Text>
		</View>
	);
}

function MacroBox({
	label,
	grams,
	color,
}: {
	label: string;
	grams: number;
	color: string;
}) {
	const { t } = useTranslation();
	return (
		<View style={styles.macroBox}>
			<View style={[styles.macroDot, { backgroundColor: color }]} />
			<Text style={styles.macroGrams}>
				{grams}
				{t("common.grams")}
			</Text>
			<Text style={styles.macroLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	scroll: { flex: 1 },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	title: {
		fontSize: fontSize.xxl,
		fontWeight: "700",
		color: colors.text,
		marginBottom: spacing.xl,
	},
	subtitle: {
		fontSize: fontSize.lg,
		fontWeight: "600",
		color: colors.text,
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	statsRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.lg,
	},
	statBox: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		alignItems: "center",
	},
	statLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	statValue: {
		fontSize: fontSize.xxl,
		fontWeight: "700",
		color: colors.text,
		marginTop: spacing.xs,
	},
	statUnit: {
		fontSize: fontSize.sm,
		color: colors.textDim,
	},
	targetCard: {
		backgroundColor: `${colors.primary}15`,
		borderRadius: radii.md,
		padding: spacing.xl,
		alignItems: "center",
		marginBottom: spacing.xl,
		borderWidth: 1,
		borderColor: `${colors.primary}40`,
	},
	targetLabel: {
		fontSize: fontSize.xs,
		color: colors.primaryLight,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	targetValue: {
		fontSize: fontSize.hero,
		fontWeight: "700",
		color: colors.text,
		marginTop: spacing.xs,
	},
	targetUnit: {
		fontSize: fontSize.md,
		color: colors.textMuted,
	},
	macroRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.lg,
	},
	proteinHint: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textAlign: "center",
		marginTop: spacing.md,
		fontStyle: "italic",
	},
	macroBox: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
		alignItems: "center",
	},
	macroDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginBottom: spacing.xs,
	},
	macroGrams: {
		fontSize: fontSize.xl,
		fontWeight: "700",
		color: colors.text,
	},
	macroLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		marginTop: 2,
	},
});
