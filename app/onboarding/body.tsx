import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImportDataModal } from "@/components/ImportDataModal";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { ProgressBar } from "@/components/ProgressBar";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-store";
import type { Sex } from "@/lib/tdee";

export default function BodyScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();
	const [importOpen, setImportOpen] = useState(false);

	const canContinue =
		data.sex !== null && data.age > 0 && data.heightCm > 0 && data.weightKg > 0;

	const selectSex = (sex: Sex) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		update({ sex });
	};

	const handleImported = () => {
		setImportOpen(false);
		router.replace("/");
	};

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={1} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<View style={styles.titleRow}>
					<Text style={styles.title}>{t("onboarding.bodyTitle")}</Text>
					<Pressable
						onPress={() => setImportOpen(true)}
						hitSlop={8}
						style={styles.importLink}
					>
						<Text style={styles.importLinkText}>
							{t("importData.welcomeLink")}
						</Text>
					</Pressable>
				</View>

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
			<ImportDataModal
				visible={importOpen}
				onClose={() => setImportOpen(false)}
				onImported={handleImported}
				showWarning={false}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	scroll: { flex: 1 },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	titleRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.xl,
		gap: spacing.md,
	},
	title: {
		flex: 1,
		fontSize: fontSize.xxl,
		fontWeight: "700",
		color: colors.text,
	},
	importLink: {
		paddingVertical: spacing.xs,
		marginTop: spacing.sm,
	},
	importLinkText: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		fontFamily: fonts.medium,
		textDecorationLine: "underline",
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
