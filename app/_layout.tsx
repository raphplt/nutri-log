import "@/lib/i18n";
import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
	useFonts,
} from "@expo-google-fonts/inter";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import { colors, fonts } from "@/constants/theme";
import { db } from "@/db/client";
import migrations from "@/drizzle/migrations";
import { getMeta } from "@/lib/app-meta";
import i18n, { type LanguagePreference, resolveLanguage } from "@/lib/i18n";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const { t } = useTranslation();
	const { success, error } = useMigrations(db, migrations);
	const [fontsLoaded] = useFonts({
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
	});

	useEffect(() => {
		if (!success) return;
		let cancelled = false;
		(async () => {
			const stored = ((await getMeta("language")) ??
				"auto") as LanguagePreference;
			if (!cancelled) {
				await i18n.changeLanguage(resolveLanguage(stored));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [success]);

	useEffect(() => {
		if (success && fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [success, fontsLoaded]);

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={styles.error}>
					{t("common.dbError", { message: error.message })}
				</Text>
			</View>
		);
	}

	if (!success || !fontsLoaded) {
		return null;
	}

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.background },
				headerTintColor: colors.text,
				headerTitleStyle: { fontFamily: fonts.semibold },
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen name="onboarding" options={{ headerShown: false }} />
			<Stack.Screen
				name="add"
				options={{ presentation: "modal", headerShown: false }}
			/>
			<Stack.Screen name="meal/[id]" options={{ title: t("nav.meal") }} />
			<Stack.Screen name="weight" options={{ title: t("nav.weight") }} />
			<Stack.Screen name="profile" options={{ title: t("nav.profile") }} />
		</Stack>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},
	error: {
		color: colors.danger,
		fontSize: 16,
		fontFamily: fonts.medium,
	},
});
