import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";

interface Props {
	label: string;
	value: number;
	onChangeValue: (v: number) => void;
	min?: number;
	max?: number;
	unit?: string;
}

export function StepperInput({
	label,
	value,
	onChangeValue,
	min = 0,
	max = 7,
	unit,
}: Props) {
	const decrement = () => {
		if (value > min) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onChangeValue(value - 1);
		}
	};

	const increment = () => {
		if (value < max) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onChangeValue(value + 1);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.row}>
				<Pressable
					onPress={decrement}
					style={({ pressed }) => [
						styles.button,
						value <= min && styles.buttonDisabled,
						pressed && value > min && styles.buttonPressed,
					]}
				>
					<Text
						style={[
							styles.buttonText,
							value <= min && styles.buttonTextDisabled,
						]}
					>
						−
					</Text>
				</Pressable>
				<Text style={styles.value}>
					{value}
					{unit ? <Text style={styles.unit}>{` ${unit}`}</Text> : null}
				</Text>
				<Pressable
					onPress={increment}
					style={({ pressed }) => [
						styles.button,
						value >= max && styles.buttonDisabled,
						pressed && value < max && styles.buttonPressed,
					]}
				>
					<Text
						style={[
							styles.buttonText,
							value >= max && styles.buttonTextDisabled,
						]}
					>
						+
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
	},
	label: {
		fontFamily: fonts.medium,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginBottom: spacing.lg,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xl,
	},
	button: {
		width: 48,
		height: 48,
		borderRadius: radii.md,
		backgroundColor: colors.surfaceLight,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonPressed: {
		backgroundColor: colors.surfaceHover,
	},
	buttonDisabled: {
		backgroundColor: colors.surface,
	},
	buttonText: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xl,
		color: colors.text,
	},
	buttonTextDisabled: {
		color: colors.textDim,
	},
	value: {
		fontFamily: fonts.bold,
		fontSize: fontSize.hero,
		color: colors.text,
		minWidth: 80,
		textAlign: "center",
		fontVariant: ["tabular-nums"],
	},
	unit: {
		fontFamily: fonts.medium,
		fontSize: fontSize.lg,
		color: colors.textMuted,
	},
});
