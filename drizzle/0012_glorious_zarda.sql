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
