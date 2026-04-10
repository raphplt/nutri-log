import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { MealWithItems } from '@/hooks/useDailyMeals';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Goûter',
  dinner: 'Dîner',
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍎',
  dinner: '🌙',
};

interface Props {
  meals: MealWithItems[];
}

export function MealTimeline({ meals }: Props) {
  if (meals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun repas enregistré</Text>
        <Text style={styles.emptyHint}>Appuie sur + pour commencer</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </View>
  );
}

function MealCard({ meal }: { meal: MealWithItems }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const icon = MEAL_ICONS[meal.mealType] ?? '🍽️';
  const label = MEAL_LABELS[meal.mealType] ?? meal.mealType;

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      onLongPress={() => router.push(`/meal/${meal.id}`)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.mealIcon}>{icon}</Text>
        <Text style={styles.mealLabel}>{label}</Text>
        <Text style={styles.mealKcal}>{Math.round(meal.totalKcal)} kcal</Text>
      </View>

      {expanded &&
        meal.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemDetail}>
              {Math.round(item.quantityG)}g · {Math.round(item.kcal)} kcal
            </Text>
          </View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  mealKcal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginLeft: 32,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  itemDetail: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginLeft: spacing.sm,
  },
});
