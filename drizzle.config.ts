import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { env } from "~/env";

// Load environment-specific .env file
const envFile =
  env.NODE_ENV === "production" ? ".env.production" : ".env.local";
config({ path: envFile });

// Fallback to .env.local if DATABASE_URL is not found
if (!env.DATABASE_URL) {
  config({ path: ".env.local" });
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
