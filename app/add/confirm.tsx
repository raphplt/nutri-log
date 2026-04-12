import Slider from "@react-native-community/slider";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { FoodQualityBadges } from "@/components/FoodQualityBadges";
import { NextButton } from "@/components/NextButton";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { foods } from "@/db/schema";
import { todayString } from "@/lib/date";
import type { FoodRow } from "@/lib/food-service";
import { addMealItem, guessMealType } from "@/lib/meal-service";
import { type FoodServingRow, getServingsForFood } from "@/lib/serving-service";

function isFoodIncomplete(food: FoodRow): boolean {
	return (
		food.source === "off" &&
		(food.kcalPer100g === 0 ||
			food.proteinPer100g === 0 ||
			food.carbsPer100g === 0)
	);
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export default function ConfirmScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const params = useLocalSearchParams<{ foodId?: string; foodJson?: string }>();
	const [food, setFood] = useState<FoodRow | null>(null);
	const [servings, setServings] = useState<FoodServingRow[]>([]);
	const [selectedServingId, setSelectedServingId] = useState<number | "custom">(
		"custom",
	);
	const [multiplier, setMultiplier] = useState(1);
	const [customQuantity, setCustomQuantity] = useState(100);
	const [mealType, setMealType] = useState<MealType>(guessMealType());
	const [saving, setSaving] = useState(false);

	const mealOptions: { value: MealType; label: string }[] = [
		{ value: "breakfast", label: t("meal.breakfast") },
		{ value: "lunch", label: t("meal.lunch") },
		{ value: "snack", label: t("meal.snack") },
		{ value: "dinner", label: t("meal.dinner") },
	];

	useEffect(() => {
		let foodId: string | null = null;
		if (params.foodJson) {
			const parsed = JSON.parse(params.foodJson) as FoodRow;
			setFood(parsed);
			setCustomQuantity(parsed.defaultServingG ?? 100);
			foodId = parsed.id;
		} else if (params.foodId) {
			db.select()
				.from(foods)
				.where(eq(foods.id, params.foodId))
				.limit(1)
				.then(([row]) => {
					if (row) {
						setFood(row);
						setCustomQuantity(row.defaultServingG ?? 100);
					}
				});
			foodId = params.foodId;
		}
		if (foodId) {
			getServingsForFood(foodId).then((rows) => {
				setServings(rows);
				const def = rows.find((r) => r.isDefault) ?? rows[0];
				if (def) setSelectedServingId(def.id);
			});
		}
	}, [params.foodId, params.foodJson]);

	const selectedServing = useMemo(
		() =>
			typeof selectedServingId === "number"
				? (servings.find((s) => s.id === selectedServingId) ?? null)
				: null,
		[servings, selectedServingId],
	);

	const quantity =
		selectedServing != null
			? selectedServing.grams * multiplier
			: customQuantity;

	if (!food) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={colors.primary} />
			</View>
		);
	}

	const factor = quantity / 100;
	const kcal = Math.round(food.kcalPer100g * factor);
	const protein = Math.round(food.proteinPer100g * factor);
	const carbs = Math.round(food.carbsPer100g * factor);
	const fat = Math.round(food.fatPer100g * factor);
	const fiber = food.fiberPer100g
		? Math.round(food.fiberPer100g * factor)
		: null;

	const selectServing = (id: number | "custom") => {
		Haptics.selectionAsync();
		setSelectedServingId(id);
		if (typeof id === "number") setMultiplier(1);
	};

	const handleAdd = async () => {
		setSaving(true);
		await addMealItem({
			date: todayString(),
			mealType,
			foodId: food.id,
			servingId:
				typeof selectedServingId === "number" ? selectedServingId : null,
			name: food.name,
			quantityG: quantity,
			kcal,
			protein,
			carbs,
			fat,
			fiber,
		});

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.dismiss();
	};

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<View style={styles.header}>
				{food.imageUrl && (
					<Image
						source={{ uri: food.imageUrl }}
						style={styles.image}
						contentFit="cover"
						cachePolicy="memory-disk"
						transition={200}
					/>
				)}
				<View style={styles.headerText}>
					<Text style={styles.foodName}>{food.name}</Text>
					{food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
					<View style={styles.badgesRow}>
						<FoodQualityBadges
							nutriscoreGrade={food.nutriscoreGrade}
							novaGroup={food.novaGroup}
						/>
					</View>
				</View>
			</View>

			{isFoodIncomplete(food) && (
				<Pressable
					onPress={() =>
						router.push({
							pathname: "/food/[id]/edit",
							params: { id: food.id },
						})
					}
					style={styles.incompleteBanner}
				>
					<Text style={styles.incompleteText}>
						{t("confirm.incompleteData")}
					</Text>
					<Text style={styles.incompleteAction}>{t("confirm.editData")}</Text>
				</Pressable>
			)}

			<View style={styles.portionSection}>
				<Text style={styles.sectionLabel}>{t("confirm.portion")}</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.portionRow}
				>
					{servings.map((s) => (
						<Pressable
							key={s.id}
							onPress={() => selectServing(s.id)}
							style={[
								styles.portionChip,
								selectedServingId === s.id && styles.portionChipSelected,
							]}
						>
							<Text
								style={[
									styles.portionChipText,
									selectedServingId === s.id && styles.portionChipTextSelected,
								]}
								numberOfLines={1}
							>
								{s.label}
							</Text>
						</Pressable>
					))}
					<Pressable
						onPress={() => selectServing("custom")}
						style={[
							styles.portionChip,
							selectedServingId === "custom" && styles.portionChipSelected,
						]}
					>
						<Text
							style={[
								styles.portionChipText,
								selectedServingId === "custom" &&
									styles.portionChipTextSelected,
							]}
						>
							{t("confirm.portionCustom")}
						</Text>
					</Pressable>
				</ScrollView>
			</View>

			<View style={styles.quantitySection}>
				<Text style={styles.quantityLabel}>{t("confirm.quantity")}</Text>
				<Text style={styles.quantityValue}>
					{Math.round(quantity)}
					{t("common.grams")}
				</Text>
				{selectedServing ? (
					<>
						<Slider
							style={styles.slider}
							value={multiplier}
							onValueChange={setMultiplier}
							minimumValue={0.25}
							maximumValue={5}
							step={0.25}
							minimumTrackTintColor={colors.primary}
							maximumTrackTintColor={colors.border}
							thumbTintColor={colors.primary}
						/>
						<Text style={styles.multiplierHint}>×{multiplier.toFixed(2)}</Text>
					</>
				) : (
					<Slider
						style={styles.slider}
						value={customQuantity}
						onValueChange={setCustomQuantity}
						minimumValue={10}
						maximumValue={500}
						step={5}
						minimumTrackTintColor={colors.primary}
						maximumTrackTintColor={colors.border}
						thumbTintColor={colors.primary}
					/>
				)}
			</View>

			<View style={styles.macroGrid}>
				<MacroCell
					label={t("macro.calories")}
					value={`${kcal}`}
					unit={t("common.kcal")}
				/>
				<MacroCell
					label={t("macro.protein")}
					value={`${protein}`}
					unit={t("common.grams")}
				/>
				<MacroCell
					label={t("macro.carbs")}
					value={`${carbs}`}
					unit={t("common.grams")}
				/>
				<MacroCell
					label={t("macro.fat")}
					value={`${fat}`}
					unit={t("common.grams")}
				/>
			</View>

			<Text style={styles.sectionLabel}>{t("confirm.mealType")}</Text>
			<View style={styles.mealGrid}>
				{mealOptions.map((m) => (
					<SelectCard
						key={m.value}
						title={m.label}
						selected={mealType === m.value}
						onPress={() => setMealType(m.value)}
					/>
				))}
			</View>

			<NextButton
				label={saving ? t("common.adding") : t("common.add")}
				onPress={handleAdd}
				disabled={saving}
			/>
		</ScrollView>
	);
}

