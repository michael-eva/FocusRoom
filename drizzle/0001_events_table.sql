CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`start_date_time` integer NOT NULL,
	`end_date_time` integer NOT NULL,
	`all_day` integer DEFAULT false,
	`rsvp_link` text,
	`created_by_id` integer,
	`created_at` integer,
	`updated_at` integer,
	`google_event_id` text,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
