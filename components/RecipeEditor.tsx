import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { colors, fontSize, fonts, radii, spacing } from "@/constants/theme";
import {
	clearActiveDraft,
	patchActiveDraft,
	removeIngredient,
	useActiveDraft,
} from "@/lib/recipe-draft";
import {
	computeRecipeTotals,
	createRecipe,
	deleteRecipe,
	type RecipeItemInput,
	updateRecipe,
} from "@/lib/recipe-service";

interface Props {
	mode: "new" | "edit";
}

export function RecipeEditor({ mode }: Props) {
	const { t } = useTranslation();
	const router = useRouter();
	const draft = useActiveDraft();
	const [saving, setSaving] = useState(false);

	const totals = useMemo(() => {
		if (!draft) return null;
		return computeRecipeTotals(
			draft.items.map((it, i) => ({
				id: i,
				recipeId: "",
				foodId: it.foodId ?? null,
				name: it.name,
				quantityG: it.quantityG,
				kcal: it.kcal,
				protein: it.protein,
				carbs: it.carbs,
				fat: it.fat,
				fiber: it.fiber ?? null,
				position: i,
			})),
		);
	}, [draft]);

	useEffect(() => {
		return () => {
			// Draft cleared by screens on unmount/save to prevent stale state
		};
	}, []);

	if (!draft) {
		return (
			<View style={styles.loading}>
				<Text style={styles.loadingText}>…</Text>
			</View>
		);
	}

	const per100g = (val: number): number => {
		if (!totals || totals.totalWeightG <= 0) return 0;
		return (val / totals.totalWeightG) * 100;
	};

	const perServing = (val: number): number => {
		if (!draft.servingsDefault || draft.servingsDefault <= 0) return 0;
		return val / draft.servingsDefault;
	};

	const handleSave = async () => {
		const name = draft.name.trim();
		if (name.length === 0) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			return;
		}
		setSaving(true);
		try {
			if (mode === "new" || draft.id == null) {
				await createRecipe({
					name,
					kind: draft.kind,
					totalWeightG: draft.totalWeightG,
					servingsDefault: draft.servingsDefault,
					imageUrl: draft.imageUrl,
					notes: draft.notes,
					items: draft.items,
				});
			} else {
				await updateRecipe(draft.id, {
					name,
					totalWeightG: draft.totalWeightG,
					servingsDefault: draft.servingsDefault,
					imageUrl: draft.imageUrl,
					notes: draft.notes,
					items: draft.items,
				});
			}
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			clearActiveDraft();
			router.back();
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		if (!draft.id) return;
		Alert.alert(t("recipes.deleteTitle"), t("recipes.deleteConfirm"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					if (!draft.id) return;
					await deleteRecipe(draft.id);
					clearActiveDraft();
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					router.back();
				},
			},
		]);
	};

	const addIngredient = () => {
		Haptics.selectionAsync();
		router.push("/add/search?pickOnly=1");
	};

	const pickImage = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) return;
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
		});
		if (result.canceled) return;
		const uri = result.assets[0]?.uri;
		if (uri) {
			patchActiveDraft({ imageUrl: uri });
			Haptics.selectionAsync();
		}
	};

	const removeImage = () => {
		patchActiveDraft({ imageUrl: null });
		Haptics.selectionAsync();
	};

	const handleRemoveIngredient = (index: number, item: RecipeItemInput) => {
		Alert.alert(
			t("mealDetail.deleteTitle"),
			item.name,
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: () => {
						removeIngredient(index);
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					},
				},
			],
			{ cancelable: true },
		);
	};

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			<Pressable
				onPress={pickImage}
				onLongPress={draft.imageUrl ? removeImage : undefined}
				style={({ pressed }) => [
					styles.imagePicker,
					pressed && styles.imagePickerPressed,
				]}
			>
				{draft.imageUrl ? (
					<Image
						source={{ uri: draft.imageUrl }}
						style={styles.imagePreview}
						contentFit="cover"
						cachePolicy="memory-disk"
					/>
				) : (
					<View style={styles.imagePlaceholder}>
						<FontAwesome name="camera" size={20} color={colors.textMuted} />
						<Text style={styles.imagePickerLabel}>
							{t("recipes.imagePick")}
						</Text>
					</View>
				)}
				{draft.imageUrl ? (
					<View style={styles.imageOverlay}>
						<Text style={styles.imageOverlayText}>
							{t("recipes.imageReplace")}
						</Text>
					</View>
				) : null}
			</Pressable>

			<Text style={styles.label}>{t("recipes.formName")}</Text>
			<TextInput
				style={styles.input}
				value={draft.name}
				onChangeText={(v) => patchActiveDraft({ name: v })}
				placeholder={t("recipes.formNamePlaceholder")}
				placeholderTextColor={colors.textDim}
				autoCapitalize="sentences"
				returnKeyType="done"
			/>

			<View style={styles.row}>
				<View style={styles.rowHalf}>
					<NumericInput
						label={t("recipes.formTotalWeight")}
						value={draft.totalWeightG ?? 0}
						onChangeValue={(v) =>
							patchActiveDraft({ totalWeightG: v > 0 ? v : null })
						}
						unit={t("common.grams")}
						min={0}
						max={10000}
					/>
				</View>
				<View style={styles.rowHalf}>
					<NumericInput
						label={t("recipes.formServings")}
						value={draft.servingsDefault ?? 0}
						onChangeValue={(v) =>
							patchActiveDraft({ servingsDefault: v > 0 ? v : null })
						}
						min={0}
						max={50}
						decimal
					/>
				</View>
			</View>

			<Text style={styles.label}>{t("recipes.formNotes")}</Text>
			<TextInput
				style={[styles.input, styles.textarea]}
				value={draft.notes ?? ""}
				onChangeText={(v) =>
					patchActiveDraft({ notes: v.length > 0 ? v : null })
				}
				placeholder={t("recipes.formNotesPlaceholder")}
				placeholderTextColor={colors.textDim}
				multiline
				numberOfLines={3}
			/>

			<View style={styles.compositionHeader}>
				<Text style={styles.sectionLabel}>{t("recipes.composition")}</Text>
			</View>

			{draft.items.length === 0 ? (
				<View style={styles.emptyIngredients}>
					<Text style={styles.emptyText}>{t("recipes.noIngredients")}</Text>
				</View>
			) : (
				<View style={styles.itemsList}>
					{draft.items.map((it, idx) => (
						<Pressable
							key={`${it.name}-${idx}`}
							onLongPress={() => handleRemoveIngredient(idx, it)}
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
									{t("common.grams")} · {Math.round(it.kcal)} {t("common.kcal")}
								</Text>
							</View>
							<Pressable
								hitSlop={10}
								onPress={() => handleRemoveIngredient(idx, it)}
							>
								<FontAwesome
									name="trash-o"
									size={18}
									color={colors.textMuted}
								/>
							</Pressable>
						</Pressable>
					))}
				</View>
			)}

			<Pressable
				onPress={addIngredient}
				style={({ pressed }) => [
					styles.addBtn,
					pressed && styles.addBtnPressed,
				]}
			>
				<FontAwesome name="plus" size={14} color={colors.primary} />
				<Text style={styles.addBtnText}>{t("recipes.addIngredient")}</Text>
			</Pressable>

			{totals && totals.totalWeightG > 0 && (
				<View style={styles.totalsCard}>
					<TotalsRow
						label={t("recipes.totalsTotal")}
						kcal={totals.kcal}
						protein={totals.protein}
						carbs={totals.carbs}
						fat={totals.fat}
						t={t}
					/>
					<TotalsRow
						label={t("recipes.totalsBy100")}
						kcal={per100g(totals.kcal)}
						protein={per100g(totals.protein)}
						carbs={per100g(totals.carbs)}
						fat={per100g(totals.fat)}
						t={t}
					/>
					{draft.servingsDefault && draft.servingsDefault > 0 ? (
						<TotalsRow
							label={t("recipes.totalsByServing")}
							kcal={perServing(totals.kcal)}
							protein={perServing(totals.protein)}
							carbs={perServing(totals.carbs)}
							fat={perServing(totals.fat)}
							t={t}
						/>
					) : null}
				</View>
			)}

			<NextButton
				label={saving ? t("common.saving") : t("common.save")}
				onPress={handleSave}
				disabled={saving || draft.name.trim().length === 0}
			/>

			{mode === "edit" && draft.id != null && (
				<Pressable onPress={handleDelete} style={styles.deleteBtn}>
					<Text style={styles.deleteBtnText}>{t("common.delete")}</Text>
				</Pressable>
			)}
		</ScrollView>
	);
}

