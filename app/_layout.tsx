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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import { colors, fonts } from "@/constants/theme";
import { db } from "@/db/client";
import migrations from "@/drizzle/migrations";
import { useScanQueueResolver } from "@/hooks/useScanQueueResolver";
import { getMeta } from "@/lib/app-meta";
import { seedCiqualIfNeeded } from "@/lib/ciqual-seed";
import i18n, { type LanguagePreference, resolveLanguage } from "@/lib/i18n";
import { migrateMacrosIfNeeded } from "@/lib/macro-migration";
import { seedServingPresetsIfNeeded } from "@/lib/serving-service";

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
	const [seedReady, setSeedReady] = useState(false);
	const [seeding, setSeeding] = useState(false);
	useScanQueueResolver();

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
		if (!success) return;
		let cancelled = false;
		(async () => {
			try {
				setSeeding(true);
				await seedCiqualIfNeeded();
				await migrateMacrosIfNeeded();
				await seedServingPresetsIfNeeded();
			} finally {
				if (!cancelled) {
					setSeeding(false);
					setSeedReady(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [success]);

	useEffect(() => {
		if (success && fontsLoaded && seedReady) {
			SplashScreen.hideAsync();
		}
	}, [success, fontsLoaded, seedReady]);

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

	if (seeding && !seedReady) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={colors.primary} size="large" />
				<Text style={styles.loading}>{t("common.preparingFoods")}</Text>
			</View>
		);
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
			<Stack.Screen name="weight/index" options={{ title: t("nav.weight") }} />
			<Stack.Screen
				name="profile/index"
				options={{ title: t("nav.profile") }}
			/>
			<Stack.Screen
				name="food/[id]/edit"
				options={{ title: t("edit.title") }}
			/>
			<Stack.Screen name="recipe" options={{ headerShown: false }} />
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
	loading: {
		color: colors.textMuted,
		fontSize: 14,
		fontFamily: fonts.medium,
		marginTop: 16,
	},
});
