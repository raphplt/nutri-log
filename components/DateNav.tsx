import { View, Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { formatDateLabel, shiftDate, todayString } from '@/lib/date';
import { colors, fontSize, spacing } from '@/constants/theme';

interface Props {
  date: string;
  onDateChange: (date: string) => void;
}

export function DateNav({ date, onDateChange }: Props) {
  const isToday = date === todayString();

  const go = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateChange(shiftDate(date, days));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => go(-1)} hitSlop={12}>
        <FontAwesome name="chevron-left" size={16} color={colors.textMuted} />
      </Pressable>
      <Pressable onPress={() => !isToday && onDateChange(todayString())}>
        <Text style={styles.label}>{formatDateLabel(date)}</Text>
      </Pressable>
      <Pressable onPress={() => go(1)} hitSlop={12} disabled={isToday}>
        <FontAwesome
          name="chevron-right"
          size={16}
          color={isToday ? colors.border : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
});
