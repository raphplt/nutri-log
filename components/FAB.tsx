import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadows } from '@/constants/theme';

interface Props {
  onPress: () => void;
}

export function FAB({ onPress }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
    >
      <Text style={styles.icon}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.fab,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: colors.primaryDeep,
  },
  icon: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.textInverse,
    marginTop: -2,
  },
});
