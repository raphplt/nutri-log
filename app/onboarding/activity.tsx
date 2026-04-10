import { Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/lib/onboarding-store';
import { ProgressBar } from '@/components/ProgressBar';
import { SelectCard } from '@/components/SelectCard';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing } from '@/constants/theme';
import type { ActivityLevel } from '@/lib/tdee';

const LEVELS: { value: ActivityLevel; title: string; description: string }[] = [
  { value: 'sedentary', title: 'Sédentaire', description: 'Bureau, peu de marche' },
  { value: 'light', title: 'Légèrement actif', description: 'Marche quotidienne ou debout au travail' },
  { value: 'moderate', title: 'Modérément actif', description: 'Actif au quotidien, un peu de sport' },
  { value: 'active', title: 'Actif', description: 'Travail physique ou sport régulier' },
  { value: 'very_active', title: 'Très actif', description: 'Travail très physique + sport intense' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar current={3} total={6} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Comment décrirais-tu ton quotidien ?</Text>

        {LEVELS.map((l) => (
          <SelectCard
            key={l.value}
            title={l.title}
            description={l.description}
            selected={data.activityLevel === l.value}
            onPress={() => update({ activityLevel: l.value })}
          />
        ))}
      </ScrollView>
      <NextButton
        onPress={() => router.push('/onboarding/training')}
        disabled={data.activityLevel === null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
});
