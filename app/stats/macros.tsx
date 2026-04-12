import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatsEmptyState } from "@/components/StatsEmptyState";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useGoals } from "@/hooks/useGoals";
import { useDailyMacrosSeries } from "@/hooks/useStatsData";
import { useStatsPeriod } from "@/hooks/useStatsPeriod";

export default function MacrosStatsScreen() {
	const { t } = useTranslation();
	const { period } = useStatsPeriod();
	const goals = useGoals();
	const series = useDailyMacrosSeries(period.from, period.to);

	const loggedDays = series.filter(
		(s) => s.protein + s.carbs + s.fat > 0,
	).length;
	const sums = series.reduce(
		(acc, s) => ({
			p: acc.p + s.protein,
			c: acc.c + s.carbs,
			f: acc.f + s.fat,
		}),
		{ p: 0, c: 0, f: 0 },
	);
	const avgP = loggedDays > 0 ? Math.round(sums.p / loggedDays) : 0;
	const avgC = loggedDays > 0 ? Math.round(sums.c / loggedDays) : 0;
	const avgF = loggedDays > 0 ? Math.round(sums.f / loggedDays) : 0;

	const pKcal = avgP * 4;
	const cKcal = avgC * 4;
	const fKcal = avgF * 9;
	const totalKcal = pKcal + cKcal + fKcal;
	const pctP = totalKcal > 0 ? Math.round((pKcal / totalKcal) * 100) : 0;
	const pctC = totalKcal > 0 ? Math.round((cKcal / totalKcal) * 100) : 0;
	const pctF = totalKcal > 0 ? Math.max(0, 100 - pctP - pctC) : 0;

	const maxStack = Math.max(
		1,
		...series.map((s) => s.protein + s.carbs + s.fat),
	);
	const chartMax = Math.ceil(maxStack / 50) * 50;

	const screenWidth = Dimensions.get("window").width;
	const chartAreaWidth = screenWidth - spacing.xl * 2 - spacing.lg * 2;
	const barCount = series.length;
	const availableWidth = barCount > 30 ? chartAreaWidth * 2.2 : chartAreaWidth;
	const slot = Math.max(4, availableWidth / Math.max(barCount, 1));
	const barWidth = Math.max(3, Math.floor(slot * 0.6));
	const barSpacing = Math.max(1, Math.floor(slot * 0.4));
	const labelStride = Math.max(1, Math.ceil(barCount / 6));

	const stackData = useMemo(
		() =>
			series.map((s, i) => ({
				label: i % labelStride === 0 ? s.date.slice(5) : "",
				stacks: [
					{ value: s.protein, color: colors.macro.protein },
					{ value: s.carbs, color: colors.macro.carbs },
					{ value: s.fat, color: colors.macro.fat },
				],
			})),
		[series, labelStride],
	);

	const pieData = useMemo(
		() =>
			totalKcal > 0
				? [
						{ value: pKcal, color: colors.macro.protein },
						{ value: cKcal, color: colors.macro.carbs },
						{ value: fKcal, color: colors.macro.fat },
					]
				: [{ value: 1, color: colors.border }],
		[pKcal, cKcal, fKcal, totalKcal],
	);

	const delta = (current: number, target?: number | null) => {
		if (!target) return null;
		const d = current - target;
		return d;
	};
	const dP = delta(avgP, goals.proteinTargetG);
	const dC = delta(avgC, goals.carbsTargetG);
	const dF = delta(avgF, goals.fatTargetG);

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<PeriodSelector />

			{loggedDays < 3 ? <StatsEmptyState /> : null}

			<Animated.View
				entering={FadeInDown.duration(350).delay(50)}
				style={styles.chartCard}
			>
				<Text style={styles.chartTitle}>{t("stats.macros.chartTitle")}</Text>
				<Legend />
				<BarChart
					stackData={stackData}
					barWidth={barWidth}
					spacing={barSpacing}
					initialSpacing={8}
					maxValue={chartMax}
					noOfSections={4}
					hideRules
					barBorderRadius={2}
					xAxisColor={colors.border}
					yAxisColor="transparent"
					xAxisLabelTextStyle={styles.axisLabel}
					yAxisTextStyle={styles.axisLabel}
					yAxisLabelWidth={40}
					isAnimated
					animationDuration={400}
				/>
			</Animated.View>

			<Animated.View
				entering={FadeInDown.duration(350).delay(150)}
				style={styles.pieCard}
			>
				<Text style={styles.chartTitle}>{t("stats.macros.splitTitle")}</Text>
				<View style={styles.pieRow}>
					<PieChart
						data={pieData}
						donut
						radius={70}
						innerRadius={44}
						innerCircleColor={colors.surface}
						centerLabelComponent={() => (
							<View style={styles.pieCenter}>
								<Text style={styles.pieCenterLabel}>
									{t("stats.macros.avgDaily")}
								</Text>
								<Text style={styles.pieCenterValue}>
									{Math.round(totalKcal)}
								</Text>
								<Text style={styles.pieCenterUnit}>{t("common.kcal")}</Text>
							</View>
						)}
					/>
					<View style={styles.pieLegend}>
						<MacroStat
							color={colors.macro.protein}
							label={t("macro.protein")}
							g={avgP}
							pct={pctP}
							delta={dP}
						/>
						<MacroStat
							color={colors.macro.carbs}
							label={t("macro.carbs")}
							g={avgC}
							pct={pctC}
							delta={dC}
						/>
						<MacroStat
							color={colors.macro.fat}
							label={t("macro.fat")}
							g={avgF}
							pct={pctF}
							delta={dF}
						/>
					</View>
				</View>
			</Animated.View>
		</ScrollView>
	);
}

