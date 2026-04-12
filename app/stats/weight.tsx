import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatsKpiRow } from "@/components/StatsKpiRow";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useWeightSeries } from "@/hooks/useStatsData";
import { useStatsPeriod } from "@/hooks/useStatsPeriod";
import { movingAverage } from "@/lib/stats-period";
import { projectionToTarget } from "@/lib/stats-service";

export default function WeightStatsScreen() {
	const { t } = useTranslation();
	const { period } = useStatsPeriod();
	const series = useWeightSeries(period.from, period.to);

	const values = useMemo(() => series.map((s) => s.weightKg), [series]);
	const avg7 = useMemo(() => movingAverage(values, 7), [values]);

	const hasData = series.length >= 2;

	const first = series[0]?.weightKg ?? 0;
	const last = series[series.length - 1]?.weightKg ?? 0;
	const deltaKg = hasData ? last - first : 0;

	const projection = useMemo(
		() =>
			hasData
				? projectionToTarget(series, last > first ? first + 1000 : first - 1000)
				: { slopePerWeek: 0, weeksToTarget: null },
		[series, hasData, first, last],
	);

	const minVal = Math.min(...values, last || 0) || 0;
	const maxVal = Math.max(...values, last || 0) || 1;
	const padding = Math.max(0.5, (maxVal - minVal) * 0.2);
	const yMin = Math.floor(minVal - padding);
	const yMax = Math.ceil(maxVal + padding);

	const screenWidth = Dimensions.get("window").width;
	const chartWidth = screenWidth - spacing.xl * 2 - spacing.lg * 2 - 40;

	const lineData = useMemo(() => values.map((v) => ({ value: v })), [values]);
	const avgData = useMemo(() => avg7.map((v) => ({ value: v })), [avg7]);

	const slopeLabel = projection.slopePerWeek.toFixed(2);
	const projectionMessage =
		hasData && Math.abs(projection.slopePerWeek) > 0.05
			? `${slopeLabel} ${t("common.kg")}${t("common.perWeek")}`
			: t("stats.weight.projectionNone");

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<PeriodSelector />

			{!hasData ? (
				<View style={styles.empty}>
					<Text style={styles.emptyText}>{t("stats.weight.noData")}</Text>
				</View>
			) : (
				<>
					<StatsKpiRow
						items={[
							{
								label: t("stats.weight.deltaSincePeriod"),
								value: `${deltaKg > 0 ? "+" : ""}${deltaKg.toFixed(1)}`,
								unit: t("common.kg"),
								tone: deltaKg <= 0 ? "success" : "warning",
							},
							{
								label: t("common.perWeek"),
								value: `${projection.slopePerWeek > 0 ? "+" : ""}${slopeLabel}`,
								unit: t("common.kg"),
							},
							{
								label: t("dashboard.weightLabel"),
								value: last.toFixed(1),
								unit: t("common.kg"),
							},
						]}
					/>

					<Animated.View
						entering={FadeInDown.duration(350).delay(50)}
						style={styles.chartCard}
					>
						<Text style={styles.chartTitle}>
							{t("stats.weight.chartTitle")}
						</Text>
						<LineChart
							data={lineData}
							data2={avgData}
							width={chartWidth}
							height={180}
							adjustToWidth
							color={colors.primary}
							thickness={2}
							curved
							hideDataPoints={series.length > 20}
							dataPointsRadius={3}
							dataPointsColor={colors.primary}
							color2={colors.info}
							thickness2={1.5}
							hideDataPoints2
							yAxisOffset={yMin}
							maxValue={yMax - yMin}
							noOfSections={4}
							yAxisTextStyle={styles.axisLabel}
							yAxisColor="transparent"
							xAxisColor={colors.border}
							hideRules
							isAnimated
							animationDuration={600}
						/>
						<Text style={styles.projection}>{projectionMessage}</Text>
					</Animated.View>
				</>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
	chartCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.lg,
	},
	chartTitle: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: spacing.sm,
	},
	axisLabel: {
		color: colors.textDim,
		fontSize: fontSize.xs,
	},
	projection: {
		marginTop: spacing.md,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		fontFamily: fonts.medium,
	},
	empty: {
		padding: spacing.xl,
		alignItems: "center",
	},
	emptyText: {
		fontSize: fontSize.md,
		color: colors.textMuted,
		textAlign: "center",
	},
});
