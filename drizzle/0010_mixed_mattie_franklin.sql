ALTER TABLE "activity_log" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "event_rsvps" ALTER COLUMN "rsvp_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_rsvps" ALTER COLUMN "rsvp_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "event_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "likes" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "likes" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poll_votes" ALTER COLUMN "voted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "poll_votes" ALTER COLUMN "voted_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "ends_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_activities" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_activities" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "project_team_members" ALTER COLUMN "joined_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_team_members" ALTER COLUMN "joined_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "deadline" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "last_updated" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "featured_since" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "featured_since" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "deadline" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;