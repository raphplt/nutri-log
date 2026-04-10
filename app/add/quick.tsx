import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { addMealItem, guessMealType } from '@/lib/meal-service';
import { todayString } from '@/lib/date';
import { NumericInput } from '@/components/NumericInput';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

export default function QuickAddScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const handleAdd = async () => {
    if (kcal <= 0) {
      Alert.alert('Erreur', 'Les calories doivent être supérieures à 0');
      return;
    }

    await addMealItem({
      date: todayString(),
      mealType: guessMealType(),
      foodId: null,
      name: name || 'Quick add',
      quantityG: 0,
      kcal,
      protein,
      carbs,
      fat,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismiss();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.label}>NOM (OPTIONNEL)</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Ex: Snack, Repas au resto..."
        placeholderTextColor={colors.textDim}
        value={name}
        onChangeText={setName}
      />

      <NumericInput label="Calories" value={kcal} onChangeValue={setKcal} unit="kcal" min={0} max={9999} />
      <NumericInput label="Protéines" value={protein} onChangeValue={setProtein} unit="g" min={0} max={999} />
      <NumericInput label="Glucides" value={carbs} onChangeValue={setCarbs} unit="g" min={0} max={999} />
      <NumericInput label="Lipides" value={fat} onChangeValue={setFat} unit="g" min={0} max={999} />

      <NextButton label="Ajouter" onPress={handleAdd} disabled={kcal <= 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
});
