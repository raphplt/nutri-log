import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { ProgressBar } from "@/components/ProgressBar";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";
import type { Goal } from "@/lib/tdee";

export default function GoalScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();

	const goals: { value: Goal; title: string; description: string }[] = [
		{ value: "lose", title: t("goal.lose"), description: t("goal.loseDesc") },
		{
			value: "maintain",
			title: t("goal.maintain"),
			description: t("goal.maintainDesc"),
		},
		{ value: "gain", title: t("goal.gain"), description: t("goal.gainDesc") },
	];

	const loseRates = [
		{
			value: -0.1,
			label: `-0.1 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.loseRates.veryslow"),
		},
		{
			value: -0.25,
			label: `-0.25 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.loseRates.slow"),
		},
		{
			value: -0.5,
			label: `-0.5 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.loseRates.moderate"),
		},
		{
			value: -0.75,
			label: `-0.75 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.loseRates.fast"),
		},
		{
			value: -1,
			label: `-1 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.loseRates.aggressive"),
		},
		{
			value: -1.25,
			label: `-1.25 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.loseRates.veryaggressive"),
		},
	];

	const gainRates = [
		{
			value: 0.1,
			label: `+0.1 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.gainRates.verylean"),
		},
		{
			value: 0.25,
			label: `+0.25 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.gainRates.leanbulk"),
		},
		{
			value: 0.5,
			label: `+0.5 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.gainRates.bulk"),
		},
		{
			value: 0.75,
			label: `+0.75 ${t("common.kg")}${t("common.perWeek")}`,
			description: t("onboarding.gainRates.aggressivebulk"),
		},
	];

	const rates =
		data.goal === "lose" ? loseRates : data.goal === "gain" ? gainRates : null;
	const canContinue =
		data.goal !== null && (data.goal === "maintain" || data.goalRate !== 0);

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={2} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<Text style={styles.title}>{t("onboarding.goalTitle")}</Text>

				{goals.map((g) => (
					<SelectCard
						key={g.value}
						title={g.title}
						description={g.description}
						selected={data.goal === g.value}
						onPress={() =>
							update({
								goal: g.value,
								goalRate: g.value === "maintain" ? 0 : data.goalRate,
							})
						}
					/>
				))}

				{rates && (
					<View style={styles.rateSection}>
						<Text style={styles.subtitle}>{t("onboarding.paceTitle")}</Text>
						{rates.map((r) => (
							<SelectCard
								key={r.value}
								title={r.label}
								description={r.description}
								selected={data.goalRate === r.value}
								onPress={() => update({ goalRate: r.value })}
							/>
						))}
					</View>
				)}
			</ScrollView>
			<NextButton
				onPress={() => router.push("/onboarding/activity")}
				disabled={!canContinue}
			/>
		</SafeAreaView>
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
		marginBottom: spacing.md,
	},
	rateSection: {
		marginTop: spacing.xl,
	},
});