function MacroCell({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit: string;
}) {
	return (
		<View style={styles.macroCell}>
			<Text style={styles.macroCellValue}>{value}</Text>
			<Text style={styles.macroCellUnit}>{unit}</Text>
			<Text style={styles.macroCellLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.xl,
		gap: spacing.lg,
	},
	image: {
		width: 64,
		height: 64,
		borderRadius: radii.sm,
		backgroundColor: colors.surface,
	},
	headerText: { flex: 1 },
	foodName: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
	foodBrand: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 2 },
	quantitySection: { marginBottom: spacing.xl },
	quantityLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	quantityValue: {
		fontSize: fontSize.xxl,
		fontWeight: "700",
		color: colors.text,
		textAlign: "center",
		marginVertical: spacing.sm,
	},
	slider: { width: "100%", height: 40 },
	macroGrid: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.xl,
	},
	macroCell: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
		alignItems: "center",
	},
	macroCellValue: {
		fontSize: fontSize.lg,
		fontWeight: "700",
		color: colors.text,
	},
	macroCellUnit: { fontSize: fontSize.xs, color: colors.textDim },
	macroCellLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	sectionLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	mealGrid: { marginBottom: spacing.xl },
	portionSection: { marginBottom: spacing.lg },
	portionRow: { gap: spacing.sm, paddingVertical: spacing.xs },
	portionChip: {
		backgroundColor: colors.surface,
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
		maxWidth: 200,
	},
	portionChipSelected: {
		borderColor: colors.primary,
		backgroundColor: `${colors.primary}15`,
	},
	portionChipText: {
		color: colors.textMuted,
		fontSize: fontSize.sm,
		fontWeight: "600",
	},
	portionChipTextSelected: { color: colors.primaryLight },
	multiplierHint: {
		textAlign: "center",
		color: colors.textMuted,
		fontSize: fontSize.sm,
		marginTop: spacing.xs,
	},
	badgesRow: { marginTop: spacing.xs },
	incompleteBanner: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: `${colors.warning}20`,
		borderWidth: 1,
		borderColor: `${colors.warning}60`,
		borderRadius: radii.md,
		padding: spacing.md,
		marginBottom: spacing.lg,
	},
	incompleteText: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
	incompleteAction: {
		color: colors.warning,
		fontSize: fontSize.sm,
		fontWeight: "700",
	},
});
