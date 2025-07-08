CREATE TABLE `spotlights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image` text,
	`location` text,
	`genre` text,
	`established` text,
	`links` text,
	`stats` text,
	`featured_since` integer,
	`is_current` integer DEFAULT false,
	`created_by_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
