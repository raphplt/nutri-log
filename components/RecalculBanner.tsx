import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing, radii } from '@/constants/theme';

interface Props {
  deltaKg: number;
  onRecalculate: () => void;
  onDismiss: () => void;
}

export function RecalculBanner({ deltaKg, onRecalculate, onDismiss }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Ton poids a changé de {deltaKg > 0 ? '+' : ''}
        {deltaKg.toFixed(1)} kg.{'\n'}Recalculer tes objectifs ?
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRecalculate();
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
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
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  text: {
    fontFamily: fonts.regular,
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
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    backgroundColor: colors.primaryDeep,
  },
  primaryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  secondaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
