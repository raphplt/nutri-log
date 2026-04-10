import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

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
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, selected && styles.descriptionSelected]}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  titleSelected: {
    color: colors.primaryLight,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  descriptionSelected: {
    color: colors.textMuted,
  },
});
