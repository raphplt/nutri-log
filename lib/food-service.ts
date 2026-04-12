import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { foods } from "@/db/schema";
import { createId } from "./nanoid";
import {
	fetchProductByBarcode,
	type OFFProduct,
	parseServing,
	searchProducts,
} from "./off-api";
import { searchLocal } from "./search-service";
import { applyServingPresets, ensureServings } from "./serving-service";

const OFF_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function offToFoodValues(p: OFFProduct) {
	const now = new Date().toISOString();
	return {
		id: createId(),
		source: "off" as const,
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
		nutriscoreGrade: p.nutriscoreGrade,
		novaGroup: p.novaGroup,
		useCount: 0,
		lastUsedAt: null,
		lastOffFetchAt: now,
		createdAt: now,
	};
}

export type FoodRow = typeof foods.$inferSelect;

function isFresh(row: FoodRow): boolean {
	if (!row.lastOffFetchAt) return false;
	return Date.now() - new Date(row.lastOffFetchAt).getTime() < OFF_CACHE_TTL_MS;
}

export async function getOrFetchByBarcode(
	barcode: string,
	signal?: AbortSignal,
): Promise<FoodRow | null> {
	const [local] = await db
		.select()
		.from(foods)
		.where(eq(foods.barcode, barcode))
		.limit(1);
	if (local && isFresh(local)) return local;

	try {
		const product = await fetchProductByBarcode(barcode, signal);
		if (!product) return local ?? null;

		if (local) {
			const now = new Date().toISOString();
			await db
				.update(foods)
				.set({
					name: product.name,
					brand: product.brand,
					imageUrl: product.imageUrl,
					kcalPer100g: product.kcalPer100g,
					proteinPer100g: product.proteinPer100g,
					carbsPer100g: product.carbsPer100g,
					fatPer100g: product.fatPer100g,
					fiberPer100g: product.fiberPer100g,
					defaultServingG: product.servingG ?? local.defaultServingG ?? 100,
					nutriscoreGrade: product.nutriscoreGrade,
					novaGroup: product.novaGroup,
					lastOffFetchAt: now,
				})
				.where(eq(foods.id, local.id));
			await ensureServings(
				local.id,
				parseServing(product.servingG, product.servingSize),
			);
			await applyServingPresets(local.id, product.name);
			const [updated] = await db
				.select()
				.from(foods)
				.where(eq(foods.id, local.id))
				.limit(1);
			return updated ?? local;
		}

		const values = offToFoodValues(product);
		await db.insert(foods).values(values);
		await ensureServings(
			values.id,
			parseServing(product.servingG, product.servingSize),
		);
		await applyServingPresets(values.id, values.name);
		return { ...values };
	} catch {
		return local ?? null;
	}
}

export async function searchFoods(
	query: string,
	signal?: AbortSignal,
): Promise<FoodRow[]> {
	const localResults = await searchLocal(query, { signal });

	const offResults: FoodRow[] = [];
	try {
		const offProducts = await searchProducts(query, { signal });
		const localBarcodes = new Set(
			localResults.map((f) => f.barcode).filter(Boolean),
		);
		for (const p of offProducts) {
			if (localBarcodes.has(p.code)) continue;
			offResults.push(offToFoodValues(p));
		}
	} catch {
		// Network failure is acceptable — local results still returned
	}

	return [...localResults, ...offResults];
}

export async function searchFoodsLocal(
	query: string,
	signal?: AbortSignal,
): Promise<FoodRow[]> {
	return searchLocal(query, { signal });
}

export async function searchFoodsRemote(
	query: string,
	existingBarcodes: Set<string>,
	signal?: AbortSignal,
): Promise<FoodRow[]> {
	try {
		const offProducts = await searchProducts(query, { signal });
		const out: FoodRow[] = [];
		for (const p of offProducts) {
			if (existingBarcodes.has(p.code)) continue;
			out.push(offToFoodValues(p));
		}
		return out;
	} catch {
		return [];
	}
}

export async function incrementUseCount(foodId: string) {
	await db
		.update(foods)
		.set({
			useCount: sql`${foods.useCount} + 1`,
			lastUsedAt: new Date().toISOString(),
		})
		.where(eq(foods.id, foodId));
}

export async function getFrequentFoods(limit = 10): Promise<FoodRow[]> {
	return db
		.select()
		.from(foods)
		.where(sql`${foods.useCount} > 0`)
		.orderBy(desc(foods.useCount))
		.limit(limit);
}
