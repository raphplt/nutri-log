import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { useRecentWeights } from "@/hooks/useRecentWeights";
import { todayString } from "@/lib/date";
import { upsertWeight } from "@/lib/weight-service";

export default function WeightScreen() {
	const { t } = useTranslation();
	const weights = useRecentWeights(60);
	const [weightKg, setWeightKg] = useState(
		weights[weights.length - 1]?.weightKg ?? 70,
	);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		await upsertWeight(todayString(), weightKg);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setSaving(false);
	};

	const chartData = weights.map((w) => ({ value: w.weightKg }));
	const min =
		weights.length > 0 ? Math.min(...weights.map((w) => w.weightKg)) : 60;
	const max =
		weights.length > 0 ? Math.max(...weights.map((w) => w.weightKg)) : 90;

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<NumericInput
				label={t("weightScreen.todayLabel")}
				value={weightKg}
				onChangeValue={setWeightKg}
				unit={t("common.kg")}
				decimal
				min={30}
				max={300}
			/>
			<NextButton
				label={saving ? t("common.saving") : t("common.save")}
				onPress={handleSave}
				disabled={saving}
			/>

			{weights.length >= 2 && (
				<View style={styles.chartCard}>
					<Text style={styles.sectionLabel}>{t("weightScreen.evolution")}</Text>
					<LineChart
						data={chartData}
						height={160}
						color={colors.primary}
						thickness={2}
						curved
						hideDataPoints={weights.length > 15}
						dataPointsColor={colors.primary}
						yAxisTextStyle={{ color: colors.textDim, fontSize: 10 }}
						xAxisColor={colors.border}
						yAxisColor={colors.border}
						rulesColor={`${colors.border}40`}
						yAxisOffset={Math.floor(min) - 1}
						maxValue={Math.ceil(max) - Math.floor(min) + 2}
						noOfSections={4}
						areaChart
						startFillColor={`${colors.primary}30`}
						endFillColor={`${colors.primary}05`}
						isAnimated
						animationDuration={600}
					/>
				</View>
			)}

			<Text style={styles.sectionLabel}>{t("weightScreen.history")}</Text>
			{weights.length === 0 ? (
				<Text style={styles.empty}>{t("weightScreen.empty")}</Text>
			) : (
				[...weights].reverse().map((w) => (
					<View key={w.id} style={styles.historyRow}>
						<Text style={styles.historyDate}>{w.date}</Text>
						<Text style={styles.historyWeight}>
							{w.weightKg.toFixed(1)} {t("common.kg")}
						</Text>
					</View>
				))
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	chartCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		marginBottom: spacing.xl,
		overflow: "hidden",
	},
	sectionLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.md,
	},
	empty: {
		color: colors.textDim,
		fontSize: fontSize.md,
		textAlign: "center",
		marginTop: spacing.lg,
	},
	historyRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.sm,
		padding: spacing.lg,
		marginBottom: spacing.xs,
	},
	historyDate: { fontSize: fontSize.md, color: colors.textMuted },
	historyWeight: {
		fontSize: fontSize.md,
		fontWeight: "600",
		color: colors.text,
	},
});
