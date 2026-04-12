import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import type { MealWithItems } from "@/hooks/useDailyMeals";

const MEAL_ICONS: Record<string, string> = {
	breakfast: "🌅",
	lunch: "☀️",
	snack: "🍎",
	dinner: "🌙",
};

interface Props {
	meals: MealWithItems[];
}

export function MealTimeline({ meals }: Props) {
	const { t } = useTranslation();
	if (meals.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>{t("dashboard.noMealsTitle")}</Text>
				<Text style={styles.emptyHint}>{t("dashboard.noMealsHint")}</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{meals.map((meal) => (
				<MealCard key={meal.id} meal={meal} />
			))}
		</View>
	);
}

function MealCard({ meal }: { meal: MealWithItems }) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const router = useRouter();
	const icon = MEAL_ICONS[meal.mealType] ?? "🍽️";
	const label = t(`meal.${meal.mealType}` as const, {
		defaultValue: meal.mealType,
	});

	return (
		<Pressable
			onPress={() => setExpanded(!expanded)}
			onLongPress={() => router.push(`/meal/${meal.id}`)}
			style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
		>
			<View style={styles.cardHeader}>
				<Text style={styles.mealIcon}>{icon}</Text>
				<Text style={styles.mealLabel}>{label}</Text>
				<View style={styles.kcalWrap}>
					<Text style={styles.mealKcal}>{Math.round(meal.totalKcal)}</Text>
					<Text style={styles.kcalUnit}>{t("common.kcal")}</Text>
				</View>
			</View>

			{expanded &&
				meal.items.map((item) => (
					<View key={item.id} style={styles.itemRow}>
						<Text style={styles.itemName} numberOfLines={1}>
							{item.name}
						</Text>
						<Text style={styles.itemDetail}>
							{Math.round(item.quantityG)}
							{t("common.grams")} · {Math.round(item.kcal)} {t("common.kcal")}
						</Text>
					</View>
				))}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: spacing.sm,
	},
	emptyContainer: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
	},
	emptyText: {
		fontFamily: fonts.medium,
		fontSize: fontSize.md,
		color: colors.textMuted,
	},
	emptyHint: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textDim,
		marginTop: spacing.xs,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
	},
	cardPressed: {
		backgroundColor: colors.surfaceHover,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	mealIcon: {
		fontSize: 20,
	},
	mealLabel: {
		flex: 1,
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
		color: colors.text,
	},
	kcalWrap: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 4,
	},
	mealKcal: {
		fontFamily: fonts.bold,
		fontSize: fontSize.md,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	kcalUnit: {
		fontFamily: fonts.medium,
		fontSize: fontSize.xs,
		color: colors.textMuted,
	},
	itemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: spacing.sm,
		marginLeft: 32,
	},
	itemName: {
		flex: 1,
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
	},
	itemDetail: {
		fontFamily: fonts.medium,
		fontSize: fontSize.sm,
		color: colors.textDim,
		marginLeft: spacing.sm,
		fontVariant: ["tabular-nums"],
	},
});
