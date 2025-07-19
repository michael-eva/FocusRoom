CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_status" "invitation_status" DEFAULT 'pending';