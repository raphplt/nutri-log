import {
	type BarcodeScanningResult,
	CameraView,
	useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { getOrFetchByBarcode } from "@/lib/food-service";

export default function ScanScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	const handleScan = async (result: BarcodeScanningResult) => {
		if (scanned || loading) return;
		setScanned(true);
		setLoading(true);
		setError(null);

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		try {
			const food = await getOrFetchByBarcode(result.data);
			if (food) {
				router.replace({
					pathname: "/add/confirm",
					params: { foodId: food.id },
				});
			} else {
				setError(t("scan.notFound"));
				setLoading(false);
				setTimeout(() => setScanned(false), 2000);
			}
		} catch {
			setError(t("common.networkError"));
			setLoading(false);
			setTimeout(() => setScanned(false), 2000);
		}
	};

	return (
		<View style={styles.container}>
			<CameraView
				style={StyleSheet.absoluteFillObject}
				facing="back"
				barcodeScannerSettings={{
					barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
				}}
				onBarcodeScanned={scanned ? undefined : handleScan}
			/>

			<SafeAreaView style={styles.overlay}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<Text style={styles.backText}>{t("common.close")}</Text>
				</Pressable>

				<View style={styles.scanFrame}>
					<View style={styles.scanCornerTL} />
					<View style={styles.scanCornerTR} />
					<View style={styles.scanCornerBL} />
					<View style={styles.scanCornerBR} />
				</View>

				<View style={styles.bottom}>
					{loading && <ActivityIndicator color={colors.primary} size="large" />}
					{error && <Text style={styles.errorText}>{error}</Text>}
					{!loading && !error && (
						<Text style={styles.hint}>{t("scan.hint")}</Text>
					)}
				</View>
			</SafeAreaView>
		</View>
	);
}

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
	overlay: {
		flex: 1,
		justifyContent: "space-between",
		padding: spacing.xl,
	},
	backButton: {
		alignSelf: "flex-start",
		backgroundColor: "rgba(0,0,0,0.5)",
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
	},
	backText: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
	scanFrame: {
		width: 260,
		height: 160,
		alignSelf: "center",
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
	bottom: {
		alignItems: "center",
		paddingBottom: spacing.xxl,
	},
	hint: { color: colors.textMuted, fontSize: fontSize.md },
	errorText: {
		color: colors.danger,
		fontSize: fontSize.md,
		textAlign: "center",
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
});
