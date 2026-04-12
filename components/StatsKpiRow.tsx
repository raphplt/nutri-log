import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";

export interface KpiItem {
	label: string;
	value: string;
	unit?: string;
	hint?: string;
	tone?: "default" | "success" | "warning" | "danger";
}

export function StatsKpiRow({ items }: { items: KpiItem[] }) {
	return (
		<View style={styles.row}>
			{items.map((item) => (
				<View key={item.label} style={styles.cell}>
					<Text style={styles.label}>{item.label}</Text>
					<View style={styles.valueRow}>
						<Text style={[styles.value, toneColor(item.tone)]}>
							{item.value}
						</Text>
						{item.unit ? <Text style={styles.unit}> {item.unit}</Text> : null}
					</View>
					{item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
				</View>
			))}
		</View>
	);
}

function toneColor(tone: KpiItem["tone"]) {
	switch (tone) {
		case "success":
			return { color: colors.success };
		case "warning":
			return { color: colors.warning };
		case "danger":
			return { color: colors.danger };
		default:
			return { color: colors.text };
	}
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	cell: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
	},
	label: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: spacing.xs,
	},
	valueRow: { flexDirection: "row", alignItems: "baseline" },
	value: {
		fontSize: fontSize.xl,
		fontFamily: fonts.semibold,
		fontVariant: ["tabular-nums"],
	},
	unit: {
		fontSize: fontSize.xs,
		color: colors.textDim,
		fontFamily: fonts.regular,
	},
	hint: {
		marginTop: spacing.xs,
		fontSize: fontSize.xs,
		color: colors.textDim,
	},
});
