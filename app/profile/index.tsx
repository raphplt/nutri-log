import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { NextButton } from "@/components/NextButton";
import { NumericInput } from "@/components/NumericInput";
import { SelectCard } from "@/components/SelectCard";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { db } from "@/db/client";
import { userGoals, userProfile } from "@/db/schema";
import { updateProfileAndRecalculate } from "@/lib/profile-service";
import type { ActivityLevel, Goal, MacroPreset, Sex } from "@/lib/tdee";

const ACTIVITY_VALUES: ActivityLevel[] = [
	"sedentary",
	"light",
	"moderate",
	"active",
	"very_active",
];

export default function ProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { data: profiles } = useLiveQuery(db.select().from(userProfile));
	const { data: goals } = useLiveQuery(db.select().from(userGoals));
	const profile = profiles[0];
	const goal = goals[0];

	const [sex, setSex] = useState<Sex>((profile?.sex as Sex) ?? "male");
	const [heightCm, setHeightCm] = useState(profile?.heightCm ?? 170);
	const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
		(profile?.activityLevel as ActivityLevel) ?? "moderate",
	);
	const [trainingDays, setTrainingDays] = useState(
		profile?.trainingDaysPerWeek ?? 3,
	);
	const [goalType, setGoalType] = useState<Goal>(
		(profile?.goal as Goal) ?? "maintain",
	);
	const [goalRate, setGoalRate] = useState(profile?.goalRate ?? 0);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!profile) return;
		setSaving(true);
		try {
			await updateProfileAndRecalculate(
				{
					sex,
					birthDate: profile.birthDate,
					heightCm,
					weightKg: 0,
					activityLevel,
					trainingDaysPerWeek: trainingDays,
					goal: goalType,
					goalRate,
				},
				(goal?.macroPreset as MacroPreset) ?? "balanced",
			);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.back();
		} catch (e) {
			Alert.alert(t("common.error"), String(e));
		} finally {
			setSaving(false);
		}
	};

	if (!profile) return null;

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<Text style={styles.sectionLabel}>{t("profileScreen.sex")}</Text>
			<View style={styles.toggleRow}>
				{(["male", "female"] as const).map((s) => (
					<Pressable
						key={s}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							setSex(s);
						}}
						style={[styles.toggle, sex === s && styles.toggleSelected]}
					>
						<Text
							style={[
								styles.toggleText,
								sex === s && styles.toggleTextSelected,
							]}
						>
							{s === "male" ? t("sex.male") : t("sex.female")}
						</Text>
					</Pressable>
				))}
			</View>

			<NumericInput
				label={t("profileScreen.height")}
				value={heightCm}
				onChangeValue={setHeightCm}
				unit={t("common.cm")}
				min={100}
				max={250}
			/>

			<Text style={styles.sectionLabel}>
				{t("profileScreen.activityLevel")}
			</Text>
			{ACTIVITY_VALUES.map((level) => (
				<SelectCard
					key={level}
					title={t(`activity.${level}` as const)}
					selected={activityLevel === level}
					onPress={() => setActivityLevel(level)}
				/>
			))}

			<NumericInput
				label={t("profileScreen.trainingDays")}
				value={trainingDays}
				onChangeValue={setTrainingDays}
				min={0}
				max={7}
			/>

			<Text style={styles.sectionLabel}>{t("profileScreen.goalTitle")}</Text>
			{(["lose", "maintain", "gain"] as const).map((g) => (
				<SelectCard
					key={g}
					title={
						g === "lose"
							? t("goal.lose_short")
							: g === "gain"
								? t("goal.gain_short")
								: t("goal.maintain_short")
					}
					selected={goalType === g}
					onPress={() => {
						setGoalType(g);
						if (g === "maintain") setGoalRate(0);
					}}
				/>
			))}

			{goalType !== "maintain" && (
				<NumericInput
					label={t("profileScreen.pace")}
					value={Math.abs(goalRate)}
					onChangeValue={(v) => setGoalRate(goalType === "lose" ? -v : v)}
					unit={`${t("common.kg")}${t("common.perWeek")}`}
					decimal
					min={0.25}
					max={1}
				/>
			)}

			<NextButton
				label={saving ? t("common.saving") : t("common.save")}
				onPress={handleSave}
				disabled={saving}
			/>
		</ScrollView>
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
	toggleRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.xl,
	},
	toggle: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: radii.sm,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: "center",
	},
	toggleSelected: {
		borderColor: colors.primary,
		backgroundColor: `${colors.primary}15`,
	},
	toggleText: {
		fontSize: fontSize.lg,
		fontWeight: "600",
		color: colors.textMuted,
	},
	toggleTextSelected: {
		color: colors.primaryLight,
	},
});
