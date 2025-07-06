import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { seedDatabase } from "./seed-database";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// This script can be run with: node scripts/run-seed.js
// You'll need to pass the database instance when calling this

console.log("🚀 Starting database clear and seed process...");

// Note: This script is a template. You'll need to modify it based on your database setup
// For example, if using D1, you might need to pass the D1 instance
// For local development, you might need to connect to your local database

async function main() {
  try {
    // Check for required environment variable
    if (!process.env.DB_FILE_NAME) {
      throw new Error("DB_FILE_NAME environment variable is required");
    }

    // Create database connection
    const client = createClient({
      url: process.env.DB_FILE_NAME.startsWith("file:")
        ? process.env.DB_FILE_NAME
        : `file:${process.env.DB_FILE_NAME}`,
    });

    const db = drizzle(client);

    // Run the seed function
    await seedDatabase(db);

    console.log("✅ Database clear and seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
