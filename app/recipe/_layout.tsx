import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "@/constants/theme";

export default function RecipeLayout() {
	const { t } = useTranslation();
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.background },
				headerTintColor: colors.text,
				headerTitleStyle: { fontFamily: fonts.semibold },
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="index" options={{ title: t("recipes.listTitle") }} />
			<Stack.Screen name="new" options={{ title: t("recipes.newRecipe") }} />
			<Stack.Screen
				name="[id]/edit"
				options={{ title: t("recipes.listTitle") }}
			/>
		</Stack>
	);
}
