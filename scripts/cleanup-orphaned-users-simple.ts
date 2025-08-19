import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  chatMessages,
  activityLog,
  eventRsvps,
  projectTeamMembers,
} from "../src/db/schema";
import { inArray } from "drizzle-orm";
import { env } from "~/env";

// Load environment variables
config();

/**
 * Cleanup script to remove orphaned records with non-existent user IDs
 */
async function cleanupOrphanedUsers() {
  console.log("Starting cleanup of orphaned user records...");

  // Check if DATABASE_URL is available
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Known non-existent user IDs
  const knownNonExistentUsers = ["1", "67", "user_307X7xFUKdlDFM4ZP6EP19J6qsC"];

  try {
    // Create database connection
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    console.log("Connected to database successfully");

    // Clean up chat messages
    const deletedChatMessages = await db
      .delete(chatMessages)
      .where(inArray(chatMessages.clerkUserId, knownNonExistentUsers))
      .returning();

    console.log(`Deleted ${deletedChatMessages.length} orphaned chat messages`);

    // Clean up activity logs
    const deletedActivityLogs = await db
      .delete(activityLog)
      .where(inArray(activityLog.clerkUserId, knownNonExistentUsers))
      .returning();

    console.log(`Deleted ${deletedActivityLogs.length} orphaned activity logs`);

    // Clean up RSVPs
    const deletedRSVPs = await db
      .delete(eventRsvps)
      .where(inArray(eventRsvps.clerkUserId, knownNonExistentUsers))
      .returning();

    console.log(`Deleted ${deletedRSVPs.length} orphaned RSVPs`);

    // Clean up project team members
    const deletedTeamMembers = await db
      .delete(projectTeamMembers)
      .where(inArray(projectTeamMembers.clerkUserId, knownNonExistentUsers))
      .returning();

    console.log(`Deleted ${deletedTeamMembers.length} orphaned team members`);

    // Close database connection
    await client.end();

    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedUsers()
  .then(() => {
    console.log("Cleanup script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Cleanup script failed:", error);
    process.exit(1);
  });
