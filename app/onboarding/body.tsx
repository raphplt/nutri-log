import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/lib/onboarding-store';
import { ProgressBar } from '@/components/ProgressBar';
import { NumericInput } from '@/components/NumericInput';
import { NextButton } from '@/components/NextButton';
import { colors, fontSize, spacing, radii } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import type { Sex } from '@/lib/tdee';

export default function BodyScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const canContinue = data.sex !== null && data.birthDate !== '' && data.heightCm > 0 && data.weightKg > 0;

  const selectSex = (sex: Sex) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update({ sex });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar current={2} total={6} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Infos physiques</Text>

        <Text style={styles.label}>SEXE</Text>
        <View style={styles.toggleRow}>
          {(['male', 'female'] as const).map((sex) => (
            <Pressable
              key={sex}
              onPress={() => selectSex(sex)}
              style={[styles.toggle, data.sex === sex && styles.toggleSelected]}
            >
              <Text style={[styles.toggleText, data.sex === sex && styles.toggleTextSelected]}>
                {sex === 'male' ? 'Homme' : 'Femme'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>DATE DE NAISSANCE</Text>
        <View style={styles.dateRow}>
          <NumericInput
            label="Jour"
            value={data.birthDate ? parseInt(data.birthDate.split('-')[2] || '1', 10) : 1}
            onChangeValue={(d) => {
              const parts = (data.birthDate || '2000-01-01').split('-');
              update({ birthDate: `${parts[0]}-${parts[1]}-${String(d).padStart(2, '0')}` });
            }}
            min={1}
            max={31}
          />
          <NumericInput
            label="Mois"
            value={data.birthDate ? parseInt(data.birthDate.split('-')[1] || '1', 10) : 1}
            onChangeValue={(m) => {
              const parts = (data.birthDate || '2000-01-01').split('-');
              update({ birthDate: `${parts[0]}-${String(m).padStart(2, '0')}-${parts[2]}` });
            }}
            min={1}
            max={12}
          />
          <NumericInput
            label="Année"
            value={data.birthDate ? parseInt(data.birthDate.split('-')[0] || '2000', 10) : 2000}
            onChangeValue={(y) => {
              const parts = (data.birthDate || '2000-01-01').split('-');
              update({ birthDate: `${y}-${parts[1]}-${parts[2]}` });
            }}
            min={1920}
            max={2015}
          />
        </View>

        <NumericInput
          label="Taille"
          value={data.heightCm}
          onChangeValue={(v) => update({ heightCm: v })}
          unit="cm"
          min={100}
          max={250}
        />

        <NumericInput
          label="Poids actuel"
          value={data.weightKg}
          onChangeValue={(v) => update({ weightKg: v })}
          unit="kg"
          decimal
          min={30}
          max={300}
        />
      </ScrollView>
      <NextButton onPress={() => router.push('/onboarding/activity')} disabled={!canContinue} />
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
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  toggle: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  toggleText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextSelected: {
    color: colors.primaryLight,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
