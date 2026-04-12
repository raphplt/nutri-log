CREATE TABLE `scan_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barcode` text NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_scan_queue_resolved_at` ON `scan_queue` (`resolved_at`);