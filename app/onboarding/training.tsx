import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { ProgressBar } from "@/components/ProgressBar";
import { StepperInput } from "@/components/StepperInput";
import { colors, fontSize, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";

export default function TrainingScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={4} total={6} />
			<View style={styles.center}>
				<Text style={styles.title}>{t("onboarding.trainingTitle")}</Text>
				<StepperInput
					label={t("onboarding.trainingLabel")}
					value={data.trainingDaysPerWeek}
					onChangeValue={(v) => update({ trainingDaysPerWeek: v })}
					min={0}
					max={7}
					unit={t("common.daysPerWeek")}
				/>
			</View>
			<NextButton onPress={() => router.push("/onboarding/summary")} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.xl,
	},
	title: {
		fontSize: fontSize.xxl,
		fontWeight: "700",
		color: colors.text,
		marginBottom: spacing.xxl * 2,
		textAlign: "center",
	},
});
