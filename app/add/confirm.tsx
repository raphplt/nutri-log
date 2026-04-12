import Slider from "@react-native-community/slider";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { NextButton } from "@/components/NextButton";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { foods } from "@/db/schema";
import { todayString } from "@/lib/date";
import type { FoodRow } from "@/lib/food-service";
import { addMealItem, guessMealType } from "@/lib/meal-service";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export default function ConfirmScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const params = useLocalSearchParams<{ foodId?: string; foodJson?: string }>();
	const [food, setFood] = useState<FoodRow | null>(null);
	const [quantity, setQuantity] = useState(100);
	const [mealType, setMealType] = useState<MealType>(guessMealType());
	const [saving, setSaving] = useState(false);

	const mealOptions: { value: MealType; label: string }[] = [
		{ value: "breakfast", label: t("meal.breakfast") },
		{ value: "lunch", label: t("meal.lunch") },
		{ value: "snack", label: t("meal.snack") },
		{ value: "dinner", label: t("meal.dinner") },
	];

	useEffect(() => {
		if (params.foodJson) {
			const parsed = JSON.parse(params.foodJson) as FoodRow;
			setFood(parsed);
			setQuantity(parsed.defaultServingG ?? 100);
		} else if (params.foodId) {
			db.select()
				.from(foods)
				.where(eq(foods.id, params.foodId))
				.limit(1)
				.then(([row]) => {
					if (row) {
						setFood(row);
						setQuantity(row.defaultServingG ?? 100);
					}
				});
		}
	}, [params.foodId, params.foodJson]);

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

	const handleAdd = async () => {
		setSaving(true);
		await addMealItem({
			date: todayString(),
			mealType,
			foodId: food.id,
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
					<Image source={{ uri: food.imageUrl }} style={styles.image} />
				)}
				<View style={styles.headerText}>
					<Text style={styles.foodName}>{food.name}</Text>
					{food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
				</View>
			</View>

			<View style={styles.quantitySection}>
				<Text style={styles.quantityLabel}>{t("confirm.quantity")}</Text>
				<Text style={styles.quantityValue}>
					{Math.round(quantity)}
					{t("common.grams")}
				</Text>
				<Slider
					style={styles.slider}
					value={quantity}
					onValueChange={setQuantity}
					minimumValue={10}
					maximumValue={500}
					step={5}
					minimumTrackTintColor={colors.primary}
					maximumTrackTintColor={colors.border}
					thumbTintColor={colors.primary}
				/>
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
});
