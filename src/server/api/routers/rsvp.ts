import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { eventRSVPs, events, users, activityLog } from "~/db/schema";
import { eq, and } from "drizzle-orm";

export const rsvpRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        userId: z.number(),
        status: z.enum(["attending", "maybe", "declined"]),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if RSVP already exists
      const existingRSVP = await db
        .select()
        .from(eventRSVPs)
        .where(
          and(
            eq(eventRSVPs.eventId, input.eventId),
            eq(eventRSVPs.userId, input.userId),
          ),
        )
        .limit(1);

      if (existingRSVP.length > 0) {
        // Update existing RSVP
        const updatedRSVP = await db
          .update(eventRSVPs)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(eventRSVPs.id, existingRSVP[0]!.id))
          .returning();

        // Log the activity
        await db.insert(activityLog).values({
          userId: input.userId,
          activityType: "event_rsvp",
          targetId: input.eventId,
          targetType: "event",
          description: `Updated RSVP to: ${input.status}`,
        });

        return updatedRSVP[0];
      } else {
        // Create new RSVP
        const newRSVP = await db
          .insert(eventRSVPs)
          .values({
            eventId: input.eventId,
            userId: input.userId,
            status: input.status,
          })
          .returning();

        // Log the activity
        await db.insert(activityLog).values({
          userId: input.userId,
          activityType: "event_rsvp",
          targetId: input.eventId,
          targetType: "event",
          description: `RSVP'd: ${input.status}`,
        });

        return newRSVP[0];
      }
    }),

  getByEvent: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const rsvps = await db
        .select({
          id: eventRSVPs.id,
          status: eventRSVPs.status,
          createdAt: eventRSVPs.createdAt,
          updatedAt: eventRSVPs.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(eventRSVPs)
        .leftJoin(users, eq(eventRSVPs.userId, users.id))
        .where(eq(eventRSVPs.eventId, input.eventId));

      return rsvps;
    }),

  getUserRSVP: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        userId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const rsvp = await db
        .select()
        .from(eventRSVPs)
        .where(
          and(
            eq(eventRSVPs.eventId, input.eventId),
            eq(eventRSVPs.userId, input.userId),
          ),
        )
        .limit(1);

      return rsvp[0] || null;
    }),

  delete: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .delete(eventRSVPs)
        .where(
          and(
            eq(eventRSVPs.eventId, input.eventId),
            eq(eventRSVPs.userId, input.userId),
          ),
        );

      return { success: true };
    }),
});
