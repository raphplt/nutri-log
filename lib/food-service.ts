import { eq, desc, like, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { foods } from '@/db/schema';
import { createId } from './nanoid';
import { fetchProductByBarcode, searchProducts, type OFFProduct } from './off-api';

function offToFoodValues(p: OFFProduct) {
  return {
    id: createId(),
    source: 'off' as const,
    barcode: p.code,
    name: p.name,
    brand: p.brand,
    imageUrl: p.imageUrl,
    kcalPer100g: p.kcalPer100g,
    proteinPer100g: p.proteinPer100g,
    carbsPer100g: p.carbsPer100g,
    fatPer100g: p.fatPer100g,
    fiberPer100g: p.fiberPer100g,
    defaultServingG: p.servingG ?? 100,
    useCount: 0,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
  };
}

export type FoodRow = typeof foods.$inferSelect;

/** Lookup local cache first, then fetch OFF if not found. Returns the food row. */
export async function getOrFetchByBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<FoodRow | null> {
  // Check local cache
  const [local] = await db.select().from(foods).where(eq(foods.barcode, barcode)).limit(1);
  if (local) return local;

  // Fetch from OFF
  const product = await fetchProductByBarcode(barcode, signal);
  if (!product) return null;

  // Insert into cache
  const values = offToFoodValues(product);
  await db.insert(foods).values(values);

  return { ...values, useCount: 0, lastUsedAt: null };
}

/** Hybrid search: local foods by useCount first, then OFF API as fallback. */
export async function searchFoods(
  query: string,
  signal?: AbortSignal,
): Promise<FoodRow[]> {
  // Local search
  const localResults = await db
    .select()
    .from(foods)
    .where(like(foods.name, `%${query}%`))
    .orderBy(desc(foods.useCount))
    .limit(10);

  // OFF search (in parallel, but don't block on error)
  let offResults: FoodRow[] = [];
  try {
    const offProducts = await searchProducts(query, 1, signal);
    // Filter out products already in local results
    const localBarcodes = new Set(localResults.map((f) => f.barcode).filter(Boolean));
    for (const p of offProducts) {
      if (localBarcodes.has(p.code)) continue;
      const values = offToFoodValues(p);
      offResults.push({ ...values, useCount: 0, lastUsedAt: null });
    }
  } catch {
    // Network error is fine, we still have local results
  }

  return [...localResults, ...offResults];
}

/** Increment useCount and update lastUsedAt for a food. */
export async function incrementUseCount(foodId: string) {
  await db
    .update(foods)
    .set({
      useCount: sql`${foods.useCount} + 1`,
      lastUsedAt: new Date().toISOString(),
    })
    .where(eq(foods.id, foodId));
}

/** Get top N most used foods. */
export async function getFrequentFoods(limit = 10): Promise<FoodRow[]> {
  return db
    .select()
    .from(foods)
    .where(sql`${foods.useCount} > 0`)
    .orderBy(desc(foods.useCount))
    .limit(limit);
}
