import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

interface Props {
  label: string;
  value: number;
  onChangeValue: (v: number) => void;
  unit?: string;
  decimal?: boolean;
  min?: number;
  max?: number;
}

export function NumericInput({ label, value, onChangeValue, unit, decimal = false, min, max }: Props) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
    if (cleaned === '') return;
    let num = decimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
    if (isNaN(num)) return;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    onChangeValue(num);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={String(value)}
          onChangeText={handleChange}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unit: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
