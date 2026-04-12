import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { mealItems, recipeItems, recipes } from "@/db/schema";
import { getOrCreateMeal } from "./meal-service";
import { createId } from "./nanoid";

export type RecipeKind = "template" | "recipe";

export type RecipeRow = typeof recipes.$inferSelect;
export type RecipeItemRow = typeof recipeItems.$inferSelect;

export interface RecipeWithItems extends RecipeRow {
	items: RecipeItemRow[];
}

export interface RecipeTotals {
	totalWeightG: number;
	kcal: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number | null;
}

export interface RecipeItemInput {
	foodId?: string | null;
	name: string;
	quantityG: number;
	kcal: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber?: number | null;
}

export interface RecipeInput {
	name: string;
	kind: RecipeKind;
	totalWeightG?: number | null;
	servingsDefault?: number | null;
	imageUrl?: string | null;
	notes?: string | null;
	items: RecipeItemInput[];
}

export function computeRecipeTotals(items: RecipeItemRow[]): RecipeTotals {
	const totals: RecipeTotals = {
		totalWeightG: 0,
		kcal: 0,
		protein: 0,
		carbs: 0,
		fat: 0,
		fiber: null,
	};
	let hasFiber = false;
	for (const it of items) {
		totals.totalWeightG += it.quantityG;
		totals.kcal += it.kcal;
		totals.protein += it.protein;
		totals.carbs += it.carbs;
		totals.fat += it.fat;
		if (it.fiber != null) {
			hasFiber = true;
			totals.fiber = (totals.fiber ?? 0) + it.fiber;
		}
	}
	if (!hasFiber) totals.fiber = null;
	return totals;
}

/**
 * Scale a recipe's totals down to a target weight (grams).
 * Uses the provided finalWeightG when known (cooked weight), otherwise the raw
 * sum of ingredient weights. Returns snapshot macros for insertion into meal_items.
 */
export function scaleToGrams(
	totals: RecipeTotals,
	finalWeightG: number | null,
	targetG: number,
): {
	kcal: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number | null;
} {
	const base =
		finalWeightG && finalWeightG > 0 ? finalWeightG : totals.totalWeightG;
	if (base <= 0) {
		return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: totals.fiber };
	}
	const factor = targetG / base;
	return {
		kcal: totals.kcal * factor,
		protein: totals.protein * factor,
		carbs: totals.carbs * factor,
		fat: totals.fat * factor,
		fiber: totals.fiber != null ? totals.fiber * factor : null,
	};
}

/** Convert a number of servings into grams, given the recipe's defaults. */
export function servingsToGrams(
	recipe: Pick<RecipeRow, "totalWeightG" | "servingsDefault">,
	servings: number,
): number | null {
	if (
		!recipe.totalWeightG ||
		!recipe.servingsDefault ||
		recipe.servingsDefault <= 0
	) {
		return null;
	}
	return (recipe.totalWeightG / recipe.servingsDefault) * servings;
}

export async function listRecipes(kind?: RecipeKind): Promise<RecipeRow[]> {
	const query = db.select().from(recipes);
	const rows = kind
		? await query
				.where(eq(recipes.kind, kind))
				.orderBy(desc(recipes.useCount), desc(recipes.updatedAt))
		: await query.orderBy(desc(recipes.useCount), desc(recipes.updatedAt));
	return rows;
}

export async function getTopTemplates(limit = 5): Promise<RecipeRow[]> {
	return db
		.select()
		.from(recipes)
		.where(eq(recipes.kind, "template"))
		.orderBy(desc(recipes.useCount), desc(recipes.lastUsedAt))
		.limit(limit);
}

export async function getRecipe(id: string): Promise<RecipeWithItems | null> {
	const [row] = await db
		.select()
		.from(recipes)
		.where(eq(recipes.id, id))
		.limit(1);
	if (!row) return null;
	const items = await db
		.select()
		.from(recipeItems)
		.where(eq(recipeItems.recipeId, id))
		.orderBy(asc(recipeItems.position), asc(recipeItems.id));
	return { ...row, items };
}

