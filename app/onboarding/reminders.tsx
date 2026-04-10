import { useState } from 'react';
import { Text, View, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/lib/onboarding-store';
import { ProgressBar } from '@/components/ProgressBar';
import { NextButton } from '@/components/NextButton';
import { finishOnboarding } from '@/lib/onboarding-finish';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Goûter',
  dinner: 'Dîner',
};

export default function RemindersScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const toggleReminder = (meal: MealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update({
      reminders: {
        ...data.reminders,
        [meal]: { ...data.reminders[meal], enabled: !data.reminders[meal].enabled },
      },
    });
  };

  const hasAnyEnabled = Object.values(data.reminders).some((r) => r.enabled);

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (hasAnyEnabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissions', 'Les notifications ne sont pas activées. Tu pourras les activer plus tard dans les réglages.');
        }
      }

      await finishOnboarding(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar current={6} total={6} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Rappels</Text>
        <Text style={styles.description}>
          Active des rappels pour ne pas oublier de logger tes repas.
        </Text>

        {(Object.keys(MEAL_LABELS) as MealType[]).map((meal) => {
          const r = data.reminders[meal];
          return (
            <View key={meal} style={styles.reminderRow}>
              <View>
                <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>
                <Text style={styles.mealTime}>
                  {String(r.hour).padStart(2, '0')}:{String(r.minute).padStart(2, '0')}
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
        label={saving ? 'Enregistrement...' : 'Terminer'}
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
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  mealLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  mealTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
