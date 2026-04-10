import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

interface Props {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function NextButton({ label = 'Suivant', onPress, disabled = false }: Props) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  buttonDisabled: {
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  textDisabled: {
    color: colors.textDim,
  },
});
