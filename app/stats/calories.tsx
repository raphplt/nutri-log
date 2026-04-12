import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatsEmptyState } from "@/components/StatsEmptyState";
import { StatsKpiRow } from "@/components/StatsKpiRow";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useGoals } from "@/hooks/useGoals";
import { useDailyKcalSeries } from "@/hooks/useStatsData";
import { useStatsPeriod } from "@/hooks/useStatsPeriod";
import { formatDateLabel } from "@/lib/date";
import { movingAverage } from "@/lib/stats-period";

export default function CaloriesStatsScreen() {
	const { t } = useTranslation();
	const { period } = useStatsPeriod();
	const goals = useGoals();
	const series = useDailyKcalSeries(period.from, period.to);
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

	const avg7 = useMemo(
		() =>
			movingAverage(
				series.map((s) => s.kcal),
				7,
			),
		[series],
	);

	const { kcalTarget } = goals;
	const maxKcal = Math.max(
		kcalTarget,
		...series.map((s) => s.kcal),
		...avg7,
		1,
	);
	const chartMax = Math.ceil(maxKcal / 500) * 500;

	const loggedDays = series.filter((s) => s.kcal > 0).length;
	const totalKcal = series.reduce((acc, s) => acc + s.kcal, 0);
	const avgKcal = loggedDays > 0 ? Math.round(totalKcal / loggedDays) : 0;
	const hasEnoughData = loggedDays >= 3;
	const pctVsTarget =
		kcalTarget > 0 ? Math.round((avgKcal / kcalTarget) * 100) : 0;
	const avgTone =
		pctVsTarget >= 95 && pctVsTarget <= 110
			? "success"
			: pctVsTarget > 110
				? "danger"
				: "warning";

	const screenWidth = Dimensions.get("window").width;
	const chartAreaWidth = screenWidth - spacing.xl * 2 - spacing.lg * 2;
	const barCount = series.length;
	const availableWidth = barCount > 30 ? chartAreaWidth * 2.2 : chartAreaWidth;
	const slot = Math.max(4, availableWidth / Math.max(barCount, 1));
	const barWidth = Math.max(3, Math.floor(slot * 0.6));
	const barSpacing = Math.max(1, Math.floor(slot * 0.4));

	const labelStride = Math.max(1, Math.ceil(barCount / 6));

	const barData = useMemo(
		() =>
			series.map((s, i) => {
				const isOver = s.kcal > kcalTarget * 1.1;
				return {
					value: s.kcal,
					label: i % labelStride === 0 ? s.date.slice(5) : "",
					frontColor:
						selectedIdx === i
							? colors.primaryLight
							: s.kcal === 0
								? colors.border
								: isOver
									? colors.danger
									: colors.primary,
					topLabelComponent: undefined,
					onPress: () => setSelectedIdx(i),
				};
			}),
		[series, kcalTarget, selectedIdx, labelStride],
	);

	const lineData = useMemo(() => avg7.map((v) => ({ value: v })), [avg7]);

	const selected = selectedIdx !== null ? series[selectedIdx] : null;

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.periodWrap}>
				<PeriodSelector />
			</View>

			{!hasEnoughData ? <StatsEmptyState /> : null}

			<StatsKpiRow
				items={[
					{
						label: t("stats.kpi.avgPerDay"),
						value: `${avgKcal}`,
						unit: t("common.kcal"),
						hint: `${pctVsTarget}% ${t("stats.kpi.vsTarget")}`,
						tone: avgTone,
					},
					{
						label: t("stats.kpi.total"),
						value: `${Math.round(totalKcal / 1000)}k`,
						unit: t("common.kcal"),
					},
					{
						label: t("stats.kpi.loggedDays"),
						value: `${loggedDays}`,
						unit: `/ ${series.length}`,
					},
				]}
			/>

			<Animated.View
				entering={FadeInDown.duration(350).delay(50)}
				style={styles.chartCard}
			>
				<Text style={styles.chartTitle}>{t("stats.calories.chartTitle")}</Text>
				<View style={styles.legend}>
					<LegendDot color={colors.primary} label={t("common.kcal")} />
					<LegendDot
						color={colors.info}
						label={t("stats.calories.movingAvg")}
						dashed
					/>
					<LegendDot
						color={colors.textMuted}
						label={t("stats.calories.target")}
						dashed
					/>
				</View>
				<BarChart
					data={barData}
					barWidth={barWidth}
					spacing={barSpacing}
					initialSpacing={8}
					noOfSections={4}
					maxValue={chartMax}
					barBorderRadius={2}
					hideRules
					showVerticalLines={false}
					xAxisColor={colors.border}
					yAxisColor="transparent"
					xAxisLabelTextStyle={styles.axisLabel}
					yAxisTextStyle={styles.axisLabel}
					yAxisLabelWidth={40}
					showLine
					lineData={lineData}
					lineConfig={{
						color: colors.info,
						thickness: 2,
						curved: true,
						hideDataPoints: true,
						dataPointsRadius: 0,
					}}
					showReferenceLine1
					referenceLine1Position={kcalTarget}
					referenceLine1Config={{
						color: colors.textMuted,
						thickness: 1,
						dashWidth: 4,
						dashGap: 3,
					}}
					isAnimated
					animationDuration={400}
				/>
			</Animated.View>

			{selected ? (
				<View style={styles.dayDetail}>
					<Text style={styles.detailLabel}>
						{t("stats.calories.dayDetail")}
					</Text>
					<View style={styles.detailRow}>
						<Text style={styles.detailDate}>
							{formatDateLabel(selected.date)}
						</Text>
						<Text style={styles.detailValue}>
							{selected.kcal} {t("common.kcal")}
						</Text>
					</View>
					{kcalTarget > 0 ? (
						<Text style={styles.detailHint}>
							{Math.round((selected.kcal / kcalTarget) * 100)}%{" "}
							{t("stats.kpi.vsTarget")}
						</Text>
					) : null}
				</View>
			) : null}
		</ScrollView>
	);
}

function LegendDot({
	color,
	label,
	dashed,
}: {
	color: string;
	label: string;
	dashed?: boolean;
}) {
	return (
		<View style={styles.legendItem}>
			<View
				style={[
					styles.legendDot,
					{
						backgroundColor: dashed ? "transparent" : color,
						borderColor: color,
					},
				]}
			/>
			<Text style={styles.legendLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
	periodWrap: {},
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
	legend: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.md,
		marginBottom: spacing.md,
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
	},
	legendDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		borderWidth: 1.5,
	},
	legendLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
	},
	axisLabel: {
		color: colors.textDim,
		fontSize: fontSize.xs,
	},
	dayDetail: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
	},
	detailLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: spacing.sm,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
	},
	detailDate: {
		fontSize: fontSize.md,
		fontFamily: fonts.semibold,
		color: colors.text,
	},
	detailValue: {
		fontSize: fontSize.lg,
		fontFamily: fonts.semibold,
		color: colors.primaryLight,
		fontVariant: ["tabular-nums"],
	},
	detailHint: {
		marginTop: spacing.xs,
		fontSize: fontSize.sm,
		color: colors.textDim,
	},
});
