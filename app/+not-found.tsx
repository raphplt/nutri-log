import { Link, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "@/constants/theme";

export default function NotFoundScreen() {
	const { t } = useTranslation();
	return (
		<>
			<Stack.Screen options={{ title: t("nav.oops") }} />
			<View style={styles.container}>
				<Text style={styles.title}>{t("notFound.title")}</Text>
				<Link href="/" style={styles.link}>
					<Text style={styles.linkText}>{t("notFound.goHome")}</Text>
				</Link>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		backgroundColor: colors.background,
	},
	title: {
		fontSize: fontSize.xl,
		fontWeight: "bold",
		color: colors.text,
	},
	link: {
		marginTop: spacing.lg,
		paddingVertical: spacing.lg,
	},
	linkText: {
		fontSize: fontSize.md,
		color: colors.primary,
	},
});
