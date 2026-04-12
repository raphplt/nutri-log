import NetInfo from "@react-native-community/netinfo";
import {
	type BarcodeScanningResult,
	CameraView,
	useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { isValidEan13 } from "@/lib/barcode";
import { getOrFetchByBarcode } from "@/lib/food-service";
import { countPendingScans, enqueueScan } from "@/lib/scan-queue";

const DEDUP_WINDOW_MS = 2000;

export default function ScanScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [permission, requestPermission] = useCameraPermissions();
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [torchOn, setTorchOn] = useState(false);
	const [manualOpen, setManualOpen] = useState(false);
	const [manualCode, setManualCode] = useState("");
	const [pendingCount, setPendingCount] = useState(0);
	const lastScanRef = useRef<{ code: string; at: number } | null>(null);

	const scanLineY = useSharedValue(0);

	useEffect(() => {
		scanLineY.value = withRepeat(
			withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
			-1,
			true,
		);
	}, [scanLineY]);

	useEffect(() => {
		countPendingScans().then(setPendingCount);
	}, []);

	const scanLineStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scanLineY.value * 150 }],
	}));

	if (!permission) {
		return (
			<View style={styles.center}>
				<ActivityIndicator color={colors.primary} />
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<SafeAreaView style={styles.center}>
				<Text style={styles.permText}>{t("scan.permRequired")}</Text>
				<Pressable onPress={requestPermission} style={styles.permButton}>
					<Text style={styles.permButtonText}>{t("scan.permAllow")}</Text>
				</Pressable>
				<Pressable onPress={() => router.back()} style={styles.cancelButton}>
					<Text style={styles.cancelText}>{t("common.cancel")}</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	const handleBarcode = async (code: string) => {
		if (processing) return;
		const now = Date.now();
		const last = lastScanRef.current;
		if (last && last.code === code && now - last.at < DEDUP_WINDOW_MS) return;
		lastScanRef.current = { code, at: now };

		if (code.length === 13 && !isValidEan13(code)) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			setError(t("scan.invalid"));
			setTimeout(() => setError(null), 2000);
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setProcessing(true);
		setError(null);

		try {
			const netState = await NetInfo.fetch();
			if (!netState.isConnected) {
				await enqueueScan(code);
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
				const count = await countPendingScans();
				setPendingCount(count);
				setProcessing(false);
				setTimeout(() => {
					lastScanRef.current = null;
				}, DEDUP_WINDOW_MS);
				return;
			}

			const food = await getOrFetchByBarcode(code);
			if (food) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				router.replace({
					pathname: "/add/confirm",
					params: { foodId: food.id },
				});
				return;
			}
			setError(t("scan.notFound"));
			setProcessing(false);
			setTimeout(() => {
				setError(null);
				lastScanRef.current = null;
			}, 2000);
		} catch {
			setError(t("common.networkError"));
			setProcessing(false);
			setTimeout(() => {
				setError(null);
				lastScanRef.current = null;
			}, 2000);
		}
	};

	const handleScan = (result: BarcodeScanningResult) => {
		handleBarcode(result.data);
	};

	const submitManual = () => {
		const code = manualCode.trim();
		if (!/^\d{13}$/.test(code) || !isValidEan13(code)) {
			Alert.alert(t("common.error"), t("scan.invalid"));
			return;
		}
		setManualOpen(false);
		setManualCode("");
		handleBarcode(code);
	};

	return (
		<View style={styles.container}>
			<CameraView
				style={StyleSheet.absoluteFillObject}
				facing="back"
				enableTorch={torchOn}
				barcodeScannerSettings={{
					barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
				}}
				onBarcodeScanned={processing ? undefined : handleScan}
			/>

			<View style={styles.dimTop} />
			<View style={styles.dimBottom} />
			<View style={styles.dimLeft} />
			<View style={styles.dimRight} />

			<SafeAreaView style={styles.overlay}>
				<View style={styles.topRow}>
					<Pressable onPress={() => router.back()} style={styles.pill}>
						<Text style={styles.pillText}>{t("common.close")}</Text>
					</Pressable>
					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							setTorchOn((v) => !v);
						}}
						style={[styles.pill, torchOn && styles.pillActive]}
					>
						<Text style={styles.pillText}>
							{torchOn ? t("scan.torchOff") : t("scan.torchOn")}
						</Text>
					</Pressable>
				</View>

				<View style={styles.scanFrame}>
					<View style={styles.scanCornerTL} />
					<View style={styles.scanCornerTR} />
					<View style={styles.scanCornerBL} />
					<View style={styles.scanCornerBR} />
					<Animated.View style={[styles.scanLine, scanLineStyle]} />
				</View>

				<View style={styles.bottom}>
					{pendingCount > 0 && (
						<Text style={styles.pendingBadge}>
							{pendingCount === 1
								? t("scan.pendingQueueOne")
								: t("scan.pendingQueueMany", { count: pendingCount })}
						</Text>
					)}
					{processing && (
						<ActivityIndicator color={colors.primary} size="large" />
					)}
					{error && <Text style={styles.errorText}>{error}</Text>}
					{!processing && !error && (
						<Text style={styles.hint}>{t("scan.hint")}</Text>
					)}
					<Pressable
						onPress={() => setManualOpen(true)}
						style={styles.manualButton}
					>
						<Text style={styles.manualButtonText}>{t("scan.manualEntry")}</Text>
					</Pressable>
				</View>
			</SafeAreaView>

			<Modal
				visible={manualOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setManualOpen(false)}
			>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>{t("scan.manualEntryTitle")}</Text>
						<TextInput
							style={styles.modalInput}
							placeholder={t("scan.manualEntryPlaceholder")}
							placeholderTextColor={colors.textDim}
							value={manualCode}
							onChangeText={setManualCode}
							keyboardType="numeric"
							maxLength={13}
							autoFocus
						/>
						<View style={styles.modalRow}>
							<Pressable
								onPress={() => {
									setManualOpen(false);
									setManualCode("");
								}}
								style={styles.modalBtnGhost}
							>
								<Text style={styles.modalBtnGhostText}>
									{t("common.cancel")}
								</Text>
							</Pressable>
							<Pressable onPress={submitManual} style={styles.modalBtn}>
								<Text style={styles.modalBtnText}>{t("common.confirm")}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 180;
