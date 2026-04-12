CREATE TABLE `food_servings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` text NOT NULL,
	`label` text NOT NULL,
	`grams` real NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_food_servings_food_id` ON `food_servings` (`food_id`);--> statement-breakpoint
ALTER TABLE `meal_items` ADD `serving_id` integer;