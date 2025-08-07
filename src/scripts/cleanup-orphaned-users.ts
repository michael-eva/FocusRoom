import { config } from "dotenv";
import { db } from "~/db";
import {
  chatMessages,
  activityLog,
  eventRsvps,
  projectTeamMembers,
} from "~/db/schema";
import { eq, inArray } from "drizzle-orm";
import { client } from "~/lib/clerk";

// Load environment variables
config();

/**
 * Cleanup script to remove orphaned records with non-existent user IDs
 */
async function cleanupOrphanedUsers() {
  console.log("Starting cleanup of orphaned user records...");

  // Known non-existent user IDs
  const knownNonExistentUsers = ["1", "67", "user_307X7xFUKdlDFM4ZP6EP19J6qsC"];

  try {
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

    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupOrphanedUsers()
    .then(() => {
      console.log("Cleanup script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup script failed:", error);
      process.exit(1);
    });
}

export { cleanupOrphanedUsers };
