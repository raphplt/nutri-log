import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { PeriodSelector } from "@/components/PeriodSelector";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { useGoals } from "@/hooks/useGoals";
import {
	useComparedTotals,
	usePeriodTotals,
	useStreakInfo,
} from "@/hooks/useStatsData";
import { useStatsPeriod } from "@/hooks/useStatsPeriod";
import { buildPeriodCsv } from "@/lib/stats-export";
import { daysBetween } from "@/lib/stats-period";

type CardKey = "calories" | "macros" | "weight" | "habits";
type IconName = React.ComponentProps<typeof FontAwesome>["name"];

const CARD_ICONS: Record<CardKey, IconName> = {
	calories: "fire",
	macros: "pie-chart",
	weight: "balance-scale",
	habits: "calendar",
};

const CARD_COLORS: Record<CardKey, string> = {
	calories: colors.primary,
	macros: colors.macro.carbs,
	weight: colors.info,
	habits: colors.macro.fat,
};

export default function StatsHubScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { period } = useStatsPeriod();
	const goals = useGoals();
	const totals = usePeriodTotals(period.from, period.to);
	const compared = useComparedTotals(period.from, period.to);
	const streak = useStreakInfo();

	const nbDays = daysBetween(period.from, period.to);
	const avgKcalPerDay = compared.current.avgKcal;
	const pctVsTarget =
		goals.kcalTarget > 0
			? Math.round((avgKcalPerDay / goals.kcalTarget) * 100)
			: 0;

	const cards: CardKey[] = ["calories", "macros", "weight", "habits"];

	const handleExport = useCallback(async () => {
		try {
			const csv = await buildPeriodCsv(period.from, period.to);
			await Share.share({
				title: t("stats.export.shareTitle"),
				message: csv,
			});
		} catch (err) {
			Alert.alert(
				t("common.error"),
				err instanceof Error ? err.message : t("common.errorGeneric"),
			);
		}
	}, [period, t]);

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.header}>
				<Text style={styles.title}>{t("stats.title")}</Text>
			</View>

			<View style={styles.periodWrap}>
				<PeriodSelector />
			</View>

			<View style={styles.kpiRow}>
				<KpiCell
					label={t("stats.kpi.avgPerDay")}
					value={`${avgKcalPerDay}`}
					unit={t("common.kcal")}
					hint={`${pctVsTarget}% ${t("stats.kpi.vsTarget")}`}
					delta={formatDelta(compared.deltaKcalPct, "%")}
					deltaTone={compared.deltaKcalPct >= 0 ? "up" : "down"}
				/>
				<KpiCell
					label={t("stats.kpi.loggedDays")}
					value={`${totals.loggedDays}`}
					unit={`/ ${nbDays}`}
					delta={formatDelta(compared.deltaLoggedDays)}
					deltaTone={compared.deltaLoggedDays >= 0 ? "down" : "up"}
				/>
				<KpiCell
					label={t("stats.kpi.currentStreak")}
					value={`${streak.current}`}
					unit={t("stats.kpi.days")}
					hint={`${t("stats.kpi.bestStreak")} ${streak.best}`}
				/>
			</View>

			<View style={styles.cardsGrid}>
				{cards.map((key) => (
					<Pressable
						key={key}
						onPress={() => router.push(`/stats/${key}`)}
						style={styles.card}
					>
						<View
							style={[
								styles.iconWrap,
								{ backgroundColor: `${CARD_COLORS[key]}22` },
							]}
						>
							<FontAwesome
								name={CARD_ICONS[key]}
								size={20}
								color={CARD_COLORS[key]}
							/>
						</View>
						<View style={styles.cardBody}>
							<Text style={styles.cardTitle}>{t(`stats.cards.${key}`)}</Text>
							<Text style={styles.cardDesc}>{t(`stats.cards.${key}Desc`)}</Text>
						</View>
						<FontAwesome
							name="chevron-right"
							size={14}
							color={colors.textDim}
						/>
					</Pressable>
				))}
			</View>

			<Pressable onPress={handleExport} style={styles.exportBtn}>
				<FontAwesome name="download" size={14} color={colors.textMuted} />
				<Text style={styles.exportLabel}>{t("stats.export.button")}</Text>
			</Pressable>
		</ScrollView>
	);
}

function formatDelta(value: number, suffix = ""): string | undefined {
	if (value === 0) return undefined;
	const sign = value > 0 ? "+" : "";
	return `${sign}${value}${suffix}`;
}

function KpiCell({
	label,
	value,
	unit,
	hint,
	delta,
	deltaTone,
}: {
	label: string;
	value: string;
	unit?: string;
	hint?: string;
	delta?: string;
	deltaTone?: "up" | "down";
}) {
	const { t } = useTranslation();
	return (
		<View style={styles.kpiCell}>
			<Text style={styles.kpiLabel}>{label}</Text>
			<View style={styles.kpiValueRow}>
				<Text style={styles.kpiValue}>{value}</Text>
				{unit ? <Text style={styles.kpiUnit}> {unit}</Text> : null}
			</View>
			{delta ? (
				<View style={styles.deltaRow}>
					<FontAwesome
						name={deltaTone === "up" ? "arrow-up" : "arrow-down"}
						size={10}
						color={deltaTone === "up" ? colors.warning : colors.success}
					/>
					<Text
						style={[
							styles.deltaText,
							{
								color: deltaTone === "up" ? colors.warning : colors.success,
							},
						]}
					>
						{delta}
					</Text>
					<Text style={styles.deltaHint}>{t("stats.compare.vsPrevious")}</Text>
				</View>
			) : hint ? (
				<Text style={styles.kpiHint}>{hint}</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	header: { marginBottom: spacing.lg },
	title: {
		fontSize: fontSize.title,
		fontFamily: fonts.bold,
		color: colors.text,
	},
	periodWrap: { marginBottom: spacing.lg },
	kpiRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.lg,
	},
	kpiCell: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
	},
	kpiLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: spacing.xs,
	},
	kpiValueRow: { flexDirection: "row", alignItems: "baseline" },
	kpiValue: {
		fontSize: fontSize.xl,
		fontFamily: fonts.semibold,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	kpiUnit: {
		fontSize: fontSize.xs,
		color: colors.textDim,
		fontFamily: fonts.regular,
	},
	kpiHint: {
		marginTop: spacing.xs,
		fontSize: fontSize.xs,
		color: colors.textDim,
	},
	deltaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: spacing.xs,
		flexWrap: "wrap",
	},
	deltaText: {
		fontSize: fontSize.xs,
		fontFamily: fonts.semibold,
		fontVariant: ["tabular-nums"],
	},
	deltaHint: {
		fontSize: 10,
		color: colors.textDim,
	},
	cardsGrid: { gap: spacing.sm, marginBottom: spacing.lg },
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
	},
	iconWrap: {
		width: 44,
		height: 44,
		borderRadius: radii.sm,
		alignItems: "center",
		justifyContent: "center",
	},
	cardBody: { flex: 1 },
	cardTitle: {
		fontSize: fontSize.md,
		fontFamily: fonts.semibold,
		color: colors.text,
	},
	cardDesc: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginTop: 2,
	},
	exportBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		paddingVertical: spacing.md,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
	},
	exportLabel: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		fontFamily: fonts.medium,
	},
});
