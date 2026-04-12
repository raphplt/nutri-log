import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { ProgressBar } from "@/components/ProgressBar";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";
import type { Sex } from "@/lib/tdee";

export default function BodyScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();

	const canContinue =
		data.sex !== null && data.age > 0 && data.heightCm > 0 && data.weightKg > 0;

	const selectSex = (sex: Sex) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		update({ sex });
	};

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={1} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<Text style={styles.title}>{t("onboarding.bodyTitle")}</Text>

				<Text style={styles.label}>{t("onboarding.sexLabel")}</Text>
				<View style={styles.toggleRow}>
					{(["male", "female"] as const).map((sex) => (
						<Pressable
							key={sex}
							onPress={() => selectSex(sex)}
							style={[styles.toggle, data.sex === sex && styles.toggleSelected]}
						>
							<Text
								style={[
									styles.toggleText,
									data.sex === sex && styles.toggleTextSelected,
								]}
							>
								{sex === "male" ? t("sex.male") : t("sex.female")}
							</Text>
						</Pressable>
					))}
				</View>

				<NumericInput
					label={t("onboarding.ageLabel")}
					value={data.age}
					onChangeValue={(v) => update({ age: v })}
					unit={t("common.years")}
					min={10}
					max={100}
				/>

				<NumericInput
					label={t("onboarding.heightLabel")}
					value={data.heightCm}
					onChangeValue={(v) => update({ heightCm: v })}
					unit={t("common.cm")}
					min={100}
					max={250}
				/>

				<NumericInput
					label={t("onboarding.weightLabel")}
					value={data.weightKg}
					onChangeValue={(v) => update({ weightKg: v })}
					unit={t("common.kg")}
					decimal
					min={30}
					max={300}
				/>
			</ScrollView>
			<NextButton
				onPress={() => router.push("/onboarding/goal")}
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
	label: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginBottom: spacing.xs,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	toggleRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.xl,
	},
	toggle: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: radii.sm,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: "center",
	},
	toggleSelected: {
		borderColor: colors.primary,
		backgroundColor: `${colors.primary}15`,
	},
	toggleText: {
		fontSize: fontSize.lg,
		fontWeight: "600",
		color: colors.textMuted,
	},
	toggleTextSelected: {
		color: colors.primaryLight,
	},
});
