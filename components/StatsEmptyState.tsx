import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";

export function StatsEmptyState() {
	const { t } = useTranslation();
	return (
		<View style={styles.container}>
			<View style={styles.icon}>
				<FontAwesome name="bar-chart" size={32} color={colors.textDim} />
			</View>
			<Text style={styles.title}>{t("stats.empty.title")}</Text>
			<Text style={styles.hint}>{t("stats.empty.hint")}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.xl,
		alignItems: "center",
		gap: spacing.sm,
	},
	icon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: colors.surfaceLight,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: fontSize.md,
		fontFamily: fonts.semibold,
		color: colors.text,
	},
	hint: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		textAlign: "center",
	},
});
