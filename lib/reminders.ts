import * as Notifications from "expo-notifications";
import i18n from "@/lib/i18n";

interface ReminderConfig {
	mealType: string;
	enabled: boolean;
	hour: number;
	minute: number;
}

export async function scheduleAllReminders(settings: ReminderConfig[]) {
	await Notifications.cancelAllScheduledNotificationsAsync();

	for (const s of settings) {
		if (!s.enabled) continue;

		const title = i18n.t(`meal.${s.mealType}` as const, {
			defaultValue: s.mealType,
		});
		const bodyLabel = i18n.t(`meal.${s.mealType}_lower` as const, {
			defaultValue: s.mealType,
		});

		await Notifications.scheduleNotificationAsync({
			content: {
				title,
				body: i18n.t("reminders.body", { label: bodyLabel }),
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DAILY,
				hour: s.hour,
				minute: s.minute,
			},
		});
	}
}

export async function requestNotificationPermissions(): Promise<boolean> {
	const { status: existing } = await Notifications.getPermissionsAsync();
	if (existing === "granted") return true;

	const { status } = await Notifications.requestPermissionsAsync({
		ios: { allowAlert: true, allowBadge: true, allowSound: true },
	});
	return status === "granted";
}
