import { asc, eq, inArray } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { mealItems, meals, recipes as recipesTable } from "@/db/schema";
import { cloneMealAsTemplate } from "@/lib/recipe-service";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export default function MealDetailScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();

	const { data: mealRows } = useLiveQuery(
		db.select().from(meals).where(eq(meals.id, id)).limit(1),
		[id],
	);
	const { data: itemRows } = useLiveQuery(
		db
			.select()
			.from(mealItems)
			.where(eq(mealItems.mealId, id))
			.orderBy(asc(mealItems.createdAt)),
		[id],
	);

	const recipeIds = useMemo(
		() =>
			Array.from(
				new Set(
					itemRows
						.map((it) => it.recipeId)
						.filter((r): r is string => r != null),
				),
			),
		[itemRows],
	);

	const { data: recipeRows } = useLiveQuery(
		recipeIds.length > 0
			? db
					.select()
					.from(recipesTable)
					.where(inArray(recipesTable.id, recipeIds))
			: db.select().from(recipesTable).where(eq(recipesTable.id, "__none__")),
		[recipeIds.join("|")],
	);

	const recipeMap = useMemo(() => {
		const m = new Map<string, (typeof recipeRows)[number]>();
		for (const r of recipeRows) m.set(r.id, r);
		return m;
	}, [recipeRows]);

	const meal = mealRows[0];
	const [saveOpen, setSaveOpen] = useState(false);
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);

	const totals = useMemo(() => {
		return itemRows.reduce(
			(acc, it) => {
				acc.kcal += it.kcal;
				acc.protein += it.protein;
				acc.carbs += it.carbs;
				acc.fat += it.fat;
				return acc;
			},
			{ kcal: 0, protein: 0, carbs: 0, fat: 0 },
		);
	}, [itemRows]);

	const mealLabel = meal
		? t(`meal.${meal.mealType as MealType}` as const, {
				defaultValue: meal.mealType,
			})
		: "";

	const openSave = () => {
		if (itemRows.length === 0) return;
		setName(mealLabel);
		setSaveOpen(true);
	};

	const confirmSave = async () => {
		const trimmed = name.trim();
		if (trimmed.length === 0) return;
		setSaving(true);
		try {
			await cloneMealAsTemplate(id, trimmed);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			setSaveOpen(false);
			setName("");
		} catch (e) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(t("common.error"), (e as Error).message);
		} finally {
			setSaving(false);
		}
	};

	const deleteItem = (itemId: string) => {
		Alert.alert(t("mealDetail.deleteTitle"), t("mealDetail.deleteConfirm"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					await db.delete(mealItems).where(eq(mealItems.id, itemId));
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				},
			},
		]);
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: mealLabel || t("nav.meal"),
					headerRight: () =>
						itemRows.length > 0 ? (
							<Pressable onPress={openSave} hitSlop={10}>
								<Text style={styles.headerAction}>
									{t("mealDetail.saveAsTemplate")}
								</Text>
							</Pressable>
						) : null,
				}}
			/>

			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<View style={styles.totalsCard}>
					<View style={styles.totalMain}>
						<Text style={styles.totalValue}>{Math.round(totals.kcal)}</Text>
						<Text style={styles.totalUnit}>{t("common.kcal")}</Text>
					</View>
					<View style={styles.macroRow}>
						<MacroStat
							label={t("macro.protein")}
							value={Math.round(totals.protein)}
						/>
						<MacroStat
							label={t("macro.carbs")}
							value={Math.round(totals.carbs)}
						/>
						<MacroStat label={t("macro.fat")} value={Math.round(totals.fat)} />
					</View>
				</View>

				{itemRows.length === 0 ? (
					<View style={styles.empty}>
						<Text style={styles.emptyText}>{t("mealDetail.empty")}</Text>
					</View>
				) : (
					<View style={styles.itemsList}>
						{itemRows.map((it) => {
							const recipe = it.recipeId ? recipeMap.get(it.recipeId) : null;
							const stale =
								recipe != null &&
								it.recipeSnapshotAt != null &&
								recipe.updatedAt > it.recipeSnapshotAt;
							return (
								<Pressable
									key={it.id}
									onLongPress={() => deleteItem(it.id)}
									style={({ pressed }) => [
										styles.itemRow,
										pressed && styles.itemRowPressed,
									]}
								>
									<View style={styles.itemInfo}>
										<Text style={styles.itemName} numberOfLines={1}>
											{it.name}
										</Text>
										<Text style={styles.itemDetail}>
											{Math.round(it.quantityG)}
											{t("common.grams")} · {Math.round(it.protein)}P ·{" "}
											{Math.round(it.carbs)}C · {Math.round(it.fat)}F
										</Text>
										{stale && (
											<Text style={styles.staleBadge}>
												{t("recipes.modifiedSince")}
											</Text>
										)}
									</View>
									<Text style={styles.itemKcal}>
										{Math.round(it.kcal)} {t("common.kcal")}
									</Text>
								</Pressable>
							);
						})}
						<Text style={styles.hint}>{t("mealDetail.longPressHint")}</Text>
					</View>
				)}
			</ScrollView>

			<Modal
				visible={saveOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setSaveOpen(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={styles.modalBackdrop}
				>
					<Pressable
						style={styles.modalBackdropPress}
						onPress={() => setSaveOpen(false)}
					/>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>
							{t("mealDetail.saveAsTemplate")}
						</Text>
						<Text style={styles.modalSubtitle}>
							{t("mealDetail.saveAsTemplateHint")}
						</Text>
						<TextInput
							style={styles.modalInput}
							value={name}
							onChangeText={setName}
							placeholder={t("mealDetail.namePlaceholder")}
							placeholderTextColor={colors.textDim}
							autoFocus
							selectTextOnFocus
							returnKeyType="done"
							onSubmitEditing={confirmSave}
						/>
						<View style={styles.modalActions}>
							<Pressable
								style={styles.modalBtnGhost}
								onPress={() => setSaveOpen(false)}
							>
								<Text style={styles.modalBtnGhostText}>
									{t("common.cancel")}
								</Text>
							</Pressable>
							<Pressable
								style={[
									styles.modalBtnPrimary,
									(saving || name.trim().length === 0) &&
										styles.modalBtnDisabled,
								]}
								disabled={saving || name.trim().length === 0}
								onPress={confirmSave}
							>
								<Text style={styles.modalBtnPrimaryText}>
									{saving ? t("common.saving") : t("common.save")}
								</Text>
							</Pressable>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</>
	);
}

