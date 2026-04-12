import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { RecipeEditor } from "@/components/RecipeEditor";
import { colors, fontSize } from "@/constants/theme";
import { getActiveDraft, setActiveDraft } from "@/lib/recipe-draft";
import { getRecipe } from "@/lib/recipe-service";

export default function EditRecipeScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [ready, setReady] = useState(false);
	const [notFound, setNotFound] = useState(false);
	const [title, setTitle] = useState("");

	useEffect(() => {
		let cancelled = false;
		const existing = getActiveDraft();
		if (existing && existing.id === id) {
			setTitle(existing.name);
			setReady(true);
			return;
		}
		(async () => {
			const recipe = await getRecipe(id);
			if (cancelled) return;
			if (!recipe) {
				setNotFound(true);
				setReady(true);
				return;
			}
			setActiveDraft({
				id: recipe.id,
				name: recipe.name,
				kind: recipe.kind as "template" | "recipe",
				totalWeightG: recipe.totalWeightG,
				servingsDefault: recipe.servingsDefault,
				imageUrl: recipe.imageUrl,
				notes: recipe.notes,
				items: recipe.items.map((it) => ({
					foodId: it.foodId,
					name: it.name,
					quantityG: it.quantityG,
					kcal: it.kcal,
					protein: it.protein,
					carbs: it.carbs,
					fat: it.fat,
					fiber: it.fiber,
				})),
			});
			setTitle(recipe.name);
			setReady(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);

	if (!ready) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={colors.primary} />
			</View>
		);
	}

	if (notFound) {
		return (
			<View style={styles.center}>
				<Text style={styles.notFound}>{t("notFound.title")}</Text>
			</View>
		);
	}

	return (
		<>
			<Stack.Screen options={{ title: title || t("recipes.listTitle") }} />
			<RecipeEditor mode="edit" />
		</>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.background,
	},
	notFound: { color: colors.textMuted, fontSize: fontSize.md },
});
