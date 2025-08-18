import postgres from "postgres";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function verifyDatabase() {
  try {
    console.log("🔍 Checking current database state...");
    console.log(
      "Database URL:",
      connectionString.replace(/:[^:@]*@/, ":****@"),
    ); // Hide password

    // Check current database name
    const dbName = await client`SELECT current_database() as db_name;`;
    console.log("Current database:", dbName[0]?.db_name);

    // List all tables
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log("\n📋 Tables in current database:");
    if (tables.length === 0) {
      console.log("No tables found");
    } else {
      tables.forEach((table) => {
        console.log(`- ${table.table_name}`);
      });
    }

    // Check if this looks like a fitness app or FocusRoom app
    const fitnessTables = [
      "workout",
      "workout_plan",
      "pilates_videos",
      "personal_trainer_interactions",
    ];
    const focusRoomTables = [
      "chat_messages",
      "spotlights",
      "events",
      "projects",
      "tasks",
    ];

    const hasFitnessTables = fitnessTables.some((table) =>
      tables.some((t) => t.table_name === table),
    );
    const hasFocusRoomTables = focusRoomTables.some((table) =>
      tables.some((t) => t.table_name === table),
    );

    console.log("\n🔍 Analysis:");
    if (hasFitnessTables && !hasFocusRoomTables) {
      console.log(
        "❌ This appears to be a fitness/workout application database",
      );
      console.log("   The FocusRoom schema is not present");
    } else if (hasFocusRoomTables && !hasFitnessTables) {
      console.log("✅ This appears to be the FocusRoom application database");
    } else if (hasFitnessTables && hasFocusRoomTables) {
      console.log("⚠️  This database has both fitness and FocusRoom tables");
    } else {
      console.log("❓ This database has neither fitness nor FocusRoom tables");
    }
  } catch (error) {
    console.error("Error verifying database:", error);
  } finally {
    await client.end();
  }
}

verifyDatabase();
