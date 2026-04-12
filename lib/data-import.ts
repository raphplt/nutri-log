import { db } from "@/db/client";
import {
	appMeta,
	foodServings,
	foods,
	mealItems,
	meals,
	recipeItems,
	recipes,
	reminderSettings,
	userGoals,
	userProfile,
	weightLog,
} from "@/db/schema";
import { BACKUP_VERSION, type BackupPayload } from "@/lib/data-export";
import { scheduleAllReminders } from "@/lib/reminders";

export class BackupValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BackupValidationError";
	}
}

function ensureArray(value: unknown, key: string): unknown[] {
	if (!Array.isArray(value)) {
		throw new BackupValidationError(`Expected array at data.${key}`);
	}
	return value;
}

function parseAndValidate(raw: string): BackupPayload {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new BackupValidationError("invalid-json");
	}

	if (typeof parsed !== "object" || parsed === null) {
		throw new BackupValidationError("invalid-payload");
	}
	const obj = parsed as Record<string, unknown>;
	if (typeof obj.version !== "number") {
		throw new BackupValidationError("missing-version");
	}
	if (obj.version > BACKUP_VERSION) {
		throw new BackupValidationError("version-too-new");
	}
	if (typeof obj.data !== "object" || obj.data === null) {
		throw new BackupValidationError("missing-data");
	}
	const data = obj.data as Record<string, unknown>;
	const keys = [
		"userProfile",
		"userGoals",
		"foods",
		"foodServings",
		"meals",
		"mealItems",
		"recipes",
		"recipeItems",
		"weightLog",
		"reminderSettings",
		"appMeta",
	] as const;
	for (const k of keys) ensureArray(data[k], k);

	return parsed as BackupPayload;
}

export interface ImportResult {
	mealsCount: number;
	mealItemsCount: number;
	recipesCount: number;
	weightLogCount: number;
	foodsCount: number;
}

const INSERT_CHUNK = 100;

async function bulkInsert<T>(
	rows: T[],
	insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
	if (rows.length === 0) return;
	for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
		await insert(rows.slice(i, i + INSERT_CHUNK));
	}
}

export async function importAllDataJson(raw: string): Promise<ImportResult> {
	const payload = parseAndValidate(raw);
	const d = payload.data;

	await db.delete(mealItems);
	await db.delete(meals);
	await db.delete(recipeItems);
	await db.delete(recipes);
	await db.delete(foodServings);
	await db.delete(foods);
	await db.delete(weightLog);
	await db.delete(userGoals);
	await db.delete(userProfile);
	await db.delete(reminderSettings);
	await db.delete(appMeta);

	if (d.foods.length > 0) {
		await bulkInsert(d.foods, (chunk) => db.insert(foods).values(chunk));
	}
	if (d.foodServings.length > 0) {
		await bulkInsert(d.foodServings, (chunk) =>
			db.insert(foodServings).values(chunk.map(({ id: _id, ...rest }) => rest)),
		);
	}
	if (d.recipes.length > 0) {
		await bulkInsert(d.recipes, (chunk) => db.insert(recipes).values(chunk));
	}
	if (d.recipeItems.length > 0) {
		await bulkInsert(d.recipeItems, (chunk) =>
			db.insert(recipeItems).values(chunk.map(({ id: _id, ...rest }) => rest)),
		);
	}
	if (d.meals.length > 0) {
		await bulkInsert(d.meals, (chunk) => db.insert(meals).values(chunk));
	}
	if (d.mealItems.length > 0) {
		await bulkInsert(d.mealItems, (chunk) =>
			db.insert(mealItems).values(chunk),
		);
	}
	if (d.weightLog.length > 0) {
		await bulkInsert(d.weightLog, (chunk) =>
			db.insert(weightLog).values(chunk),
		);
	}
	if (d.userProfile.length > 0) {
		await db.insert(userProfile).values(d.userProfile);
	}
	if (d.userGoals.length > 0) {
		await db.insert(userGoals).values(d.userGoals);
	}
	if (d.reminderSettings.length > 0) {
		await db.insert(reminderSettings).values(d.reminderSettings);
	}
	if (d.appMeta.length > 0) {
		await db.insert(appMeta).values(d.appMeta);
	}

	await scheduleAllReminders(
		d.reminderSettings.map((r) => ({
			mealType: r.mealType,
			enabled: r.enabled ?? true,
			hour: r.hour,
			minute: r.minute,
		})),
	);

	return {
		mealsCount: d.meals.length,
		mealItemsCount: d.mealItems.length,
		recipesCount: d.recipes.length,
		weightLogCount: d.weightLog.length,
		foodsCount: d.foods.length,
	};
}
