import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";

interface Props {
	deltaKg: number;
	onRecalculate: () => void;
	onDismiss: () => void;
}

export function RecalculBanner({ deltaKg, onRecalculate, onDismiss }: Props) {
	const { t } = useTranslation();
	const msg =
		deltaKg > 0
			? t("recalcul.deltaPositive", { delta: deltaKg.toFixed(1) })
			: t("recalcul.deltaNegative", { delta: deltaKg.toFixed(1) });

	return (
		<View style={styles.banner}>
			<Text style={styles.text}>
				{msg}
				{"\n"}
				{t("recalcul.question")}
			</Text>
			<View style={styles.actions}>
				<Pressable
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onRecalculate();
					}}
					style={({ pressed }) => [
						styles.primaryBtn,
						pressed && styles.primaryBtnPressed,
					]}
				>
					<Text style={styles.primaryBtnText}>{t("recalcul.recalculate")}</Text>
				</Pressable>
				<Pressable onPress={onDismiss} style={styles.secondaryBtn}>
					<Text style={styles.secondaryBtnText}>{t("common.later")}</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	banner: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radii.lg,
		padding: spacing.lg,
		marginHorizontal: spacing.xl,
		marginBottom: spacing.lg,
		borderLeftWidth: 3,
		borderLeftColor: colors.warning,
	},
	text: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.text,
		lineHeight: 20,
	},
	actions: {
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	primaryBtn: {
		backgroundColor: colors.primary,
		borderRadius: radii.pill,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		minHeight: 40,
		justifyContent: "center",
	},
	primaryBtnPressed: {
		backgroundColor: colors.primaryDeep,
	},
	primaryBtnText: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
		color: colors.textInverse,
	},
	secondaryBtn: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		minHeight: 40,
		justifyContent: "center",
	},
	secondaryBtnText: {
		fontFamily: fonts.medium,
		fontSize: fontSize.sm,
		color: colors.textMuted,
	},
});
