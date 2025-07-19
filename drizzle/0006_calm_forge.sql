ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "event_rsvps" DROP CONSTRAINT "event_rsvps_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "likes" DROP CONSTRAINT "likes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "poll_votes" DROP CONSTRAINT "poll_votes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "polls" DROP CONSTRAINT "polls_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "project_activities" DROP CONSTRAINT "project_activities_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "project_team_members" DROP CONSTRAINT "project_team_members_invited_by_team_members_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "spotlights" DROP CONSTRAINT "spotlights_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "likes" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "poll_votes" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "created_by_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_by_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_activities" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "project_team_members" ALTER COLUMN "invited_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "created_by_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "user_id" SET DATA TYPE text;