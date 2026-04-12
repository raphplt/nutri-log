import FontAwesome from "@expo/vector-icons/FontAwesome";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { reminderSettings, userGoals, userProfile } from "@/db/schema";
import { getMeta, setMeta } from "@/lib/app-meta";
import i18n, { type LanguagePreference, resolveLanguage } from "@/lib/i18n";
import { scheduleAllReminders } from "@/lib/reminders";

export default function SettingsScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data: reminders } = useLiveQuery(db.select().from(reminderSettings));
	const { data: profiles } = useLiveQuery(db.select().from(userProfile));
	const { data: goals } = useLiveQuery(db.select().from(userGoals));
	const [language, setLanguage] = useState<LanguagePreference>("auto");

	const profile = profiles[0];
	const goal = goals[0];

	useEffect(() => {
		getMeta("language").then((stored) => {
			setLanguage((stored as LanguagePreference | null) ?? "auto");
		});
	}, []);

	const changeLanguage = async (pref: LanguagePreference) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setLanguage(pref);
		await setMeta("language", pref);
		await i18n.changeLanguage(resolveLanguage(pref));
	};

	const toggleReminder = async (id: string, current: boolean) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await db
			.update(reminderSettings)
			.set({ enabled: !current })
			.where(eq(reminderSettings.id, id));

		const updated = reminders.map((r) =>
			r.id === id ? { ...r, enabled: !current } : r,
		);
		await scheduleAllReminders(
			updated.map((r) => ({
				mealType: r.mealType,
				enabled: r.enabled ?? true,
				hour: r.hour,
				minute: r.minute,
			})),
		);
	};

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<Text style={styles.sectionLabel}>{t("settings.profile")}</Text>
			{profile && (
				<Pressable onPress={() => router.push("/profile")} style={styles.row}>
					<View>
						<Text style={styles.rowTitle}>
							{profile.sex === "male" ? t("sex.male") : t("sex.female")} ·{" "}
							{profile.heightCm}
							{t("common.cm")}
						</Text>
						<Text style={styles.rowSub}>
							{profile.goal === "lose"
								? t("goal.lose_noun")
								: profile.goal === "gain"
									? t("goal.gain_noun")
									: t("goal.maintain_noun")}
							{" · "}
							{t(`activity.${profile.activityLevel}` as const)}
						</Text>
					</View>
					<FontAwesome name="chevron-right" size={14} color={colors.textDim} />
				</Pressable>
			)}

			<Text style={styles.sectionLabel}>{t("settings.goals")}</Text>
			{goal && (
				<View style={styles.goalsCard}>
					<GoalRow
						label={t("macro.calories")}
						value={`${goal.kcalTarget} ${t("common.kcal")}`}
					/>
					<GoalRow
						label={t("macro.protein")}
						value={`${goal.proteinTargetG}${t("common.grams")}`}
					/>
					<GoalRow
						label={t("macro.carbs")}
						value={`${goal.carbsTargetG}${t("common.grams")}`}
					/>
					<GoalRow
						label={t("macro.fat")}
						value={`${goal.fatTargetG}${t("common.grams")}`}
					/>
				</View>
			)}

			<Text style={styles.sectionLabel}>{t("settings.weight")}</Text>
			<Pressable onPress={() => router.push("/weight")} style={styles.row}>
				<Text style={styles.rowTitle}>{t("settings.weightTracking")}</Text>
				<FontAwesome name="chevron-right" size={14} color={colors.textDim} />
			</Pressable>

			<Text style={styles.sectionLabel}>{t("settings.reminders")}</Text>
			{reminders.map((r) => (
				<View key={r.id} style={styles.reminderRow}>
					<View>
						<Text style={styles.rowTitle}>
							{t(`meal.${r.mealType}` as const)}
						</Text>
						<Text style={styles.rowSub}>
							{String(r.hour).padStart(2, "0")}:
							{String(r.minute).padStart(2, "0")}
						</Text>
					</View>
					<Switch
						value={r.enabled ?? true}
						onValueChange={() => toggleReminder(r.id, r.enabled ?? true)}
						trackColor={{ false: colors.border, true: colors.primary }}
						thumbColor={colors.text}
					/>
				</View>
			))}

			<Text style={styles.sectionLabel}>{t("settings.language")}</Text>
			<View style={styles.langRow}>
				{(["auto", "fr", "en"] as const).map((pref) => (
					<Pressable
						key={pref}
						onPress={() => changeLanguage(pref)}
						style={[
							styles.langBtn,
							language === pref && styles.langBtnSelected,
						]}
					>
						<Text
							style={[
								styles.langText,
								language === pref && styles.langTextSelected,
							]}
						>
							{pref === "auto"
								? t("settings.langAuto")
								: pref === "fr"
									? t("settings.langFr")
									: t("settings.langEn")}
						</Text>
					</Pressable>
				))}
			</View>

			<Text style={styles.sectionLabel}>{t("settings.about")}</Text>
			<Text style={styles.attribution}>{t("settings.attribution")}</Text>
		</ScrollView>
	);
}

function GoalRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.goalRow}>
			<Text style={styles.goalLabel}>{label}</Text>
			<Text style={styles.goalValue}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.xl, paddingBottom: spacing.xxl },
	sectionLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginTop: spacing.xl,
		marginBottom: spacing.sm,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		marginBottom: spacing.sm,
	},
	rowTitle: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	rowSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
	goalsCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		marginBottom: spacing.sm,
	},
	goalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.xs,
	},
	goalLabel: { fontSize: fontSize.md, color: colors.textMuted },
	goalValue: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
	reminderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.lg,
		marginBottom: spacing.sm,
	},
	langRow: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	langBtn: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: radii.sm,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
	},
	langBtnSelected: {
		borderColor: colors.primary,
		backgroundColor: `${colors.primary}15`,
	},
	langText: {
		fontSize: fontSize.md,
		color: colors.textMuted,
		fontWeight: "600",
	},
	langTextSelected: {
		color: colors.primaryLight,
	},
	attribution: {
		fontSize: fontSize.xs,
		color: colors.textDim,
		lineHeight: 18,
	},
});