function TotalsRow({
	label,
	kcal,
	protein,
	carbs,
	fat,
	t,
}: {
	label: string;
	kcal: number;
	protein: number;
	carbs: number;
	fat: number;
	t: (k: string) => string;
}) {
	return (
		<View style={styles.totalsRow}>
			<Text style={styles.totalsRowLabel}>{label}</Text>
			<View style={styles.totalsRowValues}>
				<Text style={styles.totalsRowKcal}>
					{Math.round(kcal)} {t("common.kcal")}
				</Text>
				<Text style={styles.totalsRowMacros}>
					{Math.round(protein)}P · {Math.round(carbs)}C · {Math.round(fat)}F
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	imagePicker: {
		height: 140,
		borderRadius: radii.lg,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.lg,
		overflow: "hidden",
		justifyContent: "center",
		alignItems: "center",
	},
	imagePickerPressed: { opacity: 0.85 },
	imagePreview: { width: "100%", height: "100%" },
	imagePlaceholder: { alignItems: "center", gap: spacing.sm },
	imagePickerLabel: {
		fontFamily: fonts.medium,
		fontSize: fontSize.sm,
		color: colors.textMuted,
	},
	imageOverlay: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "rgba(0,0,0,0.5)",
		paddingVertical: 6,
		alignItems: "center",
	},
	imageOverlayText: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.text,
	},
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.background,
	},
	loadingText: { color: colors.textMuted },
	label: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	input: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		color: colors.text,
		fontSize: fontSize.md,
		fontFamily: fonts.medium,
		marginBottom: spacing.lg,
		minHeight: 48,
	},
	textarea: {
		minHeight: 72,
		textAlignVertical: "top",
	},
	row: {
		flexDirection: "row",
		gap: spacing.md,
	},
	rowHalf: { flex: 1 },
	sectionLabel: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	compositionHeader: {
		marginTop: spacing.md,
		marginBottom: spacing.sm,
	},
	emptyIngredients: {
		paddingVertical: spacing.lg,
		alignItems: "center",
	},
	emptyText: { color: colors.textMuted, fontSize: fontSize.sm },
	itemsList: { gap: spacing.xs, marginBottom: spacing.md },
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
		borderWidth: 1,
		borderColor: colors.border,
	},
	itemRowPressed: { backgroundColor: colors.surfaceHover },
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
	addBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		paddingVertical: spacing.md,
		borderRadius: radii.md,
		borderWidth: 1,
		borderColor: colors.border,
		borderStyle: "dashed",
		marginBottom: spacing.xl,
	},
	addBtnPressed: { backgroundColor: colors.surfaceHover },
	addBtnText: {
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
		color: colors.primary,
	},
	totalsCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.xl,
		gap: spacing.md,
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	totalsRowLabel: {
		fontFamily: fonts.medium,
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	totalsRowValues: { alignItems: "flex-end" },
	totalsRowKcal: {
		fontFamily: fonts.bold,
		fontSize: fontSize.md,
		color: colors.text,
	},
	totalsRowMacros: {
		fontFamily: fonts.regular,
		fontSize: fontSize.xs,
		color: colors.textDim,
		marginTop: 2,
	},
	deleteBtn: {
		alignItems: "center",
		paddingVertical: spacing.md,
	},
	deleteBtnText: {
		color: colors.danger,
		fontFamily: fonts.semibold,
		fontSize: fontSize.sm,
	},
});
