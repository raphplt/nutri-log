import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors } from "@/constants/theme";

export default function TabLayout() {
	const { t } = useTranslation();
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
				},
				headerStyle: { backgroundColor: colors.background },
				headerTintColor: colors.text,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: t("nav.dashboard"),
					tabBarIcon: ({ color }) => (
						<FontAwesome name="home" size={24} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: t("nav.settings"),
					tabBarIcon: ({ color }) => (
						<FontAwesome name="cog" size={24} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
