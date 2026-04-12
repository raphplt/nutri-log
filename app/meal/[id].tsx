import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize } from "@/constants/theme";

export default function MealDetailScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				{t("nav.meal")} {id}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},
	title: {
		fontSize: fontSize.xl,
		fontWeight: "bold",
		color: colors.text,
	},
});
