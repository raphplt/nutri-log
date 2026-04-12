import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "@/constants/theme";

export default function StatsLayout() {
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
			<Stack.Screen
				name="calories"
				options={{ title: t("stats.calories.title") }}
			/>
			<Stack.Screen
				name="macros"
				options={{ title: t("stats.macros.title") }}
			/>
			<Stack.Screen
				name="weight"
				options={{ title: t("stats.weight.title") }}
			/>
			<Stack.Screen
				name="habits"
				options={{ title: t("stats.habits.title") }}
			/>
		</Stack>
	);
}
