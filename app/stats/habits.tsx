import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CalorieHeatmap } from "@/components/CalorieHeatmap";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatsEmptyState } from "@/components/StatsEmptyState";
import { StatsKpiRow } from "@/components/StatsKpiRow";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useGoals } from "@/hooks/useGoals";
import {
	useAverageByMealType,
	useDailyKcalSeries,
	useHeatmapData,
	useStreakInfo,
} from "@/hooks/useStatsData";
import { useStatsPeriod } from "@/hooks/useStatsPeriod";
import { formatDateLabel } from "@/lib/date";

const MEAL_COLORS: Record<string, string> = {
	breakfast: colors.warning,
	lunch: colors.primary,
	snack: colors.macro.fat,
	dinner: colors.info,
};

export default function HabitsStatsScreen() {
	const { t } = useTranslation();
	const { period } = useStatsPeriod();
	const goals = useGoals();
	const streak = useStreakInfo();
	const heatmap = useHeatmapData(period.from, period.to, goals.kcalTarget);
	const mealAvg = useAverageByMealType(period.from, period.to);
	const kcalSeries = useDailyKcalSeries(period.from, period.to);

	const logged = kcalSeries.filter((s) => s.kcal > 0);
	const hasEnoughData = logged.length >= 3;
	const bestDay = logged.reduce<(typeof logged)[number] | null>(
		(acc, d) => (acc === null || d.kcal > acc.kcal ? d : acc),
		null,
	);
	const worstDay = logged.reduce<(typeof logged)[number] | null>(
		(acc, d) => (acc === null || d.kcal < acc.kcal ? d : acc),
		null,
	);

	const maxMealKcal = Math.max(1, ...mealAvg.map((m) => m.avgKcal));
	const chartMax = Math.ceil(maxMealKcal / 100) * 100;

	const screenWidth = Dimensions.get("window").width;
	const chartAreaWidth = screenWidth - spacing.xl * 2 - spacing.lg * 2;
	const mealBarWidth = Math.max(
		24,
		Math.min(60, (chartAreaWidth - 40) / Math.max(mealAvg.length, 1) - 12),
	);

	const mealBarData = useMemo(
		() =>
			mealAvg.map((m) => ({
				value: m.avgKcal,
				label: t(`meal.${m.mealType}`),
				frontColor: MEAL_COLORS[m.mealType] ?? colors.primary,
			})),
		[mealAvg, t],
	);

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<PeriodSelector />

			{!hasEnoughData ? <StatsEmptyState /> : null}

			<StatsKpiRow
				items={[
					{
						label: t("stats.habits.streak"),
						value: `${streak.current}`,
						unit: t("stats.kpi.days"),
						tone: streak.current > 0 ? "success" : "default",
					},
					{
						label: t("stats.habits.best"),
						value: `${streak.best}`,
						unit: t("stats.kpi.days"),
					},
				]}
			/>

			<Animated.View
				entering={FadeInDown.duration(350).delay(50)}
				style={styles.card}
			>
				<Text style={styles.cardTitle}>{t("stats.habits.heatmap")}</Text>
				<Text style={styles.cardHint}>{t("stats.habits.heatmapHint")}</Text>
				<CalorieHeatmap data={heatmap} />
			</Animated.View>

			{mealBarData.length > 0 ? (
				<Animated.View
					entering={FadeInDown.duration(350).delay(150)}
					style={styles.card}
				>
					<Text style={styles.cardTitle}>{t("stats.habits.byMealType")}</Text>
					<BarChart
						data={mealBarData}
						barWidth={mealBarWidth}
						spacing={24}
						maxValue={chartMax}
						noOfSections={4}
						barBorderRadius={4}
						hideRules
						xAxisColor={colors.border}
						yAxisColor="transparent"
						yAxisLabelWidth={40}
						xAxisLabelTextStyle={styles.axisLabel}
						yAxisTextStyle={styles.axisLabel}
						isAnimated
						animationDuration={400}
					/>
				</Animated.View>
			) : null}

			{bestDay || worstDay ? (
				<Animated.View
					entering={FadeInDown.duration(350).delay(250)}
					style={styles.card}
				>
					{bestDay ? (
						<DayHighlight
							label={t("stats.habits.bestDay")}
							date={bestDay.date}
							kcal={bestDay.kcal}
							tone={colors.warning}
						/>
					) : null}
					{worstDay && worstDay.date !== bestDay?.date ? (
						<View style={styles.divider} />
					) : null}
					{worstDay && worstDay.date !== bestDay?.date ? (
						<DayHighlight
							label={t("stats.habits.worstDay")}
							date={worstDay.date}
							kcal={worstDay.kcal}
							tone={colors.info}
						/>
					) : null}
				</Animated.View>
			) : null}
		</ScrollView>
	);
}

function DayHighlight({
	label,
	date,
	kcal,
	tone,
}: {
	label: string;
	date: string;
	kcal: number;
	tone: string;
}) {
	const { t } = useTranslation();
	return (
		<View style={styles.highlightRow}>
			<View style={styles.highlightBody}>
				<Text style={styles.cardHint}>{label}</Text>
				<Text style={styles.highlightDate}>{formatDateLabel(date)}</Text>
			</View>
			<Text style={[styles.highlightValue, { color: tone }]}>
				{kcal} {t("common.kcal")}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.lg,
	},
	cardTitle: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: spacing.xs,
	},
	cardHint: {
		fontSize: fontSize.xs,
		color: colors.textDim,
		marginBottom: spacing.sm,
	},
	axisLabel: {
		color: colors.textDim,
		fontSize: fontSize.xs,
	},
	highlightRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	highlightBody: { flex: 1 },
	highlightDate: {
		fontSize: fontSize.md,
		fontFamily: fonts.semibold,
		color: colors.text,
		marginTop: 2,
	},
	highlightValue: {
		fontSize: fontSize.lg,
		fontFamily: fonts.semibold,
		fontVariant: ["tabular-nums"],
	},
	divider: {
		height: 1,
		backgroundColor: colors.border,
		marginVertical: spacing.md,
	},
});
