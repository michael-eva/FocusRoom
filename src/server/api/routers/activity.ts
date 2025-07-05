import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { activityLog, users, polls, events } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export const activityRouter = createTRPCRouter({
  logActivity: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        activityType: z.enum([
          "poll_created",
          "poll_voted",
          "event_created",
          "event_rsvp",
        ]),
        targetId: z.number().optional(),
        targetType: z.enum(["poll", "event"]).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newActivity = await db
        .insert(activityLog)
        .values({
          userId: input.userId,
          activityType: input.activityType,
          targetId: input.targetId,
          targetType: input.targetType,
          description: input.description,
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
          activityType: activityLog.activityType,
          targetId: activityLog.targetId,
          targetType: activityLog.targetType,
          description: activityLog.description,
          createdAt: activityLog.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          // Join with polls for poll-related activities
          poll: polls,
          // Join with events for event-related activities
          event: events,
        })
        .from(activityLog)
        .leftJoin(users, eq(activityLog.userId, users.id))
        .leftJoin(polls, eq(activityLog.targetId, polls.id))
        .leftJoin(events, eq(activityLog.targetId, events.id))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),

  getUserActivity: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const activities = await db
        .select({
          id: activityLog.id,
          activityType: activityLog.activityType,
          targetId: activityLog.targetId,
          targetType: activityLog.targetType,
          description: activityLog.description,
          createdAt: activityLog.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(activityLog)
        .leftJoin(users, eq(activityLog.userId, users.id))
        .where(eq(activityLog.userId, input.userId))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),
});
