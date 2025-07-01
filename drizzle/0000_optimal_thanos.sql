CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`created_by_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_team_members` (
	`project_id` integer,
	`team_member_id` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`description` text,
	`status` text,
	`progress` integer,
	`totalTasks` integer,
	`completedTasks` integer,
	`deadline` integer,
	`priority` text
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`type` text,
	`url` text,
	`description` text,
	`last_updated` integer,
	`project_id` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`description` text,
	`status` text,
	`priority` text,
	`deadline` integer,
	`completed_at` integer,
	`project_id` integer,
	`assignee_id` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text,
	`avatar` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text
);
