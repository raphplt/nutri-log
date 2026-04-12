import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { todayString } from "@/lib/date";
import { type FoodRow, getFrequentFoods } from "@/lib/food-service";
import { addMealItem, guessMealType } from "@/lib/meal-service";

type ModeKey = "scan" | "search" | "quick";

export default function AddScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [recents, setRecents] = useState<FoodRow[]>([]);

	useEffect(() => {
		getFrequentFoods(10).then(setRecents);
	}, []);

	const modes: {
		key: ModeKey;
		icon: "camera" | "search" | "bolt";
		label: string;
		desc: string;
	}[] = [
		{
			key: "scan",
			icon: "camera",
			label: t("addScreen.modeScan"),
			desc: t("addScreen.modeScanDesc"),
		},
		{
			key: "search",
			icon: "search",
			label: t("addScreen.modeSearch"),
			desc: t("addScreen.modeSearchDesc"),
		},
		{
			key: "quick",
			icon: "bolt",
			label: t("addScreen.modeQuick"),
			desc: t("addScreen.modeQuickDesc"),
		},
	];

	const handleMode = (key: ModeKey) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.push(`/add/${key}` as "/add/scan" | "/add/search" | "/add/quick");
	};

	const handleRecent = async (food: FoodRow) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		const qty = food.defaultServingG ?? 100;
		const factor = qty / 100;
		await addMealItem({
			date: todayString(),
			mealType: guessMealType(),
			foodId: food.id,
			name: food.name,
			quantityG: qty,
			kcal: Math.round(food.kcalPer100g * factor),
			protein: Math.round(food.proteinPer100g * factor),
			carbs: Math.round(food.carbsPer100g * factor),
			fat: Math.round(food.fatPer100g * factor),
			fiber: food.fiberPer100g ? Math.round(food.fiberPer100g * factor) : null,
		});
		router.back();
	};

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			{recents.length > 0 && (
				<View style={styles.recentsSection}>
					<Text style={styles.sectionLabel}>{t("addScreen.recents")}</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.carousel}
					>
						{recents.map((food) => (
							<Pressable
								key={food.id}
								onPress={() => handleRecent(food)}
								style={styles.recentChip}
							>
								<Text style={styles.recentName} numberOfLines={1}>
									{food.name}
								</Text>
								<Text style={styles.recentKcal}>
									{Math.round(food.kcalPer100g)} {t("common.kcal")}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>
			)}

			<View style={styles.modesGrid}>
				{modes.map((mode) => (
					<Pressable
						key={mode.key}
						onPress={() => handleMode(mode.key)}
						style={styles.modeCard}
					>
						<FontAwesome name={mode.icon} size={28} color={colors.primary} />
						<Text style={styles.modeLabel}>{mode.label}</Text>
						<Text style={styles.modeDesc}>{mode.desc}</Text>
					</Pressable>
				))}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	recentsSection: { marginBottom: spacing.xl },
	sectionLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	carousel: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
	recentChip: {
		backgroundColor: colors.surface,
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		marginRight: spacing.sm,
		maxWidth: 160,
	},
	recentName: {
		fontSize: fontSize.sm,
		fontWeight: "600",
		color: colors.text,
	},
	recentKcal: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		marginTop: 2,
	},
	modesGrid: {
		gap: spacing.sm,
	},
	modeCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.xl,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.lg,
	},
	modeLabel: {
		fontSize: fontSize.lg,
		fontWeight: "600",
		color: colors.text,
	},
	modeDesc: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginLeft: "auto",
	},
});
