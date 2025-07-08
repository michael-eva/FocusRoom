import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

// Import your schema
import { users, polls, pollOptions, activityLog } from "~/db/schema";

// Load environment variables
dotenv.config();

async function testPollCreation() {
  console.log("🧪 Testing poll creation...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  const db = drizzle(pool);

  try {
    // Check if there are users in the database
    console.log("📋 Checking for existing users...");
    const existingUsers = await db.select().from(users).limit(1);
    console.log(`Found ${existingUsers.length} users`);

    if (existingUsers.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    const userId = existingUsers[0]!.id;
    console.log(`Using user ID: ${userId}`);

    // Test poll creation
    console.log("🗳️ Creating test poll...");
    const newPoll = await db
      .insert(polls)
      .values({
        title: "Test Poll - " + new Date().toISOString(),
        content: "This is a test poll created by the test script",
        createdById: userId,
      })
      .returning();

    console.log("✅ Poll created:", newPoll);
    const pollId = newPoll[0]!.id;

    // Create poll options
    console.log("📊 Creating poll options...");
    const pollOptionsData = [
      { pollId, text: "Option 1", votes: 0 },
      { pollId, text: "Option 2", votes: 0 },
      { pollId, text: "Option 3", votes: 0 },
    ];

    const insertedOptions = await db
      .insert(pollOptions)
      .values(pollOptionsData)
      .returning();
    console.log("✅ Poll options created:", insertedOptions);

    // Log activity
    console.log("📝 Logging activity...");
    const activityLogResult = await db
      .insert(activityLog)
      .values({
        userId,
        activityType: "poll_created",
        targetId: pollId,
        targetType: "poll",
        description: `Created test poll: ${newPoll[0]!.title}`,
      })
      .returning();
    console.log("✅ Activity logged:", activityLogResult);

    console.log("🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await pool.end();
  }
}

testPollCreation().catch(console.error);