const CORNER = {
	width: 24,
	height: 24,
	borderColor: colors.primary,
	position: "absolute" as const,
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#000" },
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},
	dimTop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: "35%",
		backgroundColor: "rgba(0,0,0,0.55)",
	},
	dimBottom: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: "45%",
		backgroundColor: "rgba(0,0,0,0.55)",
	},
	dimLeft: {
		position: "absolute",
		top: "35%",
		bottom: "45%",
		left: 0,
		width: "50%",
		marginRight: FRAME_WIDTH / 2,
		backgroundColor: "rgba(0,0,0,0.55)",
		transform: [{ translateX: -FRAME_WIDTH / 2 }],
	},
	dimRight: {
		position: "absolute",
		top: "35%",
		bottom: "45%",
		right: 0,
		width: "50%",
		marginLeft: FRAME_WIDTH / 2,
		backgroundColor: "rgba(0,0,0,0.55)",
		transform: [{ translateX: FRAME_WIDTH / 2 }],
	},
	overlay: {
		flex: 1,
		justifyContent: "space-between",
		padding: spacing.xl,
	},
	topRow: { flexDirection: "row", justifyContent: "space-between" },
	pill: {
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
	},
	pillActive: { backgroundColor: `${colors.primary}80` },
	pillText: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
	scanFrame: {
		width: FRAME_WIDTH,
		height: FRAME_HEIGHT,
		alignSelf: "center",
		overflow: "hidden",
	},
	scanCornerTL: {
		...CORNER,
		top: 0,
		left: 0,
		borderTopWidth: 3,
		borderLeftWidth: 3,
	},
	scanCornerTR: {
		...CORNER,
		top: 0,
		right: 0,
		borderTopWidth: 3,
		borderRightWidth: 3,
	},
	scanCornerBL: {
		...CORNER,
		bottom: 0,
		left: 0,
		borderBottomWidth: 3,
		borderLeftWidth: 3,
	},
	scanCornerBR: {
		...CORNER,
		bottom: 0,
		right: 0,
		borderBottomWidth: 3,
		borderRightWidth: 3,
	},
	scanLine: {
		position: "absolute",
		top: 15,
		left: 15,
		right: 15,
		height: 2,
		backgroundColor: colors.primary,
		shadowColor: colors.primary,
		shadowOpacity: 1,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 0 },
	},
	bottom: { alignItems: "center", paddingBottom: spacing.xxl, gap: spacing.md },
	hint: { color: colors.textMuted, fontSize: fontSize.md },
	errorText: {
		color: colors.danger,
		fontSize: fontSize.md,
		textAlign: "center",
	},
	pendingBadge: {
		color: colors.text,
		fontSize: fontSize.sm,
		backgroundColor: `${colors.warning}30`,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.md,
		borderRadius: radii.full,
		overflow: "hidden",
	},
	manualButton: {
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
	},
	manualButtonText: {
		color: colors.text,
		fontSize: fontSize.sm,
		fontWeight: "600",
	},
	permText: {
		color: colors.text,
		fontSize: fontSize.lg,
		marginBottom: spacing.lg,
	},
	permButton: {
		backgroundColor: colors.primary,
		borderRadius: radii.sm,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
		marginBottom: spacing.sm,
	},
	permButtonText: {
		color: colors.text,
		fontSize: fontSize.md,
		fontWeight: "600",
	},
	cancelButton: { paddingVertical: spacing.md },
	cancelText: { color: colors.textMuted, fontSize: fontSize.md },
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.xl,
	},
	modalCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.md,
		padding: spacing.xl,
		width: "100%",
		maxWidth: 400,
		gap: spacing.lg,
	},
	modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: "700" },
	modalInput: {
		backgroundColor: colors.background,
		borderRadius: radii.sm,
		padding: spacing.md,
		fontSize: fontSize.lg,
		color: colors.text,
		borderWidth: 1,
		borderColor: colors.border,
		letterSpacing: 2,
	},
	modalRow: {
		flexDirection: "row",
		gap: spacing.sm,
		justifyContent: "flex-end",
	},
	modalBtn: {
		backgroundColor: colors.primary,
		borderRadius: radii.sm,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
	},
	modalBtnText: {
		color: colors.text,
		fontSize: fontSize.md,
		fontWeight: "600",
	},
	modalBtnGhost: {
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
	},
	modalBtnGhostText: { color: colors.textMuted, fontSize: fontSize.md },
});
