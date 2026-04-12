import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing, radii } from '@/constants/theme';

interface Props {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectCard({ title, description, selected, onPress }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && !selected && styles.cardPressed,
      ]}
    >
      <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: 64,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  cardPressed: {
    backgroundColor: colors.surfaceHover,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  titleSelected: {
    color: colors.primary,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
