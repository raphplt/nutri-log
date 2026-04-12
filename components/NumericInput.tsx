import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";

interface Props {
	label: string;
	value: number;
	onChangeValue: (v: number) => void;
	unit?: string;
	decimal?: boolean;
	min?: number;
	max?: number;
}

export function NumericInput({
	label,
	value,
	onChangeValue,
	unit,
	decimal = false,
	min,
	max,
}: Props) {
	const [focused, setFocused] = useState(false);
	const [text, setText] = useState(String(value));

	useEffect(() => {
		if (!focused) setText(String(value));
	}, [value, focused]);

	const handleChange = (next: string) => {
		const cleaned = next.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, "");
		setText(cleaned);
		if (cleaned === "" || cleaned === ".") return;
		const num = decimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
		if (!Number.isFinite(num)) return;
		onChangeValue(num);
	};

	const handleBlur = () => {
		setFocused(false);
		const parsed = decimal ? parseFloat(text) : parseInt(text, 10);
		let num = Number.isFinite(parsed) ? parsed : value;
		if (min !== undefined && num < min) num = min;
		if (max !== undefined && num > max) num = max;
		setText(String(num));
		if (num !== value) onChangeValue(num);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<View style={[styles.inputRow, focused && styles.inputRowFocused]}>
				<TextInput
					style={styles.input}
					value={text}
					onChangeText={handleChange}
					onFocus={() => setFocused(true)}
					onBlur={handleBlur}
					keyboardType={decimal ? "decimal-pad" : "number-pad"}
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
		flexDirection: "row",
		alignItems: "center",
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
