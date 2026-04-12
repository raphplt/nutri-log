import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing, radii } from '@/constants/theme';

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
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(String(value));

  const handleChange = (next: string) => {
    const cleaned = next.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
    setText(cleaned);
    if (cleaned === '') return;
    let num = decimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
    if (isNaN(num)) return;
    if (max !== undefined && num > max) num = max;
    onChangeValue(num);
  };

  const handleBlur = () => {
    setFocused(false);
    let num = decimal ? parseFloat(text) : parseInt(text, 10);
    if (isNaN(num) || text === '') num = min ?? 0;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    setText(String(num));
    onChangeValue(num);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <TextInput
          style={styles.input}
          value={focused ? text : String(value)}
          onChangeText={handleChange}
          onFocus={() => {
            setFocused(true);
            setText(String(value));
          }}
          onBlur={handleBlur}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          placeholderTextColor={colors.textDim}
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
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSize.xl,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  unit: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
