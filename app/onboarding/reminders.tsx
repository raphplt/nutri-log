import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NextButton } from "@/components/NextButton";
import { ProgressBar } from "@/components/ProgressBar";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { finishOnboarding } from "@/lib/onboarding-finish";
import { useOnboarding } from "@/lib/onboarding-store";

type MealType = "breakfast" | "lunch" | "snack" | "dinner";
const MEALS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

export default function RemindersScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data, update } = useOnboarding();
	const [saving, setSaving] = useState(false);

	const toggleReminder = (meal: MealType) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		update({
			reminders: {
				...data.reminders,
				[meal]: {
					...data.reminders[meal],
					enabled: !data.reminders[meal].enabled,
				},
			},
		});
	};

	const hasAnyEnabled = Object.values(data.reminders).some((r) => r.enabled);

	const handleFinish = async () => {
		setSaving(true);
		try {
			if (hasAnyEnabled) {
				const { status } = await Notifications.requestPermissionsAsync();
				if (status !== "granted") {
					Alert.alert(
						t("onboarding.permissionsTitle"),
						t("onboarding.permissionsBody"),
					);
				}
			}

			await finishOnboarding(data);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.replace("/");
		} catch (e) {
			Alert.alert(t("common.error"), String(e));
		} finally {
			setSaving(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe}>
			<ProgressBar current={6} total={6} />
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<Text style={styles.title}>{t("onboarding.remindersTitle")}</Text>
				<Text style={styles.description}>{t("onboarding.remindersDesc")}</Text>

				{MEALS.map((meal) => {
					const r = data.reminders[meal];
					return (
						<View key={meal} style={styles.reminderRow}>
							<View>
								<Text style={styles.mealLabel}>
									{t(`meal.${meal}` as const)}
								</Text>
								<Text style={styles.mealTime}>
									{String(r.hour).padStart(2, "0")}:
									{String(r.minute).padStart(2, "0")}
								</Text>
							</View>
							<Switch
								value={r.enabled}
								onValueChange={() => toggleReminder(meal)}
								trackColor={{ false: colors.border, true: colors.primary }}
								thumbColor={colors.text}
							/>
						</View>
					);
				})}
			</ScrollView>
			<NextButton
				label={saving ? t("common.saving") : t("common.finish")}
				onPress={handleFinish}
				disabled={saving}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	scroll: { flex: 1 },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	title: {
		fontSize: fontSize.xxl,
		fontWeight: "700",
		color: colors.text,
		marginBottom: spacing.sm,
	},
	description: {
		fontSize: fontSize.md,
		color: colors.textMuted,
		marginBottom: spacing.xl,
	},
	reminderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		marginBottom: spacing.sm,
	},
	mealLabel: {
		fontSize: fontSize.lg,
		fontWeight: "600",
		color: colors.text,
	},
	mealTime: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginTop: 2,
	},
});
