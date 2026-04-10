import * as Notifications from 'expo-notifications';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'petit-déjeuner',
  lunch: 'déjeuner',
  snack: 'goûter',
  dinner: 'dîner',
};

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

    const label = MEAL_LABELS[s.mealType] ?? s.mealType;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${label.charAt(0).toUpperCase() + label.slice(1)}`,
        body: `N'oublie pas de logger ton ${label} !`,
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
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}
