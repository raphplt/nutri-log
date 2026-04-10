import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { db } from '@/db/client';
import { foods } from '@/db/schema';
import { addMealItem, guessMealType } from '@/lib/meal-service';
import { todayString } from '@/lib/date';
import { SelectCard } from '@/components/SelectCard';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing, radii } from '@/constants/theme';
import type { FoodRow } from '@/lib/food-service';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Goûter' },
  { value: 'dinner', label: 'Dîner' },
];

export default function ConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ foodId?: string; foodJson?: string }>();
  const [food, setFood] = useState<FoodRow | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState<MealType>(guessMealType());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.foodJson) {
      const parsed = JSON.parse(params.foodJson) as FoodRow;
      setFood(parsed);
      setQuantity(parsed.defaultServingG ?? 100);
    } else if (params.foodId) {
      db.select()
        .from(foods)
        .where(eq(foods.id, params.foodId))
        .limit(1)
        .then(([row]) => {
          if (row) {
            setFood(row);
            setQuantity(row.defaultServingG ?? 100);
          }
        });
    }
  }, [params.foodId, params.foodJson]);

  if (!food) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const factor = quantity / 100;
  const kcal = Math.round(food.kcalPer100g * factor);
  const protein = Math.round(food.proteinPer100g * factor);
  const carbs = Math.round(food.carbsPer100g * factor);
  const fat = Math.round(food.fatPer100g * factor);
  const fiber = food.fiberPer100g ? Math.round(food.fiberPer100g * factor) : null;

  const handleAdd = async () => {
    setSaving(true);
    await addMealItem({
      date: todayString(),
      mealType,
      foodId: food.id,
      name: food.name,
      quantityG: quantity,
      kcal,
      protein,
      carbs,
      fat,
      fiber,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismiss();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Food header */}
      <View style={styles.header}>
        {food.imageUrl && (
          <Image source={{ uri: food.imageUrl }} style={styles.image} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
        </View>
      </View>

      {/* Quantity slider */}
      <View style={styles.quantitySection}>
        <Text style={styles.quantityLabel}>QUANTITÉ</Text>
        <Text style={styles.quantityValue}>{Math.round(quantity)}g</Text>
        <Slider
          style={styles.slider}
          value={quantity}
          onValueChange={setQuantity}
          minimumValue={10}
          maximumValue={500}
          step={5}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* Macros preview */}
      <View style={styles.macroGrid}>
        <MacroCell label="Calories" value={`${kcal}`} unit="kcal" />
        <MacroCell label="Protéines" value={`${protein}`} unit="g" />
        <MacroCell label="Glucides" value={`${carbs}`} unit="g" />
        <MacroCell label="Lipides" value={`${fat}`} unit="g" />
      </View>

      {/* Meal type selector */}
      <Text style={styles.sectionLabel}>TYPE DE REPAS</Text>
      <View style={styles.mealGrid}>
        {MEAL_OPTIONS.map((m) => (
          <SelectCard
            key={m.value}
            title={m.label}
            selected={mealType === m.value}
            onPress={() => setMealType(m.value)}
          />
        ))}
      </View>

      <NextButton
        label={saving ? 'Ajout...' : 'Ajouter'}
        onPress={handleAdd}
        disabled={saving}
      />
    </ScrollView>
  );
}

function MacroCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroCellValue}>{value}</Text>
      <Text style={styles.macroCellUnit}>{unit}</Text>
      <Text style={styles.macroCellLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  headerText: { flex: 1 },
  foodName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  foodBrand: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 2 },
  quantitySection: { marginBottom: spacing.xl },
  quantityLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quantityValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  slider: { width: '100%', height: 40 },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  macroCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  macroCellValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  macroCellUnit: { fontSize: fontSize.xs, color: colors.textDim },
  macroCellLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  mealGrid: { marginBottom: spacing.xl },
});
