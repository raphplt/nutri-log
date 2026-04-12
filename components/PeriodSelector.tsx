import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useStatsPeriod } from "@/hooks/useStatsPeriod";
import type { PeriodKind } from "@/lib/stats-period";

const OPTIONS: PeriodKind[] = ["week", "month", "3m", "year"];

export function PeriodSelector() {
	const { t } = useTranslation();
	const { period, setPeriod } = useStatsPeriod();

	const handle = (kind: PeriodKind) => {
		Haptics.selectionAsync();
		setPeriod(kind);
	};

	return (
		<View style={styles.container}>
			{OPTIONS.map((kind) => {
				const active = period.kind === kind;
				return (
					<Pressable
						key={kind}
						onPress={() => handle(kind)}
						style={[styles.btn, active && styles.btnActive]}
					>
						<Text style={[styles.label, active && styles.labelActive]}>
							{t(`stats.period.${kind}`)}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: colors.surface,
		borderRadius: radii.pill,
		padding: 4,
		gap: 2,
	},
	btn: {
		flex: 1,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.xs,
		borderRadius: radii.pill,
		alignItems: "center",
	},
	btnActive: {
		backgroundColor: colors.primaryGlow,
	},
	label: {
		fontFamily: fonts.medium,
		fontSize: fontSize.sm,
		color: colors.textMuted,
	},
	labelActive: {
		color: colors.primaryLight,
		fontFamily: fonts.semibold,
	},
});
