import FontAwesome from "@expo/vector-icons/FontAwesome";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { recipes as recipesTable } from "@/db/schema";
import { deleteRecipe, type RecipeRow } from "@/lib/recipe-service";

export default function RecipeListScreen() {
	const { t } = useTranslation();
	const router = useRouter();

	const { data: rows } = useLiveQuery(
		db.select().from(recipesTable).orderBy(desc(recipesTable.updatedAt)),
	);

	const recipes = rows.filter((r) => r.kind === "recipe");
	const templates = rows.filter((r) => r.kind === "template");

	const handleDelete = (recipe: RecipeRow) => {
		Alert.alert(t("recipes.deleteTitle"), t("recipes.deleteConfirm"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					await deleteRecipe(recipe.id);
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				},
			},
		]);
	};

	const renderCard = (r: RecipeRow) => (
		<Pressable
			key={r.id}
			onPress={() => router.push(`/recipe/${r.id}/edit`)}
			onLongPress={() => handleDelete(r)}
			style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
		>
			{r.imageUrl ? (
				<Image
					source={{ uri: r.imageUrl }}
					style={styles.thumb}
					contentFit="cover"
					cachePolicy="memory-disk"
				/>
			) : (
				<View style={[styles.thumb, styles.thumbPlaceholder]}>
					<Text style={styles.thumbEmoji}>
						{r.kind === "template" ? "🍱" : "🍲"}
					</Text>
				</View>
			)}
			<View style={styles.cardInfo}>
				<Text style={styles.cardName} numberOfLines={1}>
					{r.name}
				</Text>
				<Text style={styles.cardMeta}>
					{r.useCount ? `${r.useCount} ×` : "—"}
				</Text>
			</View>
			<FontAwesome name="chevron-right" size={12} color={colors.textDim} />
		</Pressable>
	);

	const isEmpty = rows.length === 0;

	return (
		<View style={styles.screen}>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				{isEmpty ? (
					<View style={styles.empty}>
						<Text style={styles.emptyEmoji}>🍲</Text>
						<Text style={styles.emptyTitle}>{t("recipes.emptyTitle")}</Text>
						<Text style={styles.emptyHint}>{t("recipes.emptyHint")}</Text>
					</View>
				) : (
					<>
						{recipes.length > 0 && (
							<View style={styles.section}>
								<Text style={styles.sectionLabel}>
									{t("recipes.sectionRecipes")}
								</Text>
								{recipes.map(renderCard)}
							</View>
						)}
						{templates.length > 0 && (
							<View style={styles.section}>
								<Text style={styles.sectionLabel}>
									{t("recipes.sectionTemplates")}
								</Text>
								{templates.map(renderCard)}
							</View>
						)}
					</>
				)}
			</ScrollView>

			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					router.push("/recipe/new");
				}}
				style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
			>
				<FontAwesome name="plus" size={22} color={colors.textInverse} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	scroll: { flex: 1 },
	content: { padding: spacing.xl, paddingBottom: 120 },
	section: { marginBottom: spacing.xl },
	sectionLabel: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.sm,
	},
	cardPressed: { backgroundColor: colors.surfaceHover },
	thumb: {
		width: 48,
		height: 48,
		borderRadius: radii.sm,
		backgroundColor: colors.background,
	},
	thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
	thumbEmoji: { fontSize: 22 },
	cardInfo: { flex: 1 },
	cardName: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
		color: colors.text,
	},
	cardMeta: {
		fontFamily: fonts.regular,
		fontSize: fontSize.xs,
		color: colors.textDim,
		marginTop: 2,
	},
	empty: { alignItems: "center", paddingVertical: spacing.xxl * 2 },
	emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
	emptyTitle: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.lg,
		color: colors.text,
		marginBottom: spacing.xs,
	},
	emptyHint: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		textAlign: "center",
		paddingHorizontal: spacing.xl,
	},
	fab: {
		position: "absolute",
		bottom: spacing.xl,
		right: spacing.xl,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		elevation: 6,
	},
	fabPressed: { backgroundColor: colors.primaryDeep },
});
