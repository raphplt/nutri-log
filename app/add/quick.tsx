import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { todayString } from "@/lib/date";
import { addMealItem, guessMealType } from "@/lib/meal-service";

export default function QuickAddScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [name, setName] = useState("");
	const [kcal, setKcal] = useState(0);
	const [protein, setProtein] = useState(0);
	const [carbs, setCarbs] = useState(0);
	const [fat, setFat] = useState(0);

	const handleAdd = async () => {
		if (kcal <= 0) {
			Alert.alert(t("common.error"), t("quick.kcalRequired"));
			return;
		}

		await addMealItem({
			date: todayString(),
			mealType: guessMealType(),
			foodId: null,
			name: name || t("quick.defaultName"),
			quantityG: 0,
			kcal,
			protein,
			carbs,
			fat,
		});

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		router.dismiss();
	};

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<Text style={styles.label}>{t("quick.nameLabel")}</Text>
			<TextInput
				style={styles.nameInput}
				placeholder={t("quick.namePlaceholder")}
				placeholderTextColor={colors.textDim}
				value={name}
				onChangeText={setName}
			/>

			<NumericInput
				label={t("macro.calories")}
				value={kcal}
				onChangeValue={setKcal}
				unit={t("common.kcal")}
				min={0}
				max={9999}
			/>
			<NumericInput
				label={t("macro.protein")}
				value={protein}
				onChangeValue={setProtein}
				unit={t("common.grams")}
				min={0}
				max={999}
			/>
			<NumericInput
				label={t("macro.carbs")}
				value={carbs}
				onChangeValue={setCarbs}
				unit={t("common.grams")}
				min={0}
				max={999}
			/>
			<NumericInput
				label={t("macro.fat")}
				value={fat}
				onChangeValue={setFat}
				unit={t("common.grams")}
				min={0}
				max={999}
			/>

			<NextButton
				label={t("common.add")}
				onPress={handleAdd}
				disabled={kcal <= 0}
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	label: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.xs,
	},
	nameInput: {
		backgroundColor: colors.surface,
		borderRadius: radii.sm,
		padding: spacing.md,
		fontSize: fontSize.lg,
		color: colors.text,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.xl,
	},
});