function Legend() {
	const { t } = useTranslation();
	return (
		<View style={styles.legend}>
			<LegendDot color={colors.macro.protein} label={t("macro.protein")} />
			<LegendDot color={colors.macro.carbs} label={t("macro.carbs")} />
			<LegendDot color={colors.macro.fat} label={t("macro.fat")} />
		</View>
	);
}

function LegendDot({ color, label }: { color: string; label: string }) {
	return (
		<View style={styles.legendItem}>
			<View style={[styles.legendDot, { backgroundColor: color }]} />
			<Text style={styles.legendLabel}>{label}</Text>
		</View>
	);
}

function MacroStat({
	color,
	label,
	g,
	pct,
	delta,
}: {
	color: string;
	label: string;
	g: number;
	pct: number;
	delta: number | null;
}) {
	return (
		<View style={styles.statRow}>
			<View style={[styles.statDot, { backgroundColor: color }]} />
			<View style={styles.statBody}>
				<Text style={styles.statLabel}>{label}</Text>
				<Text style={styles.statValue}>
					{g} g · {pct}%
				</Text>
			</View>
			{delta !== null ? (
				<Text
					style={[
						styles.statDelta,
						delta > 0 ? styles.deltaPos : styles.deltaNeg,
					]}
				>
					{delta > 0 ? "+" : ""}
					{delta}
				</Text>
			) : null}
		</View>
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
	legend: {
		flexDirection: "row",
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
	},
	legendLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
	},
	axisLabel: {
		color: colors.textDim,
		fontSize: fontSize.xs,
	},
	pieCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.lg,
	},
	pieRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.lg,
	},
	pieCenter: { alignItems: "center" },
	pieCenterLabel: {
		fontSize: fontSize.xs,
		color: colors.textDim,
	},
	pieCenterValue: {
		fontSize: fontSize.lg,
		fontFamily: fonts.semibold,
		color: colors.text,
	},
	pieCenterUnit: {
		fontSize: fontSize.xs,
		color: colors.textDim,
	},
	pieLegend: {
		flex: 1,
		gap: spacing.sm,
	},
	statRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	statDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	statBody: { flex: 1 },
	statLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
	},
	statValue: {
		fontSize: fontSize.sm,
		fontFamily: fonts.semibold,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	statDelta: {
		fontSize: fontSize.xs,
		fontFamily: fonts.medium,
		fontVariant: ["tabular-nums"],
	},
	deltaPos: { color: colors.warning },
	deltaNeg: { color: colors.success },
});
