CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member', 'moderator');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"action" text,
	"details" text,
	"timestamp" timestamp with time zone DEFAULT now(),
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_edited" boolean DEFAULT false,
	"reply_to_id" integer
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text,
	"clerk_user_id" text,
	"timestamp" timestamp with time zone DEFAULT now(),
	"post_id" integer,
	"event_id" integer,
	"poll_id" integer,
	"spotlight_id" integer
);
--> statement-breakpoint
CREATE TABLE "__drizzle_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"status" text,
	"clerk_user_id" text,
	"rsvp_date" timestamp with time zone DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"event_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"max_attendees" integer,
	"is_virtual" boolean DEFAULT false,
	"virtual_link" text,
	"event_type" text,
	"created_by_clerk_user_id" text,
	"timezone" text
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"post_id" integer,
	"poll_id" integer,
	"spotlight_id" integer,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now(),
	"sent_by_clerk_user_id" text NOT NULL,
	"recipient_count" integer NOT NULL,
	"content_summary" text,
	"emails_sent" integer DEFAULT 0,
	"emails_failed" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer,
	"votes" integer DEFAULT 0,
	"option_text" text
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer,
	"option_id" integer,
	"clerk_user_id" text,
	"voted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"question" text,
	"created_by_clerk_user_id" text,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by_clerk_user_id" text
);
--> statement-breakpoint
CREATE TABLE "project_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"task_id" integer,
	"resource_id" integer,
	"timestamp" timestamp with time zone DEFAULT now(),
	"clerk_user_id" text
);
--> statement-breakpoint
CREATE TABLE "project_team_members" (
	"project_id" integer,
	"role" text DEFAULT 'member',
	"joined_at" timestamp with time zone DEFAULT now(),
	"clerk_user_id" text,
	"invited_by_clerk_user_id" text
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
	"deadline" timestamp with time zone,
	"priority" text,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"type" text,
	"url" text,
	"description" text,
	"last_updated" timestamp with time zone,
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
	"featured_since" timestamp with time zone DEFAULT now(),
	"is_current" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by_clerk_user_id" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"status" text,
	"priority" text,
	"deadline" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"project_id" integer,
	"assignee_clerk_user_id" text
);
--> statement-breakpoint
CREATE TABLE "uat_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"clerk_user_id" text,
	"user_name" text,
	"user_email" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"notes" text
);
