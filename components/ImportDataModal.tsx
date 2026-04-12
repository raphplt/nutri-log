import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
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
import {
	BackupValidationError,
	type ImportResult,
	importAllDataJson,
} from "@/lib/data-import";

interface Props {
	visible: boolean;
	onClose: () => void;
	onImported: (result: ImportResult) => void;
	showWarning?: boolean;
}

export function ImportDataModal({
	visible,
	onClose,
	onImported,
	showWarning = true,
}: Props) {
	const { t } = useTranslation();
	const [raw, setRaw] = useState("");
	const [loading, setLoading] = useState(false);

	const reset = () => {
		setRaw("");
		setLoading(false);
	};

	const handleClose = () => {
		if (loading) return;
		reset();
		onClose();
	};

	const handleImport = async () => {
		if (loading || raw.trim().length === 0) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setLoading(true);
		try {
			const result = await importAllDataJson(raw);
			reset();
			onImported(result);
		} catch (err) {
			setLoading(false);
			const message =
				err instanceof BackupValidationError
					? t(`importData.errors.${err.message}`, {
							defaultValue: t("importData.errors.invalid-payload"),
						})
					: err instanceof Error
						? err.message
						: t("common.errorGeneric");
			Alert.alert(t("common.error"), message);
		}
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="formSheet"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.container}>
					<View style={styles.header}>
						<Text style={styles.title}>{t("importData.title")}</Text>
						<Pressable onPress={handleClose} style={styles.closeBtn}>
							<Text style={styles.closeLabel}>{t("common.close")}</Text>
						</Pressable>
					</View>

					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.content}
						keyboardShouldPersistTaps="handled"
					>
						<Text style={styles.description}>
							{t("importData.description")}
						</Text>

						{showWarning ? (
							<View style={styles.warning}>
								<Text style={styles.warningText}>
									{t("importData.warning")}
								</Text>
							</View>
						) : null}

						<TextInput
							style={styles.input}
							value={raw}
							onChangeText={setRaw}
							placeholder={t("importData.placeholder")}
							placeholderTextColor={colors.textDim}
							multiline
							autoCapitalize="none"
							autoCorrect={false}
							textAlignVertical="top"
						/>

						<Pressable
							onPress={handleImport}
							disabled={loading || raw.trim().length === 0}
							style={({ pressed }) => [
								styles.primaryBtn,
								(loading || raw.trim().length === 0) &&
									styles.primaryBtnDisabled,
								pressed && styles.primaryBtnPressed,
							]}
						>
							{loading ? (
								<ActivityIndicator color={colors.textInverse} />
							) : (
								<Text style={styles.primaryLabel}>
									{t("importData.submit")}
								</Text>
							)}
						</Pressable>
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	container: { flex: 1, backgroundColor: colors.background },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.lg,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	title: {
		fontSize: fontSize.lg,
		fontFamily: fonts.semibold,
		color: colors.text,
	},
	closeBtn: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
	},
	closeLabel: {
		fontSize: fontSize.md,
		color: colors.textMuted,
		fontFamily: fonts.medium,
	},
	scroll: { flex: 1 },
	content: {
		padding: spacing.xl,
		gap: spacing.lg,
	},
	description: {
		fontSize: fontSize.sm,
		color: colors.textMuted,
		lineHeight: 20,
	},
	warning: {
		backgroundColor: `${colors.warning}15`,
		borderRadius: radii.md,
		padding: spacing.md,
		borderLeftWidth: 3,
		borderLeftColor: colors.warning,
	},
	warningText: {
		fontSize: fontSize.sm,
		color: colors.warning,
		lineHeight: 20,
	},
	input: {
		minHeight: 180,
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.md,
		color: colors.text,
		fontSize: fontSize.xs,
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
		borderWidth: 1,
		borderColor: colors.border,
	},
	primaryBtn: {
		backgroundColor: colors.primary,
		paddingVertical: spacing.md,
		borderRadius: radii.md,
		alignItems: "center",
	},
	primaryBtnDisabled: { opacity: 0.4 },
	primaryBtnPressed: { opacity: 0.8 },
	primaryLabel: {
		fontSize: fontSize.md,
		fontFamily: fonts.semibold,
		color: colors.textInverse,
	},
});
