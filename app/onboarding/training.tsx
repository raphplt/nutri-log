import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/lib/onboarding-store';
import { ProgressBar } from '@/components/ProgressBar';
import { StepperInput } from '@/components/StepperInput';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function TrainingScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar current={4} total={6} />
      <View style={styles.center}>
        <Text style={styles.title}>Combien de jours par semaine tu t'entraînes ?</Text>
        <StepperInput
          label="JOURS D'ENTRAÎNEMENT"
          value={data.trainingDaysPerWeek}
          onChangeValue={(v) => update({ trainingDaysPerWeek: v })}
          min={0}
          max={7}
          unit="j/sem"
        />
      </View>
      <NextButton onPress={() => router.push('/onboarding/summary')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xxl * 2,
    textAlign: 'center',
  },
});
