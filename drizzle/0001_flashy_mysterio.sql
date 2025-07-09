ALTER TABLE "spotlights" ALTER COLUMN "links" SET DATA TYPE json USING links::json;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "stats" SET DATA TYPE json USING stats::json;