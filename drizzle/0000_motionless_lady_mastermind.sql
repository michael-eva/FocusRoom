CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"activity_type" text NOT NULL,
	"target_id" integer,
	"target_type" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"target_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"user_id" integer,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_date_time" timestamp NOT NULL,
	"end_date_time" timestamp NOT NULL,
	"all_day" boolean DEFAULT false,
	"rsvp_link" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"google_event_id" text,
	"timezone" text
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"target_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer,
	"text" text NOT NULL,
	"votes" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer,
	"option_id" integer,
	"user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"task_id" integer,
	"resource_id" integer,
	"user_id" integer,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_team_members" (
	"project_id" integer,
	"team_member_id" integer,
	"role" text DEFAULT 'member',
	"joined_at" timestamp DEFAULT now(),
	"invited_by" integer
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"status" text,
	"progress" integer,
	"totalTasks" integer,
	"completedTasks" integer,
	"deadline" timestamp,
	"priority" text
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"type" text,
	"url" text,
	"description" text,
	"last_updated" timestamp,
	"project_id" integer
);
--> statement-breakpoint
CREATE TABLE "spotlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"location" text,
	"genre" text,
	"established" text,
	"links" text,
	"stats" text,
	"featured_since" timestamp DEFAULT now(),
	"is_current" boolean DEFAULT false,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"status" text,
	"priority" text,
	"deadline" timestamp,
	"completed_at" timestamp,
	"project_id" integer,
	"assignee_id" integer
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"avatar" text,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"role" text DEFAULT 'member',
	"invited_at" timestamp,
	"invited_by" integer,
	"accepted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_invited_by_team_members_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_team_members_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;