import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { ProgressBar } from "@/components/ProgressBar";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";
import type { ActivityLevel } from "@/lib/tdee";

const LEVELS: ActivityLevel[] = [
	"sedentary",
	"light",
	"moderate",
	"active",
	"very_active",
];

export default function ActivityScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={3} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<Text style={styles.title}>{t("onboarding.activityTitle")}</Text>

				{LEVELS.map((level) => (
					<SelectCard
						key={level}
						title={t(`activity.${level}` as const)}
						description={t(`activity.${level}Desc` as const)}
						selected={data.activityLevel === level}
						onPress={() => update({ activityLevel: level })}
					/>
				))}
			</ScrollView>
			<NextButton
				onPress={() => router.push("/onboarding/training")}
				disabled={data.activityLevel === null}
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
});
