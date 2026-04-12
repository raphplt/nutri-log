import { StyleSheet, Text, View } from "react-native";
import { fontSize, radii } from "@/constants/theme";

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
	const grade = nutriscoreGrade?.toLowerCase();
	const hasNutri = grade && NUTRI_COLORS[grade];
	const hasNova = novaGroup != null && NOVA_COLORS[novaGroup];

	if (!hasNutri && !hasNova) return null;

	const size = compact ? 20 : 26;

	return (
		<View style={styles.row}>
			{hasNutri && (
				<View
					style={[
						styles.badge,
						{
							width: size,
							height: size,
							backgroundColor: NUTRI_COLORS[grade],
						},
					]}
				>
					<Text style={[styles.letter, compact && styles.letterCompact]}>
						{grade.toUpperCase()}
					</Text>
				</View>
			)}
			{hasNova && (
				<View
					style={[
						styles.badge,
						{
							width: size,
							height: size,
							backgroundColor: NOVA_COLORS[novaGroup],
						},
					]}
				>
					<Text style={[styles.letter, compact && styles.letterCompact]}>
						{novaGroup}
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: 4, alignItems: "center" },
	badge: {
		borderRadius: radii.full,
		alignItems: "center",
		justifyContent: "center",
	},
	letter: { color: "#fff", fontSize: fontSize.sm, fontWeight: "700" },
	letterCompact: { fontSize: fontSize.xs },
});
