import Slider from "@react-native-community/slider";
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
import { NextButton } from "@/components/NextButton";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { todayString } from "@/lib/date";
import { guessMealType } from "@/lib/meal-service";
import {
	computeRecipeTotals,
	getRecipe,
	logRecipeAsMealItem,
	type RecipeTotals,
	type RecipeWithItems,
	scaleToGrams,
	servingsToGrams,
} from "@/lib/recipe-service";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type Unit = "grams" | "servings";

export default function RecipeConfirmScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { recipeId } = useLocalSearchParams<{ recipeId: string }>();

	const [recipe, setRecipe] = useState<RecipeWithItems | null>(null);
	const [totals, setTotals] = useState<RecipeTotals | null>(null);
	const [unit, setUnit] = useState<Unit>("grams");
	const [grams, setGrams] = useState(100);
	const [servings, setServings] = useState(1);
	const [mealType, setMealType] = useState<MealType>(guessMealType());
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!recipeId) return;
		getRecipe(recipeId).then((r) => {
			if (!r) return;
			setRecipe(r);
			const t = computeRecipeTotals(r.items);
			setTotals(t);
			const hasServings =
				r.servingsDefault != null &&
				r.servingsDefault > 0 &&
				r.totalWeightG != null &&
				r.totalWeightG > 0;
			if (hasServings && r.totalWeightG && r.servingsDefault) {
				setUnit("servings");
				setServings(1);
				setGrams(Math.round(r.totalWeightG / r.servingsDefault));
			} else {
				setUnit("grams");
				setGrams(
					r.totalWeightG && r.totalWeightG > 0
						? Math.round(r.totalWeightG / 4)
						: 200,
				);
			}
		});
	}, [recipeId]);

	const quantityG = useMemo(() => {
		if (!recipe) return grams;
		if (unit === "servings") {
			return servingsToGrams(recipe, servings) ?? grams;
		}
		return grams;
	}, [unit, grams, servings, recipe]);

	const scaled = useMemo(() => {
		if (!totals || !recipe) return null;
		return scaleToGrams(totals, recipe.totalWeightG, quantityG);
	}, [totals, recipe, quantityG]);

	if (!recipe || !totals || !scaled) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={colors.primary} />
			</View>
		);
	}

	const canUseServings =
		recipe.servingsDefault != null &&
		recipe.servingsDefault > 0 &&
		recipe.totalWeightG != null &&
		recipe.totalWeightG > 0;

	const mealOptions: { value: MealType; label: string }[] = [
		{ value: "breakfast", label: t("meal.breakfast") },
		{ value: "lunch", label: t("meal.lunch") },
		{ value: "snack", label: t("meal.snack") },
		{ value: "dinner", label: t("meal.dinner") },
	];

	const handleAdd = async () => {
		setSaving(true);
		try {
			await logRecipeAsMealItem({
				recipeId: recipe.id,
				date: todayString(),
				mealType,
				quantityG,
				servings: unit === "servings" ? servings : null,
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.dismiss();
		} finally {
			setSaving(false);
		}
	};

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<View style={styles.header}>
				{recipe.imageUrl ? (
					<Image
						source={{ uri: recipe.imageUrl }}
						style={styles.image}
						contentFit="cover"
						cachePolicy="memory-disk"
					/>
				) : (
					<View style={[styles.image, styles.imagePlaceholder]}>
						<Text style={styles.imageEmoji}>🍲</Text>
					</View>
				)}
				<View style={styles.headerText}>
					<Text style={styles.recipeName}>{recipe.name}</Text>
					<Text style={styles.recipeMeta}>
						{Math.round(totals.kcal)} {t("common.kcal")} · {recipe.items.length}{" "}
						{recipe.items.length === 1
							? t("templates.items", { count: recipe.items.length })
							: t("templates.items_other", { count: recipe.items.length })}
					</Text>
				</View>
			</View>

			{canUseServings && (
				<View style={styles.toggleRow}>
					<Pressable
						onPress={() => {
							Haptics.selectionAsync();
							setUnit("grams");
						}}
						style={[
							styles.toggleBtn,
							unit === "grams" && styles.toggleBtnActive,
						]}
					>
						<Text
							style={[
								styles.toggleText,
								unit === "grams" && styles.toggleTextActive,
							]}
						>
							{t("recipes.unitGrams")}
						</Text>
					</Pressable>
					<Pressable
						onPress={() => {
							Haptics.selectionAsync();
							setUnit("servings");
						}}
						style={[
							styles.toggleBtn,
							unit === "servings" && styles.toggleBtnActive,
						]}
					>
						<Text
							style={[
								styles.toggleText,
								unit === "servings" && styles.toggleTextActive,
							]}
						>
							{servings === 1
								? t("recipes.unitServings_one")
								: t("recipes.unitServings")}
						</Text>
					</Pressable>
				</View>
			)}

			<View style={styles.quantitySection}>
				<Text style={styles.quantityLabel}>{t("confirm.quantity")}</Text>
				{unit === "grams" ? (
					<>
						<Text style={styles.quantityValue}>
							{Math.round(grams)}
							{t("common.grams")}
						</Text>
						<Slider
							style={styles.slider}
							value={grams}
							onValueChange={setGrams}
							minimumValue={25}
							maximumValue={Math.max(1000, (recipe.totalWeightG ?? 500) * 1.2)}
							step={5}
							minimumTrackTintColor={colors.primary}
							maximumTrackTintColor={colors.border}
							thumbTintColor={colors.primary}
						/>
					</>
				) : (
					<>
						<Text style={styles.quantityValue}>
							{servings.toFixed(servings % 1 === 0 ? 0 : 2)}{" "}
							{servings === 1
								? t("recipes.unitServings_one")
								: t("recipes.unitServings")}
						</Text>
						<Text style={styles.quantityDetail}>
							≈ {Math.round(quantityG)}
							{t("common.grams")}
						</Text>
						<Slider
							style={styles.slider}
							value={servings}
							onValueChange={setServings}
							minimumValue={0.25}
							maximumValue={Math.max((recipe.servingsDefault ?? 1) * 2, 4)}
							step={0.25}
							minimumTrackTintColor={colors.primary}
							maximumTrackTintColor={colors.border}
							thumbTintColor={colors.primary}
						/>
					</>
				)}
			</View>

			<View style={styles.macroGrid}>
				<MacroCell
					label={t("macro.calories")}
					value={`${Math.round(scaled.kcal)}`}
					unit={t("common.kcal")}
				/>
				<MacroCell
					label={t("macro.protein")}
					value={`${Math.round(scaled.protein)}`}
					unit={t("common.grams")}
				/>
				<MacroCell
					label={t("macro.carbs")}
					value={`${Math.round(scaled.carbs)}`}
					unit={t("common.grams")}
				/>
				<MacroCell
					label={t("macro.fat")}
					value={`${Math.round(scaled.fat)}`}
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
		gap: spacing.lg,
		marginBottom: spacing.xl,
	},
	image: {
		width: 64,
		height: 64,
		borderRadius: radii.md,
		backgroundColor: colors.surface,
	},
	imagePlaceholder: { alignItems: "center", justifyContent: "center" },
	imageEmoji: { fontSize: 32 },
	headerText: { flex: 1 },
	recipeName: {
		fontFamily: fonts.bold,
		fontSize: fontSize.xl,
		color: colors.text,
	},
	recipeMeta: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginTop: 4,
	},
	toggleRow: {
		flexDirection: "row",
		backgroundColor: colors.surface,
		borderRadius: radii.pill,
		padding: 4,
		marginBottom: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
	},
	toggleBtn: {
		flex: 1,
		paddingVertical: spacing.sm,
		alignItems: "center",
		borderRadius: radii.pill,
	},
	toggleBtnActive: {
		backgroundColor: colors.primary,
	},
	toggleText: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
		color: colors.textMuted,
	},
	toggleTextActive: {
		color: colors.textInverse,
	},
	quantitySection: { marginBottom: spacing.xl },
	quantityLabel: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	quantityValue: {
		fontFamily: fonts.bold,
		fontSize: fontSize.xxl,
		color: colors.text,
		textAlign: "center",
		marginVertical: spacing.sm,
	},
	quantityDetail: {
		fontFamily: fonts.regular,
		textAlign: "center",
		color: colors.textMuted,
		fontSize: fontSize.sm,
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
		fontFamily: fonts.bold,
		fontSize: fontSize.lg,
		color: colors.text,
	},
	macroCellUnit: { fontSize: fontSize.xs, color: colors.textDim },
	macroCellLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	sectionLabel: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	mealGrid: { marginBottom: spacing.xl },
});
