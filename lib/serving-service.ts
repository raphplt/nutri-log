import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { foodServings, foods } from "@/db/schema";
import { getMeta, setMeta } from "./app-meta";
import { findServingPreset } from "./serving-presets";

export type FoodServingRow = typeof foodServings.$inferSelect;

const DEFAULT_LABEL_100G = "100 g";
const PRESET_SEED_FLAG = "serving_presets_seeded_v1";
const BULK_CHUNK = 100;

export async function getServingsForFood(
	foodId: string,
): Promise<FoodServingRow[]> {
	return db.select().from(foodServings).where(eq(foodServings.foodId, foodId));
}

function isHundredGram(s: Pick<FoodServingRow, "grams">): boolean {
	return Math.abs(s.grams - 100) < 0.5;
}

/**
 * Ensure a food has at least a 100 g default serving, plus an optional parsed
 * portion. Idempotent: won't duplicate if already present.
 */
export async function ensureServings(
	foodId: string,
	extra?: { label: string; grams: number } | null,
): Promise<void> {
	const existing = await getServingsForFood(foodId);
	const hasHundred = existing.some(isHundredGram);

	if (!hasHundred) {
		await db.insert(foodServings).values({
			foodId,
			label: DEFAULT_LABEL_100G,
			grams: 100,
			isDefault: !extra,
		});
	}

	if (extra && extra.grams > 0) {
		const duplicate = existing.some(
			(s) => Math.abs(s.grams - extra.grams) < 0.01 && s.label === extra.label,
		);
		if (!duplicate) {
			await db.insert(foodServings).values({
				foodId,
				label: extra.label,
				grams: extra.grams,
				isDefault: true,
			});
		}
	}
}

/**
 * Apply the curated preset matching the food's name, if any, and if the food
 * doesn't already carry a non-100 g custom serving. When a preset supplies a
 * default unit serving, the previous default (typically 100 g) is demoted so
 * the stepper becomes the initial UI.
 */
export async function applyServingPresets(
	foodId: string,
	name: string,
): Promise<boolean> {
	const existing = await getServingsForFood(foodId);
	const hasCustom = existing.some((s) => !isHundredGram(s));
	if (hasCustom) return false;

	const preset = findServingPreset(name);
	if (!preset) return false;

	const rowsToInsert = preset.servings.filter(
		(s) =>
			!existing.some(
				(e) => Math.abs(e.grams - s.grams) < 0.01 && e.label === s.label,
			),
	);
	if (rowsToInsert.length === 0) return false;

	await db.insert(foodServings).values(
		rowsToInsert.map((s) => ({
			foodId,
			label: s.label,
			grams: s.grams,
			isDefault: s.isDefault ?? false,
			isUnit: s.isUnit ?? false,
		})),
	);

	const presetSetsDefault = preset.servings.some((s) => s.isDefault);
	if (presetSetsDefault) {
		const existingDefaultIds = existing
			.filter((e) => e.isDefault)
			.map((e) => e.id);
		if (existingDefaultIds.length > 0) {
			await db
				.update(foodServings)
				.set({ isDefault: false })
				.where(inArray(foodServings.id, existingDefaultIds));
		}
	}

	return true;
}

/**
 * One-shot backfill: walk every food currently in the DB and apply serving
 * presets. Guarded by an app_meta flag so it only runs once per install. Safe
 * to call from _layout after ciqual seeding.
 */
export async function seedServingPresetsIfNeeded(): Promise<{
	seeded: boolean;
	matched: number;
}> {
	const flag = await getMeta(PRESET_SEED_FLAG);
	if (flag) return { seeded: false, matched: 0 };

	const allFoods = await db
		.select({ id: foods.id, name: foods.name })
		.from(foods);
	const allServings = await db.select().from(foodServings);

	const byFood = new Map<string, FoodServingRow[]>();
	for (const s of allServings) {
		const list = byFood.get(s.foodId);
		if (list) list.push(s);
		else byFood.set(s.foodId, [s]);
	}

	const toInsert: Array<{
		foodId: string;
		label: string;
		grams: number;
		isDefault: boolean;
		isUnit: boolean;
	}> = [];
	const demoteDefaultIds: number[] = [];
	let matched = 0;

	for (const f of allFoods) {
		const existing = byFood.get(f.id) ?? [];
		if (existing.some((s) => !isHundredGram(s))) continue;

		const preset = findServingPreset(f.name);
		if (!preset) continue;

		const rows = preset.servings.filter(
			(s) =>
				!existing.some(
					(e) => Math.abs(e.grams - s.grams) < 0.01 && e.label === s.label,
				),
		);
		if (rows.length === 0) continue;
		matched += 1;

		for (const s of rows) {
			toInsert.push({
				foodId: f.id,
				label: s.label,
				grams: s.grams,
				isDefault: s.isDefault ?? false,
				isUnit: s.isUnit ?? false,
			});
		}
		if (preset.servings.some((s) => s.isDefault)) {
			for (const e of existing) {
				if (e.isDefault) demoteDefaultIds.push(e.id);
			}
		}
	}

	for (let i = 0; i < toInsert.length; i += BULK_CHUNK) {
		await db.insert(foodServings).values(toInsert.slice(i, i + BULK_CHUNK));
	}

	if (demoteDefaultIds.length > 0) {
		for (let i = 0; i < demoteDefaultIds.length; i += BULK_CHUNK) {
			await db
				.update(foodServings)
				.set({ isDefault: false })
				.where(
					and(
						inArray(foodServings.id, demoteDefaultIds.slice(i, i + BULK_CHUNK)),
						eq(foodServings.isUnit, false),
					),
				);
		}
	}

	await setMeta(PRESET_SEED_FLAG, String(Date.now()));
	return { seeded: true, matched };
}
