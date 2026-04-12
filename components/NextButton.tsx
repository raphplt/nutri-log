import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";

interface Props {
	label?: string;
	onPress: () => void;
	disabled?: boolean;
}

export function NextButton({
	label = "Suivant",
	onPress,
	disabled = false,
}: Props) {
	const handlePress = () => {
		if (disabled) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	return (
		<Pressable
			onPress={handlePress}
			style={({ pressed }) => [
				styles.button,
				pressed && !disabled && styles.buttonPressed,
				disabled && styles.buttonDisabled,
			]}
		>
			<Text style={[styles.text, disabled && styles.textDisabled]}>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: colors.primary,
		borderRadius: radii.pill,
		paddingVertical: 14,
		paddingHorizontal: spacing.xl,
		alignItems: "center",
		marginHorizontal: spacing.xl,
		marginBottom: spacing.xl,
		minHeight: 48,
		justifyContent: "center",
	},
	buttonPressed: {
		backgroundColor: colors.primaryDeep,
		transform: [{ scale: 0.98 }],
	},
	buttonDisabled: {
		backgroundColor: colors.surfaceLight,
	},
	text: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
		color: colors.textInverse,
	},
	textDisabled: {
		color: colors.textDim,
	},
});
