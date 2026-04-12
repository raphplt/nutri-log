import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { ProgressBar } from "@/components/ProgressBar";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";
import type { Goal } from "@/lib/tdee";

const GOALS: { value: Goal; title: string; description: string }[] = [
	{
		value: "lose",
		title: "Perdre du poids",
		description: "Déficit calorique pour brûler du gras",
	},
	{
		value: "maintain",
		title: "Maintenir",
		description: "Garder ton poids actuel",
	},
	{
		value: "gain",
		title: "Prendre du poids",
		description: "Surplus calorique pour construire du muscle",
	},
];

const LOSE_RATES = [
	{ value: -0.1, label: "-0.1 kg/sem", description: "Très lent" },
	{ value: -0.25, label: "-0.25 kg/sem", description: "Lent" },
	{ value: -0.5, label: "-0.5 kg/sem", description: "Modéré" },
	{ value: -0.75, label: "-0.75 kg/sem", description: "Rapide" },
	{ value: -1, label: "-1 kg/sem", description: "Agressif" },
	{ value: -1.25, label: "-1.25 kg/sem", description: "Très agressif" },
];

const GAIN_RATES = [
	{ value: 0.1, label: "+0.1 kg/sem", description: "Très lean" },
	{ value: 0.25, label: "+0.25 kg/sem", description: "Lean bulk" },
	{ value: 0.5, label: "+0.5 kg/sem", description: "Bulk" },
	{ value: 0.75, label: "+0.75 kg/sem", description: "Bulk agressif" },
];

export default function GoalScreen() {
	const router = useRouter();
	const { data, update } = useOnboarding();

	const rates =
		data.goal === "lose"
			? LOSE_RATES
			: data.goal === "gain"
				? GAIN_RATES
				: null;
	const canContinue =
		data.goal !== null && (data.goal === "maintain" || data.goalRate !== 0);

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={2} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<Text style={styles.title}>Quel est ton objectif ?</Text>

				{GOALS.map((g) => (
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
						<Text style={styles.subtitle}>Rythme par semaine</Text>
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
