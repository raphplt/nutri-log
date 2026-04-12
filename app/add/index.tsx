import FontAwesome from "@expo/vector-icons/FontAwesome";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Animated,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { recipes as recipesTable } from "@/db/schema";
import { todayString } from "@/lib/date";
import { type FoodRow, getFrequentFoods } from "@/lib/food-service";
import { addMealItem, guessMealType } from "@/lib/meal-service";
import {
	expandTemplateIntoMeal,
	type RecipeRow,
	undoExpandedItems,
} from "@/lib/recipe-service";

type ModeKey = "scan" | "search" | "quick";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const UNDO_DURATION_MS = 3500;

export default function AddScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [recents, setRecents] = useState<FoodRow[]>([]);

	const { data: templatesData } = useLiveQuery(
		db
			.select()
			.from(recipesTable)
			.where(eq(recipesTable.kind, "template"))
			.orderBy(desc(recipesTable.useCount), desc(recipesTable.lastUsedAt)),
	);

	const templates: RecipeRow[] = templatesData.slice(0, 6);

	const [picker, setPicker] = useState<RecipeRow | null>(null);
	const [undoItems, setUndoItems] = useState<string[] | null>(null);
	const undoAnim = useRef(new Animated.Value(0)).current;
	const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		getFrequentFoods(10).then(setRecents);
	}, []);

	useEffect(() => {
		return () => {
			if (undoTimer.current) clearTimeout(undoTimer.current);
		};
	}, []);

	const showUndo = useCallback(
		(itemIds: string[]) => {
			if (undoTimer.current) clearTimeout(undoTimer.current);
			setUndoItems(itemIds);
			Animated.timing(undoAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
			undoTimer.current = setTimeout(() => {
				Animated.timing(undoAnim, {
					toValue: 0,
					duration: 180,
					useNativeDriver: true,
				}).start(() => setUndoItems(null));
			}, UNDO_DURATION_MS);
		},
		[undoAnim],
	);

	const handleUndo = async () => {
		if (!undoItems) return;
		if (undoTimer.current) clearTimeout(undoTimer.current);
		await undoExpandedItems(undoItems);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Animated.timing(undoAnim, {
			toValue: 0,
			duration: 180,
			useNativeDriver: true,
		}).start(() => setUndoItems(null));
	};

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

	const confirmTemplate = async (mealType: MealType) => {
		if (!picker) return;
		const template = picker;
		setPicker(null);
		const res = await expandTemplateIntoMeal(
			template.id,
			todayString(),
			mealType,
		);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		showUndo(res.itemIds);
	};

	return (
		<View style={styles.screen}>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				{templates.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>{t("templates.section")}</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.carousel}
							contentContainerStyle={styles.carouselContent}
						>
							{templates.map((tpl) => (
								<Pressable
									key={tpl.id}
									onPress={() => {
										Haptics.selectionAsync();
										setPicker(tpl);
									}}
									style={({ pressed }) => [
										styles.templateCard,
										pressed && styles.templateCardPressed,
									]}
								>
									<Text style={styles.templateIcon}>🍱</Text>
									<Text style={styles.templateName} numberOfLines={2}>
										{tpl.name}
									</Text>
									<Text style={styles.templateMeta}>
										{tpl.useCount
											? `${tpl.useCount} ×`
											: t("templates.items", { count: 0 })}
									</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				)}

				{recents.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>{t("addScreen.recents")}</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.carousel}
							contentContainerStyle={styles.carouselContent}
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

				<Pressable
					onPress={() => router.push("/recipe")}
					style={styles.recipeLink}
				>
					<FontAwesome name="book" size={20} color={colors.primary} />
					<Text style={styles.recipeLinkText}>{t("recipes.listTitle")}</Text>
					<FontAwesome
						name="chevron-right"
						size={12}
						color={colors.textMuted}
					/>
				</Pressable>
			</ScrollView>

			<Modal
				visible={picker != null}
				transparent
				animationType="fade"
				onRequestClose={() => setPicker(null)}
			>
				<Pressable
					style={styles.pickerBackdrop}
					onPress={() => setPicker(null)}
				>
					<Pressable style={styles.pickerCard} onPress={() => {}}>
						<Text style={styles.pickerTitle}>
							{t("templates.chooseMealType")}
						</Text>
						<Text style={styles.pickerSubtitle} numberOfLines={1}>
							{picker?.name}
						</Text>
						<View style={styles.pickerGrid}>
							{(["breakfast", "lunch", "snack", "dinner"] as MealType[]).map(
								(m) => (
									<Pressable
										key={m}
										style={({ pressed }) => [
											styles.pickerBtn,
											pressed && styles.pickerBtnPressed,
										]}
										onPress={() => confirmTemplate(m)}
									>
										<Text style={styles.pickerBtnText}>{t(`meal.${m}`)}</Text>
									</Pressable>
								),
							)}
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{undoItems && (
				<Animated.View
					style={[
						styles.undo,
						{
							opacity: undoAnim,
							transform: [
								{
									translateY: undoAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [40, 0],
									}),
								},
							],
						},
					]}
					pointerEvents="box-none"
				>
					<View style={styles.undoInner}>
						<Text style={styles.undoText}>{t("templates.added")}</Text>
						<Pressable onPress={handleUndo} hitSlop={10}>
							<Text style={styles.undoAction}>{t("common.undo")}</Text>
						</Pressable>
					</View>
				</Animated.View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	scroll: { flex: 1 },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	section: { marginBottom: spacing.xl },
	sectionLabel: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	carousel: {
		marginHorizontal: -spacing.xl,
	},
	carouselContent: {
		paddingHorizontal: spacing.xl,
		gap: spacing.sm,
	},
	templateCard: {
		width: 140,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
		borderWidth: 1,
		borderColor: colors.border,
		justifyContent: "space-between",
		minHeight: 110,
	},
	templateCardPressed: {
		backgroundColor: colors.surfaceHover,
		borderColor: colors.primary,
	},
	templateIcon: { fontSize: 22 },
	templateName: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
		color: colors.text,
		marginTop: spacing.xs,
	},
	templateMeta: {
		fontFamily: fonts.regular,
		fontSize: fontSize.xs,
		color: colors.textDim,
		marginTop: spacing.xs,
	},
	recentChip: {
		backgroundColor: colors.surface,
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		maxWidth: 160,
	},
	recentName: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
		color: colors.text,
	},
	recentKcal: {
		fontFamily: fonts.regular,
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
		fontFamily: fonts.semibold,
		fontSize: fontSize.lg,
		color: colors.text,
	},
	modeDesc: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginLeft: "auto",
	},
	recipeLink: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		marginTop: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
	},
	recipeLinkText: {
		flex: 1,
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
		color: colors.text,
	},
	pickerBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		padding: spacing.xl,
	},
	pickerCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.xl,
		borderWidth: 1,
		borderColor: colors.border,
	},
	pickerTitle: {
		fontFamily: fonts.bold,
		fontSize: fontSize.lg,
		color: colors.text,
	},
	pickerSubtitle: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginTop: spacing.xs,
		marginBottom: spacing.lg,
	},
	pickerGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	pickerBtn: {
		flexBasis: "48%",
		flexGrow: 1,
		backgroundColor: colors.background,
		borderRadius: radii.md,
		paddingVertical: spacing.lg,
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.border,
	},
	pickerBtnPressed: {
		borderColor: colors.primary,
		backgroundColor: colors.primaryGlow,
	},
	pickerBtnText: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
		color: colors.text,
	},
	undo: {
		position: "absolute",
		bottom: spacing.xl,
		left: spacing.xl,
		right: spacing.xl,
	},
	undoInner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: colors.surfaceLight,
		borderRadius: radii.md,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
	},
	undoText: {
		fontFamily: fonts.medium,
		fontSize: fontSize.sm,
		color: colors.text,
	},
	undoAction: {
		fontFamily: fonts.bold,
		fontSize: fontSize.sm,
		color: colors.primary,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
});
