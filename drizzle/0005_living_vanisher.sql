ALTER TABLE `project_team_members` ADD `role` text DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `project_team_members` ADD `joined_at` integer;--> statement-breakpoint
ALTER TABLE `project_team_members` ADD `invited_by` integer REFERENCES team_members(id);--> statement-breakpoint
ALTER TABLE `team_members` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `users` ADD `invited_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `invited_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `users` ADD `accepted_at` integer;