export async function getRecipeItems(
	recipeId: string,
): Promise<RecipeItemRow[]> {
	return db
		.select()
		.from(recipeItems)
		.where(eq(recipeItems.recipeId, recipeId))
		.orderBy(asc(recipeItems.position), asc(recipeItems.id));
}

export async function getRecipesByIds(ids: string[]): Promise<RecipeRow[]> {
	if (ids.length === 0) return [];
	return db.select().from(recipes).where(inArray(recipes.id, ids));
}

export async function createRecipe(input: RecipeInput): Promise<string> {
	const id = createId();
	const now = new Date().toISOString();
	await db.insert(recipes).values({
		id,
		name: input.name.trim(),
		kind: input.kind,
		totalWeightG: input.totalWeightG ?? null,
		servingsDefault: input.servingsDefault ?? null,
		imageUrl: input.imageUrl ?? null,
		notes: input.notes ?? null,
		useCount: 0,
		lastUsedAt: null,
		createdAt: now,
		updatedAt: now,
	});
	if (input.items.length > 0) {
		await db.insert(recipeItems).values(
			input.items.map((it, i) => ({
				recipeId: id,
				foodId: it.foodId ?? null,
				name: it.name,
				quantityG: it.quantityG,
				kcal: it.kcal,
				protein: it.protein,
				carbs: it.carbs,
				fat: it.fat,
				fiber: it.fiber ?? null,
				position: i,
			})),
		);
	}
	return id;
}

export interface RecipeUpdateInput {
	name?: string;
	totalWeightG?: number | null;
	servingsDefault?: number | null;
	imageUrl?: string | null;
	notes?: string | null;
	items?: RecipeItemInput[];
}

export async function updateRecipe(
	id: string,
	input: RecipeUpdateInput,
): Promise<void> {
	const now = new Date().toISOString();
	const patch: Record<string, unknown> = { updatedAt: now };
	if (input.name !== undefined) patch.name = input.name.trim();
	if (input.totalWeightG !== undefined) patch.totalWeightG = input.totalWeightG;
	if (input.servingsDefault !== undefined)
		patch.servingsDefault = input.servingsDefault;
	if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl;
	if (input.notes !== undefined) patch.notes = input.notes;
	await db.update(recipes).set(patch).where(eq(recipes.id, id));

	if (input.items) {
		await db.delete(recipeItems).where(eq(recipeItems.recipeId, id));
		if (input.items.length > 0) {
			await db.insert(recipeItems).values(
				input.items.map((it, i) => ({
					recipeId: id,
					foodId: it.foodId ?? null,
					name: it.name,
					quantityG: it.quantityG,
					kcal: it.kcal,
					protein: it.protein,
					carbs: it.carbs,
					fat: it.fat,
					fiber: it.fiber ?? null,
					position: i,
				})),
			);
		}
	}
}

export async function deleteRecipe(id: string): Promise<void> {
	await db.delete(recipes).where(eq(recipes.id, id));
}

export async function incrementRecipeUse(id: string): Promise<void> {
	await db
		.update(recipes)
		.set({
			useCount: sql`COALESCE(${recipes.useCount}, 0) + 1`,
			lastUsedAt: new Date().toISOString(),
		})
		.where(eq(recipes.id, id));
}

/** Snapshot a meal as a reusable template. Returns the new recipe id. */
export async function cloneMealAsTemplate(
	mealId: string,
	name: string,
): Promise<string> {
	const items = await db
		.select()
		.from(mealItems)
		.where(eq(mealItems.mealId, mealId));
	if (items.length === 0) {
		throw new Error("Cannot clone an empty meal");
	}
	return createRecipe({
		name,
		kind: "template",
		items: items.map((it) => ({
			foodId: it.foodId,
			name: it.name,
			quantityG: it.quantityG,
			kcal: it.kcal,
			protein: it.protein,
			carbs: it.carbs,
			fat: it.fat,
			fiber: it.fiber,
		})),
	});
}