function MacroStat({ label, value }: { label: string; value: number }) {
	return (
		<View style={styles.macroStat}>
			<Text style={styles.macroStatValue}>{value}</Text>
			<Text style={styles.macroStatLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	headerAction: {
		color: colors.primary,
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
		paddingHorizontal: spacing.sm,
	},
	totalsCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.xl,
		marginBottom: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
	},
	totalMain: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "center",
		gap: spacing.xs,
		marginBottom: spacing.lg,
	},
	totalValue: {
		fontFamily: fonts.bold,
		fontSize: fontSize.display,
		color: colors.text,
	},
	totalUnit: {
		fontFamily: fonts.medium,
		fontSize: fontSize.md,
		color: colors.textMuted,
	},
	macroRow: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	macroStat: { alignItems: "center" },
	macroStatValue: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.lg,
		color: colors.text,
	},
	macroStatLabel: {
		fontFamily: fonts.regular,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		marginTop: 2,
	},
	empty: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
	},
	emptyText: {
		color: colors.textMuted,
		fontSize: fontSize.md,
	},
	itemsList: { gap: spacing.sm },
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
	},
	itemRowPressed: {
		backgroundColor: colors.surfaceHover,
	},
	itemInfo: { flex: 1, marginRight: spacing.md },
	itemName: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
		color: colors.text,
	},
	itemDetail: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginTop: 2,
	},
	itemKcal: {
		fontFamily: fonts.bold,
		fontSize: fontSize.md,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	hint: {
		textAlign: "center",
		color: colors.textDim,
		fontSize: fontSize.xs,
		marginTop: spacing.md,
	},
	staleBadge: {
		marginTop: 4,
		fontFamily: fonts.medium,
		fontSize: fontSize.xs,
		color: colors.warning,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		padding: spacing.xl,
	},
	modalBackdropPress: { ...StyleSheet.absoluteFillObject },
	modalCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.lg,
		padding: spacing.xl,
		borderWidth: 1,
		borderColor: colors.border,
	},
	modalTitle: {
		fontFamily: fonts.bold,
		fontSize: fontSize.lg,
		color: colors.text,
	},
	modalSubtitle: {
		fontFamily: fonts.regular,
		fontSize: fontSize.sm,
		color: colors.textMuted,
		marginTop: spacing.xs,
		marginBottom: spacing.lg,
	},
	modalInput: {
		backgroundColor: colors.background,
		borderRadius: radii.sm,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		color: colors.text,
		fontSize: fontSize.md,
		fontFamily: fonts.medium,
		marginBottom: spacing.lg,
	},
	modalActions: {
		flexDirection: "row",
		gap: spacing.sm,
		justifyContent: "flex-end",
	},
	modalBtnGhost: {
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
	},
	modalBtnGhostText: {
		color: colors.textMuted,
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
	},
	modalBtnPrimary: {
		backgroundColor: colors.primary,
		borderRadius: radii.pill,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
	},
	modalBtnDisabled: {
		backgroundColor: colors.surfaceLight,
	},
	modalBtnPrimaryText: {
		color: colors.textInverse,
		fontFamily: fonts.semibold,
		fontSize: fontSize.md,
	},
});
