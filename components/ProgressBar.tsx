import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing } from '@/constants/theme';

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%`, { duration: 300 }),
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.full,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
});
