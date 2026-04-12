import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { formatDateLabel, shiftDate, todayString } from "@/lib/date";

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
			<Pressable onPress={() => go(-1)} hitSlop={12} style={styles.arrow}>
				<FontAwesome name="chevron-left" size={14} color={colors.textMuted} />
			</Pressable>
			<Pressable
				onPress={() => !isToday && onDateChange(todayString())}
				style={[styles.labelWrap, isToday && styles.labelWrapToday]}
			>
				<Text style={[styles.label, isToday && styles.labelToday]}>
					{formatDateLabel(date)}
				</Text>
			</Pressable>
			<Pressable
				onPress={() => go(1)}
				hitSlop={12}
				disabled={isToday}
				style={styles.arrow}
			>
				<FontAwesome
					name="chevron-right"
					size={14}
					color={isToday ? colors.border : colors.textMuted}
				/>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.md,
	},
	arrow: {
		padding: spacing.sm,
	},
	labelWrap: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
		borderRadius: radii.pill,
	},
	labelWrapToday: {
		backgroundColor: colors.primaryGlow,
	},
	label: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.lg,
		color: colors.text,
	},
	labelToday: {
		color: colors.primary,
	},
});
