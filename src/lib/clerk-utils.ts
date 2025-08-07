import { client } from "~/lib/clerk";
import type { User } from "@clerk/nextjs/server";

/**
 * Safely fetch a user from Clerk, handling non-existent users gracefully
 */
export async function safeGetUser(clerkUserId: string): Promise<User | null> {
  if (!clerkUserId) {
    return null;
  }

  // Skip known non-existent or test user IDs
  const knownNonExistentUsers = ["1", "67", "user_307X7xFUKdlDFM4ZP6EP19J6qsC"];

  if (knownNonExistentUsers.includes(clerkUserId)) {
    console.log(`Skipping known non-existent user ID: ${clerkUserId}`);
    return null;
  }

  try {
    const user = await client.users.getUser(clerkUserId);
    return user;
  } catch (error) {
    console.error(`Failed to fetch user ${clerkUserId}:`, error);
    return null;
  }
}

/**
 * Create a fallback user object for non-existent users
 */
export function createFallbackUser(clerkUserId: string) {
  return {
    id: clerkUserId,
    firstName: "Unknown",
    lastName: "User",
    imageUrl: null,
    emailAddresses: [],
  };
}
