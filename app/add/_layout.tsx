import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@/constants/theme";

export default function AddLayout() {
	const { t } = useTranslation();
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.background },
				headerTintColor: colors.text,
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="index" options={{ title: t("nav.add") }} />
			<Stack.Screen
				name="scan"
				options={{ title: t("nav.scan"), headerShown: false }}
			/>
			<Stack.Screen name="search" options={{ title: t("nav.search") }} />
			<Stack.Screen name="quick" options={{ title: t("nav.quick") }} />
			<Stack.Screen name="confirm" options={{ title: t("nav.confirm") }} />
			<Stack.Screen
				name="recipe-confirm"
				options={{ title: t("nav.confirm") }}
			/>
		</Stack>
	);
}
