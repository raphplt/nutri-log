import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { fontSize, radii, spacing } from "@/constants/theme";

const NUTRI_COLORS: Record<string, string> = {
	a: "#038141",
	b: "#85BB2F",
	c: "#FECB02",
	d: "#EE8100",
	e: "#E63E11",
};

const NOVA_COLORS: Record<number, string> = {
	1: "#038141",
	2: "#85BB2F",
	3: "#EE8100",
	4: "#E63E11",
};

interface Props {
	nutriscoreGrade: string | null;
	novaGroup: number | null;
	compact?: boolean;
}

export function FoodQualityBadges({
	nutriscoreGrade,
	novaGroup,
	compact,
}: Props) {
	const { t } = useTranslation();
	const grade = nutriscoreGrade?.toLowerCase();
	const hasNutri = grade && NUTRI_COLORS[grade];
	const hasNova = novaGroup != null && NOVA_COLORS[novaGroup];

	if (!hasNutri && !hasNova) return null;

	return (
		<View style={[styles.row, compact && styles.rowCompact]}>
			{hasNutri && (
				<View
					style={[
						styles.nutri,
						{ backgroundColor: NUTRI_COLORS[grade] },
						compact && styles.badgeCompact,
					]}
				>
					<Text style={[styles.nutriLetter, compact && styles.letterCompact]}>
						{grade.toUpperCase()}
					</Text>
				</View>
			)}
			{hasNova && (
				<View
					style={[
						styles.nova,
						{ backgroundColor: NOVA_COLORS[novaGroup] },
						compact && styles.badgeCompact,
					]}
				>
					<Text style={[styles.novaLabel, compact && styles.letterCompact]}>
						{t("badges.novaShort", { n: novaGroup })}
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
	rowCompact: { gap: 4 },
	nutri: {
		width: 28,
		height: 28,
		borderRadius: radii.full,
		alignItems: "center",
		justifyContent: "center",
	},
	nutriLetter: { color: "#fff", fontSize: fontSize.md, fontWeight: "700" },
	nova: {
		paddingHorizontal: spacing.sm,
		height: 28,
		borderRadius: radii.full,
		alignItems: "center",
		justifyContent: "center",
	},
	novaLabel: { color: "#fff", fontSize: fontSize.xs, fontWeight: "700" },
	badgeCompact: { width: 20, height: 20, paddingHorizontal: spacing.xs },
	letterCompact: { fontSize: fontSize.xs },
});
