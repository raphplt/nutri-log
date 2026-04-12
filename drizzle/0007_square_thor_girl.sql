CREATE TABLE `recipe_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`food_id` text,
	`name` text NOT NULL,
	`quantity_g` real NOT NULL,
	`kcal` real NOT NULL,
	`protein` real NOT NULL,
	`carbs` real NOT NULL,
	`fat` real NOT NULL,
	`fiber` real,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_recipe_items_recipe_id` ON `recipe_items` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`total_weight_g` real,
	`servings_default` real,
	`image_url` text,
	`notes` text,
	`use_count` integer DEFAULT 0,
	`last_used_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_recipes_kind` ON `recipes` (`kind`);--> statement-breakpoint
CREATE INDEX `idx_recipes_use_count` ON `recipes` (`use_count`);--> statement-breakpoint
ALTER TABLE `meal_items` ADD `recipe_id` text;--> statement-breakpoint
ALTER TABLE `meal_items` ADD `recipe_snapshot_at` text;--> statement-breakpoint
ALTER TABLE `meal_items` ADD `recipe_servings` real;--> statement-breakpoint
CREATE INDEX `idx_meal_items_recipe_id` ON `meal_items` (`recipe_id`);