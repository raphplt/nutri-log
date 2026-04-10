import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

interface Props {
  deltaKg: number;
  onRecalculate: () => void;
  onDismiss: () => void;
}

export function RecalculBanner({ deltaKg, onRecalculate, onDismiss }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Ton poids a changé de {deltaKg > 0 ? '+' : ''}{deltaKg.toFixed(1)} kg.
        {'\n'}Recalculer tes objectifs ?
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRecalculate();
          }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Recalculer</Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Plus tard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning + '15',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.warning,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#000',
  },
  secondaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
