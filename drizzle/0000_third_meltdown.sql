CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`brand` text,
	`image_url` text,
	`kcal_per_100g` real NOT NULL,
	`protein_per_100g` real NOT NULL,
	`carbs_per_100g` real NOT NULL,
	`fat_per_100g` real NOT NULL,
	`fiber_per_100g` real,
	`default_serving_g` real DEFAULT 100,
	`use_count` integer DEFAULT 0,
	`last_used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_foods_barcode` ON `foods` (`barcode`);--> statement-breakpoint
CREATE INDEX `idx_foods_use_count` ON `foods` (`use_count`);--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` text PRIMARY KEY NOT NULL,
	`meal_id` text NOT NULL,
	`food_id` text,
	`name` text NOT NULL,
	`quantity_g` real NOT NULL,
	`kcal` real NOT NULL,
	`protein` real NOT NULL,
	`carbs` real NOT NULL,
	`fat` real NOT NULL,
	`fiber` real,
	`created_at` text NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meal_items_meal_id` ON `meal_items` (`meal_id`);--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`meal_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_meals_date` ON `meals` (`date`);--> statement-breakpoint
CREATE TABLE `reminder_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`meal_type` text NOT NULL,
	`enabled` integer DEFAULT true,
	`hour` integer NOT NULL,
	`minute` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`kcal_target` integer NOT NULL,
	`protein_target_g` integer,
	`carbs_target_g` integer,
	`fat_target_g` integer,
	`macro_preset` text DEFAULT 'balanced' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`sex` text NOT NULL,
	`birth_date` text NOT NULL,
	`height_cm` real NOT NULL,
	`activity_level` text NOT NULL,
	`training_days_per_week` integer DEFAULT 0 NOT NULL,
	`goal` text NOT NULL,
	`goal_rate` real DEFAULT 0,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weight_log` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weight_log_date` ON `weight_log` (`date`);