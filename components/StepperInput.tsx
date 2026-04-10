import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

interface Props {
  label: string;
  value: number;
  onChangeValue: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

export function StepperInput({ label, value, onChangeValue, min = 0, max = 7, unit }: Props) {
  const decrement = () => {
    if (value > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeValue(value - 1);
    }
  };

  const increment = () => {
    if (value < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeValue(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={decrement}
          style={[styles.button, value <= min && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, value <= min && styles.buttonTextDisabled]}>-</Text>
        </Pressable>
        <Text style={styles.value}>
          {value}{unit ? ` ${unit}` : ''}
        </Text>
        <Pressable
          onPress={increment}
          style={[styles.button, value >= max && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonTextDisabled: {
    color: colors.textDim,
  },
  value: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
});
