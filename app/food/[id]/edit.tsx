import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { colors, fontSize, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { foods } from "@/db/schema";
import type { FoodRow } from "@/lib/food-service";

export default function EditFoodScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [food, setFood] = useState<FoodRow | null>(null);
	const [kcal, setKcal] = useState(0);
	const [protein, setProtein] = useState(0);
	const [carbs, setCarbs] = useState(0);
	const [fat, setFat] = useState(0);
	const [fiber, setFiber] = useState(0);
	const [servingG, setServingG] = useState(100);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!id) return;
		db.select()
			.from(foods)
			.where(eq(foods.id, id))
			.limit(1)
			.then(([row]) => {
				if (row) {
					setFood(row);
					setKcal(row.kcalPer100g);
					setProtein(row.proteinPer100g);
					setCarbs(row.carbsPer100g);
					setFat(row.fatPer100g);
					setFiber(row.fiberPer100g ?? 0);
					setServingG(row.defaultServingG ?? 100);
				}
			});
	}, [id]);

	if (!food) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={colors.primary} />
			</View>
		);
	}

	const handleSave = async () => {
		setSaving(true);
		await db
			.update(foods)
			.set({
				source: food.source === "off" ? "off-edited" : food.source,
				kcalPer100g: kcal,
				proteinPer100g: protein,
				carbsPer100g: carbs,
				fatPer100g: fat,
				fiberPer100g: fiber || null,
				defaultServingG: servingG,
			})
			.where(eq(foods.id, food.id));
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.back();
	};

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<Text style={styles.title}>{t("edit.title")}</Text>
			<Text style={styles.subtitle}>{food.name}</Text>

			<NumericInput
				label={t("edit.kcalLabel")}
				value={kcal}
				onChangeValue={setKcal}
				min={0}
				max={900}
				decimal
			/>
			<NumericInput
				label={t("edit.proteinLabel")}
				value={protein}
				onChangeValue={setProtein}
				min={0}
				max={100}
				decimal
			/>
			<NumericInput
				label={t("edit.carbsLabel")}
				value={carbs}
				onChangeValue={setCarbs}
				min={0}
				max={100}
				decimal
			/>
			<NumericInput
				label={t("edit.fatLabel")}
				value={fat}
				onChangeValue={setFat}
				min={0}
				max={100}
				decimal
			/>
			<NumericInput
				label={t("edit.fiberLabel")}
				value={fiber}
				onChangeValue={setFiber}
				min={0}
				max={100}
				decimal
			/>
			<NumericInput
				label={t("edit.servingLabel")}
				value={servingG}
				onChangeValue={setServingG}
				min={1}
				max={1000}
			/>

			<NextButton
				label={saving ? t("common.saving") : t("common.save")}
				onPress={handleSave}
				disabled={saving}
			/>
		</ScrollView>
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
	title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
	subtitle: {
		fontSize: fontSize.md,
		color: colors.textMuted,
		marginBottom: spacing.xl,
	},
});
