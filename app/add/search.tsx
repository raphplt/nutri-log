import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { FoodQualityBadges } from "@/components/FoodQualityBadges";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import {
	type FoodRow,
	getFrequentFoods,
	searchFoodsLocal,
	searchFoodsRemote,
} from "@/lib/food-service";
import { getRecentSearches, recordSearchHistory } from "@/lib/search-service";

const DEBOUNCE_MS = 250;

export default function SearchScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<FoodRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [frequentFoods, setFrequentFoods] = useState<FoodRow[]>([]);
	const abortRef = useRef<AbortController | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		Promise.all([getRecentSearches(5), getFrequentFoods(8)]).then(([r, f]) => {
			setRecentSearches(r);
			setFrequentFoods(f);
		});
	}, []);

	const runSearch = useCallback(async (text: string) => {
		if (abortRef.current) abortRef.current.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setLoading(true);
		try {
			const local = await searchFoodsLocal(text, controller.signal);
			if (controller.signal.aborted) return;
			setResults(local);

			const existing = new Set(
				local.map((f) => f.barcode).filter((b): b is string => !!b),
			);
			const remote = await searchFoodsRemote(text, existing, controller.signal);
			if (controller.signal.aborted) return;
			if (remote.length > 0) {
				setResults([...local, ...remote]);
			}
			recordSearchHistory(text);
		} finally {
			if (!controller.signal.aborted) setLoading(false);
		}
	}, []);

	const handleQueryChange = useCallback(
		(text: string) => {
			setQuery(text);
			if (timerRef.current) clearTimeout(timerRef.current);
			if (abortRef.current) abortRef.current.abort();

			if (text.length < 2) {
				setResults([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			timerRef.current = setTimeout(() => {
				runSearch(text);
			}, DEBOUNCE_MS);
		},
		[runSearch],
	);

	const handleSelect = (food: FoodRow) => {
		router.push({
			pathname: "/add/confirm",
			params: { foodId: food.id, foodJson: JSON.stringify(food) },
		});
	};

	const handleRecent = (q: string) => {
		setQuery(q);
		runSearch(q);
	};

	const renderItem = ({ item }: { item: FoodRow }) => (
		<Pressable onPress={() => handleSelect(item)} style={styles.resultRow}>
			{item.imageUrl ? (
				<Image
					source={{ uri: item.imageUrl }}
					style={styles.thumb}
					contentFit="cover"
					cachePolicy="memory-disk"
					transition={180}
					recyclingKey={item.id}
				/>
			) : (
				<View style={[styles.thumb, styles.thumbPlaceholder]} />
			)}
			<View style={styles.resultInfo}>
				<View style={styles.nameRow}>
					<Text style={styles.resultName} numberOfLines={1}>
						{item.name}
					</Text>
					{item.source === "ciqual" && (
						<Text style={styles.rawBadge}>{t("search.rawFood")}</Text>
					)}
				</View>
				{item.brand && (
					<Text style={styles.resultBrand} numberOfLines={1}>
						{item.brand}
					</Text>
				)}
				<View style={styles.resultBadges}>
					<FoodQualityBadges
						nutriscoreGrade={item.nutriscoreGrade}
						novaGroup={item.novaGroup}
						compact
					/>
				</View>
			</View>
			<Text style={styles.resultKcal}>
				{Math.round(item.kcalPer100g)} {t("common.kcal")}
			</Text>
		</Pressable>
	);

	const showSuggestions = query.length < 2;

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				placeholder={t("search.placeholder")}
				placeholderTextColor={colors.textDim}
				value={query}
				onChangeText={handleQueryChange}
				autoFocus
				returnKeyType="search"
			/>

			{loading && (
				<ActivityIndicator color={colors.primary} style={styles.loader} />
			)}

			{showSuggestions ? (
				<FlatList
					data={[]}
					renderItem={null as never}
					keyExtractor={() => ""}
					ListHeaderComponent={
						<View style={styles.suggestions}>
							{recentSearches.length > 0 && (
								<View style={styles.suggestionBlock}>
									<Text style={styles.sectionLabel}>{t("search.recent")}</Text>
									{recentSearches.map((q) => (
										<Pressable
											key={q}
											onPress={() => handleRecent(q)}
											style={styles.chip}
										>
											<Text style={styles.chipText}>{q}</Text>
										</Pressable>
									))}
								</View>
							)}
							{frequentFoods.length > 0 && (
								<View style={styles.suggestionBlock}>
									<Text style={styles.sectionLabel}>
										{t("search.frequent")}
									</Text>
									{frequentFoods.map((f) => (
										<Pressable
											key={f.id}
											onPress={() => handleSelect(f)}
											style={styles.resultRow}
										>
											<View style={styles.resultInfo}>
												<Text style={styles.resultName} numberOfLines={1}>
													{f.name}
												</Text>
												{f.brand && (
													<Text style={styles.resultBrand} numberOfLines={1}>
														{f.brand}
													</Text>
												)}
											</View>
											<Text style={styles.resultKcal}>
												{Math.round(f.kcalPer100g)} {t("common.kcal")}
											</Text>
										</Pressable>
									))}
								</View>
							)}
						</View>
					}
					keyboardShouldPersistTaps="handled"
				/>
			) : (
				<FlatList
					data={results}
					keyExtractor={(item) => item.id}
					renderItem={renderItem}
					contentContainerStyle={styles.list}
					keyboardShouldPersistTaps="handled"
					ListEmptyComponent={
						query.length >= 2 && !loading ? (
							<Text style={styles.empty}>{t("search.empty")}</Text>
						) : null
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	input: {
		backgroundColor: colors.surface,
		borderRadius: radii.sm,
		margin: spacing.lg,
		padding: spacing.md,
		fontSize: fontSize.lg,
		color: colors.text,
		borderWidth: 1,
		borderColor: colors.border,
	},
	loader: { marginVertical: spacing.md },
	list: { paddingHorizontal: spacing.lg },
	suggestions: { paddingHorizontal: spacing.lg },
	suggestionBlock: { marginBottom: spacing.xl },
	sectionLabel: {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: spacing.sm,
	},
	chip: {
		backgroundColor: colors.surface,
		borderRadius: radii.full,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		marginBottom: spacing.xs,
		alignSelf: "flex-start",
	},
	chipText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
	resultRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: radii.sm,
		padding: spacing.lg,
		marginBottom: spacing.sm,
	},
	resultInfo: { flex: 1, marginRight: spacing.md },
	nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	resultName: {
		fontSize: fontSize.md,
		fontWeight: "600",
		color: colors.text,
		flexShrink: 1,
	},
	rawBadge: { fontSize: fontSize.xs, color: colors.textMuted },
	resultBrand: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
	resultBadges: { marginTop: 4 },
	resultKcal: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
	thumb: {
		width: 44,
		height: 44,
		borderRadius: radii.sm,
		marginRight: spacing.md,
		backgroundColor: colors.background,
	},
	thumbPlaceholder: { backgroundColor: colors.border },
	empty: {
		textAlign: "center",
		color: colors.textMuted,
		marginTop: spacing.xl,
	},
});
