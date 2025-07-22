import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { activityLog, polls, events } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { client } from "~/lib/clerk";
import type { User } from "@clerk/nextjs/server";

export const activityRouter = createTRPCRouter({
  logActivity: publicProcedure
    .input(
      z.object({
        clerkUserId: z.string(),
        action: z.string(),
        details: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newActivity = await db
        .insert(activityLog)
        .values({
          clerkUserId: input.clerkUserId,
          action: input.action,
          details: input.details,
          metadata: input.metadata,
        })
        .returning();

      return newActivity[0];
    }),

  getRecentActivity: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const activities = await db
        .select({
          id: activityLog.id,
          action: activityLog.action,
          details: activityLog.details,
          timestamp: activityLog.timestamp,
          metadata: activityLog.metadata,
          clerkUserId: activityLog.clerkUserId,
        })
        .from(activityLog)
        .orderBy(desc(activityLog.timestamp))
        .limit(input.limit)
        .offset(input.offset);

      // Fetch user data from Clerk for each activity
      const activitiesWithUsers = await Promise.all(
        activities.map(async (activity) => {
          let user: User | null = null;
          if (activity.clerkUserId) {
            try {
              // Skip test user IDs that don't exist in Clerk
              if (
                activity.clerkUserId === "1" ||
                activity.clerkUserId === "67"
              ) {
                console.log(`Skipping test user ID: ${activity.clerkUserId}`);
                user = null;
              } else {
                user = await client.users.getUser(activity.clerkUserId);
              }
            } catch (error) {
              console.error(
                `Failed to fetch user ${activity.clerkUserId}:`,
                error,
              );
              user = null;
            }
          }

          return {
            id: activity.id,
            action: activity.action,
            details: activity.details,
            timestamp: activity.timestamp,
            metadata: activity.metadata,
            clerkUserId: activity.clerkUserId,
            user: user
              ? {
                  id: user.id,
                  name:
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.emailAddresses[0]?.emailAddress,
                  email: user.emailAddresses[0]?.emailAddress,
                }
              : null,
          };
        }),
      );

      return activitiesWithUsers;
    }),

  getUserActivity: publicProcedure
    .input(
      z.object({
        clerkUserId: z.string(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const activities = await db
        .select({
          id: activityLog.id,
          action: activityLog.action,
          details: activityLog.details,
          timestamp: activityLog.timestamp,
          metadata: activityLog.metadata,
          clerkUserId: activityLog.clerkUserId,
        })
        .from(activityLog)
        .where(eq(activityLog.clerkUserId, input.clerkUserId))
        .orderBy(desc(activityLog.timestamp))
        .limit(input.limit)
        .offset(input.offset);

      // Fetch user data from Clerk
      let user: User | null = null;
      try {
        user = await client.users.getUser(input.clerkUserId);
      } catch (error) {
        console.error(`Failed to fetch user ${input.clerkUserId}:`, error);
      }

      const activitiesWithUser = activities.map((activity) => ({
        ...activity,
        user: user
          ? {
              id: user.id,
              name:
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.emailAddresses[0]?.emailAddress,
              email: user.emailAddresses[0]?.emailAddress,
            }
          : null,
      }));

      return activitiesWithUser;
    }),
});
