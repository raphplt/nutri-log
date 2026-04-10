import { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { searchFoods, type FoodRow } from '@/lib/food-service';
import { colors, fontSize, spacing, radii } from '@/constants/theme';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    // Cancel previous
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (text.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Debounce 300ms
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const foods = await searchFoods(text, controller.signal);
        if (!controller.signal.aborted) {
          setResults(foods);
        }
      } catch {
        // aborted or network error
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelect = (food: FoodRow) => {
    router.push({
      pathname: '/add/confirm',
      params: { foodId: food.id, foodJson: JSON.stringify(food) },
    });
  };

  const renderItem = ({ item }: { item: FoodRow }) => (
    <Pressable onPress={() => handleSelect(item)} style={styles.resultRow}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        {item.brand && <Text style={styles.resultBrand} numberOfLines={1}>{item.brand}</Text>}
      </View>
      <Text style={styles.resultKcal}>{Math.round(item.kcalPer100g)} kcal</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Rechercher un aliment..."
        placeholderTextColor={colors.textDim}
        value={query}
        onChangeText={handleSearch}
        autoFocus
        returnKeyType="search"
      />

      {loading && (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text style={styles.empty}>Aucun résultat</Text>
          ) : null
        }
      />
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
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  resultInfo: { flex: 1, marginRight: spacing.md },
  resultName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  resultBrand: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  resultKcal: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
