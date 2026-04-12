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

export const BACKUP_VERSION = 1;

export interface BackupPayload {
	version: number;
	exportedAt: string;
	app: { name: string; version: number };
	data: {
		userProfile: (typeof userProfile.$inferSelect)[];
		userGoals: (typeof userGoals.$inferSelect)[];
		foods: (typeof foods.$inferSelect)[];
		foodServings: (typeof foodServings.$inferSelect)[];
		meals: (typeof meals.$inferSelect)[];
		mealItems: (typeof mealItems.$inferSelect)[];
		recipes: (typeof recipes.$inferSelect)[];
		recipeItems: (typeof recipeItems.$inferSelect)[];
		weightLog: (typeof weightLog.$inferSelect)[];
		reminderSettings: (typeof reminderSettings.$inferSelect)[];
		appMeta: (typeof appMeta.$inferSelect)[];
	};
}

export async function buildBackupPayload(): Promise<BackupPayload> {
	const [
		profileRows,
		goalsRows,
		foodsRows,
		servingsRows,
		mealsRows,
		mealItemsRows,
		recipesRows,
		recipeItemsRows,
		weightRows,
		remindersRows,
		metaRows,
	] = await Promise.all([
		db.select().from(userProfile),
		db.select().from(userGoals),
		db.select().from(foods),
		db.select().from(foodServings),
		db.select().from(meals),
		db.select().from(mealItems),
		db.select().from(recipes),
		db.select().from(recipeItems),
		db.select().from(weightLog),
		db.select().from(reminderSettings),
		db.select().from(appMeta),
	]);

	return {
		version: BACKUP_VERSION,
		exportedAt: new Date().toISOString(),
		app: { name: "nutrilog", version: 1 },
		data: {
			userProfile: profileRows,
			userGoals: goalsRows,
			foods: foodsRows,
			foodServings: servingsRows,
			meals: mealsRows,
			mealItems: mealItemsRows,
			recipes: recipesRows,
			recipeItems: recipeItemsRows,
			weightLog: weightRows,
			reminderSettings: remindersRows,
			appMeta: metaRows,
		},
	};
}

export async function exportAllDataJson(): Promise<string> {
	const payload = await buildBackupPayload();
	return JSON.stringify(payload);
}
