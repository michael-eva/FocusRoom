CREATE TABLE "task_assignees" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"clerk_user_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"assigned_by_clerk_user_id" text
);
