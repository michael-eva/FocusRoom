import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import dotenv from "dotenv";
import { seedDatabase } from "./seed-database";

// Load environment variables
dotenv.config();

console.log("🚀 Starting database clear and seed process...");

async function main() {
  try {
    // Check for required environment variable
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    console.log("🔗 Connecting to PostgreSQL database...");

    // Create database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    const db = drizzle(pool);

    console.log("✅ Connected to database");

    // Run the seed function
    await seedDatabase(db);

    console.log("✅ Database clear and seed completed successfully!");

    // Close the connection
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