/**
 * Expand a template into fresh meal_items on the target meal. Returns the
 * inserted meal_items ids so the caller can offer undo.
 */
export async function expandTemplateIntoMeal(
	templateId: string,
	date: string,
	mealType: "breakfast" | "lunch" | "dinner" | "snack",
): Promise<{ mealId: string; itemIds: string[] }> {
	const items = await getRecipeItems(templateId);
	if (items.length === 0) {
		throw new Error("Template has no items");
	}
	const mealId = await getOrCreateMeal(date, mealType);
	const now = new Date().toISOString();
	const rows = items.map((it) => ({
		id: createId(),
		mealId,
		foodId: it.foodId,
		servingId: null,
		recipeId: templateId,
		recipeSnapshotAt: now,
		recipeServings: null,
		name: it.name,
		quantityG: it.quantityG,
		kcal: it.kcal,
		protein: it.protein,
		carbs: it.carbs,
		fat: it.fat,
		fiber: it.fiber ?? null,
		createdAt: now,
	}));
	await db.insert(mealItems).values(rows);
	await incrementRecipeUse(templateId);
	return { mealId, itemIds: rows.map((r) => r.id) };
}

/** Remove previously inserted meal_items (used by undo toast). */
export async function undoExpandedItems(itemIds: string[]): Promise<void> {
	if (itemIds.length === 0) return;
	await db.delete(mealItems).where(inArray(mealItems.id, itemIds));
}

/**
 * Log a recipe as a single meal item, with macros scaled from its totals.
 * servings/quantityG: provide one; quantityG wins if both provided.
 */
export async function logRecipeAsMealItem(params: {
	recipeId: string;
	date: string;
	mealType: "breakfast" | "lunch" | "dinner" | "snack";
	quantityG: number;
	servings?: number | null;
}): Promise<string> {
	const recipe = await getRecipe(params.recipeId);
	if (!recipe) throw new Error("Recipe not found");
	const totals = computeRecipeTotals(recipe.items);
	const scaled = scaleToGrams(totals, recipe.totalWeightG, params.quantityG);

	const mealId = await getOrCreateMeal(params.date, params.mealType);
	const now = new Date().toISOString();
	const itemId = createId();
	await db.insert(mealItems).values({
		id: itemId,
		mealId,
		foodId: null,
		servingId: null,
		recipeId: recipe.id,
		recipeSnapshotAt: recipe.updatedAt,
		recipeServings: params.servings ?? null,
		name: recipe.name,
		quantityG: params.quantityG,
		kcal: scaled.kcal,
		protein: scaled.protein,
		carbs: scaled.carbs,
		fat: scaled.fat,
		fiber: scaled.fiber,
		createdAt: now,
	});
	await incrementRecipeUse(recipe.id);
	return itemId;
}

/** Case-insensitive prefix search over recipe names. */
export async function searchRecipes(
	query: string,
	opts: { kind?: RecipeKind; limit?: number } = {},
): Promise<RecipeRow[]> {
	const q = query.trim();
	if (q.length === 0) return [];
	const pattern = `%${q.toLowerCase()}%`;
	const limit = opts.limit ?? 10;
	if (opts.kind) {
		return db
			.select()
			.from(recipes)
			.where(
				sql`${recipes.kind} = ${opts.kind} AND lower(${recipes.name}) LIKE ${pattern}`,
			)
			.orderBy(desc(recipes.useCount), desc(recipes.updatedAt))
			.limit(limit);
	}
	return db
		.select()
		.from(recipes)
		.where(sql`lower(${recipes.name}) LIKE ${pattern}`)
		.orderBy(desc(recipes.useCount), desc(recipes.updatedAt))
		.limit(limit);
}
