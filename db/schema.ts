import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const foods = sqliteTable(
	"foods",
	{
		id: text("id").primaryKey(),
		source: text("source").notNull(), // 'off' | 'manual' | 'barcode'
		barcode: text("barcode"),
		name: text("name").notNull(),
		brand: text("brand"),
		imageUrl: text("image_url"),
		kcalPer100g: real("kcal_per_100g").notNull(),
		proteinPer100g: real("protein_per_100g").notNull(),
		carbsPer100g: real("carbs_per_100g").notNull(),
		fatPer100g: real("fat_per_100g").notNull(),
		fiberPer100g: real("fiber_per_100g"),
		defaultServingG: real("default_serving_g").default(100),
		nutriscoreGrade: text("nutriscore_grade"),
		novaGroup: integer("nova_group"),
		useCount: integer("use_count").default(0),
		lastUsedAt: text("last_used_at"),
		lastOffFetchAt: text("last_off_fetch_at"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("idx_foods_barcode").on(table.barcode),
		index("idx_foods_use_count").on(table.useCount),
	],
);

export const meals = sqliteTable(
	"meals",
	{
		id: text("id").primaryKey(),
		date: text("date").notNull(), // YYYY-MM-DD
		mealType: text("meal_type").notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
		createdAt: text("created_at").notNull(),
	},
	(table) => [index("idx_meals_date").on(table.date)],
);

export const mealItems = sqliteTable(
	"meal_items",
	{
		id: text("id").primaryKey(),
		mealId: text("meal_id")
			.notNull()
			.references(() => meals.id, { onDelete: "cascade" }),
		foodId: text("food_id").references(() => foods.id),
		servingId: integer("serving_id"),
		recipeId: text("recipe_id"),
		recipeSnapshotAt: text("recipe_snapshot_at"),
		recipeServings: real("recipe_servings"),
		name: text("name").notNull(),
		quantityG: real("quantity_g").notNull(),
		kcal: real("kcal").notNull(),
		protein: real("protein").notNull(),
		carbs: real("carbs").notNull(),
		fat: real("fat").notNull(),
		fiber: real("fiber"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("idx_meal_items_meal_id").on(table.mealId),
		index("idx_meal_items_recipe_id").on(table.recipeId),
	],
);

export const recipes = sqliteTable(
	"recipes",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		kind: text("kind").notNull(), // 'template' | 'recipe'
		totalWeightG: real("total_weight_g"),
		servingsDefault: real("servings_default"),
		imageUrl: text("image_url"),
		notes: text("notes"),
		useCount: integer("use_count").default(0),
		lastUsedAt: text("last_used_at"),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(table) => [
		index("idx_recipes_kind").on(table.kind),
		index("idx_recipes_use_count").on(table.useCount),
	],
);

export const recipeItems = sqliteTable(
	"recipe_items",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		recipeId: text("recipe_id")
			.notNull()
			.references(() => recipes.id, { onDelete: "cascade" }),
		foodId: text("food_id").references(() => foods.id),
		name: text("name").notNull(),
		quantityG: real("quantity_g").notNull(),
		kcal: real("kcal").notNull(),
		protein: real("protein").notNull(),
		carbs: real("carbs").notNull(),
		fat: real("fat").notNull(),
		fiber: real("fiber"),
		position: integer("position").notNull().default(0),
	},
	(table) => [index("idx_recipe_items_recipe_id").on(table.recipeId)],
);

export const foodServings = sqliteTable(
	"food_servings",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		foodId: text("food_id")
			.notNull()
			.references(() => foods.id, { onDelete: "cascade" }),
		label: text("label").notNull(),
		grams: real("grams").notNull(),
		isDefault: integer("is_default", { mode: "boolean" })
			.notNull()
			.default(false),
	},
	(table) => [index("idx_food_servings_food_id").on(table.foodId)],
);

export const userProfile = sqliteTable("user_profile", {
	id: text("id").primaryKey(), // always 'default'
	sex: text("sex").notNull(), // 'male' | 'female'
	birthDate: text("birth_date").notNull(), // YYYY-MM-DD
	heightCm: real("height_cm").notNull(),
	activityLevel: text("activity_level").notNull(), // 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
	trainingDaysPerWeek: integer("training_days_per_week").notNull().default(0),
	goal: text("goal").notNull(), // 'lose' | 'maintain' | 'gain'
	goalRate: real("goal_rate").default(0), // kg/week
	updatedAt: text("updated_at").notNull(),
});

export const weightLog = sqliteTable(
	"weight_log",
	{
		id: text("id").primaryKey(),
		date: text("date").notNull(), // YYYY-MM-DD
		weightKg: real("weight_kg").notNull(),
		createdAt: text("created_at").notNull(),
	},
	(table) => [uniqueIndex("idx_weight_log_date").on(table.date)],
);

export const userGoals = sqliteTable("user_goals", {
	id: text("id").primaryKey(),
	kcalTarget: integer("kcal_target").notNull(),
	proteinTargetG: integer("protein_target_g"),
	carbsTargetG: integer("carbs_target_g"),
	fatTargetG: integer("fat_target_g"),
	macroPreset: text("macro_preset").notNull().default("balanced"), // 'balanced' | 'high_protein' | 'low_carb' | 'custom'
	updatedAt: text("updated_at").notNull(),
});

export const reminderSettings = sqliteTable("reminder_settings", {
	id: text("id").primaryKey(),
	mealType: text("meal_type").notNull(),
	enabled: integer("enabled", { mode: "boolean" }).default(true),
	hour: integer("hour").notNull(),
	minute: integer("minute").notNull(),
});

export const appMeta = sqliteTable("app_meta", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});

export const scanQueue = sqliteTable(
	"scan_queue",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		barcode: text("barcode").notNull(),
		createdAt: integer("created_at").notNull(),
		resolvedAt: integer("resolved_at"),
	},
	(table) => [index("idx_scan_queue_resolved_at").on(table.resolvedAt)],
);
