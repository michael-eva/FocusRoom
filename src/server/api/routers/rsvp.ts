import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { eventRsvps, events, activityLog } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { safeGetUser } from "~/lib/clerk-utils";
import type { User } from "@clerk/nextjs/server";

export const rsvpRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        clerkUserId: z.string(),
        status: z.enum(["attending", "maybe", "declined"]),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if RSVP already exists
      const existingRSVP = await db
        .select()
        .from(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, input.eventId),
            eq(eventRsvps.clerkUserId, input.clerkUserId),
          ),
        )
        .limit(1);

      if (existingRSVP.length > 0) {
        // Update existing RSVP
        const updatedRSVP = await db
          .update(eventRsvps)
          .set({
            status: input.status,
            rsvpDate: new Date().toISOString(),
          })
          .where(eq(eventRsvps.id, existingRSVP[0]!.id))
          .returning();

        // Log the activity
        await db.insert(activityLog).values({
          clerkUserId: input.clerkUserId,
          action: "event_rsvp",
          details: `Updated RSVP to: ${input.status}`,
          metadata: { eventId: input.eventId },
        });

        return updatedRSVP[0];
      } else {
        // Create new RSVP
        const newRSVP = await db
          .insert(eventRsvps)
          .values({
            eventId: input.eventId,
            clerkUserId: input.clerkUserId,
            status: input.status,
          })
          .returning();

        // Log the activity
        await db.insert(activityLog).values({
          clerkUserId: input.clerkUserId,
          action: "event_rsvp",
          details: `RSVP'd: ${input.status}`,
          metadata: { eventId: input.eventId },
        });

        return newRSVP[0];
      }
    }),

  getByEvent: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const rsvps = await db
        .select({
          id: eventRsvps.id,
          status: eventRsvps.status,
          rsvpDate: eventRsvps.rsvpDate,
          notes: eventRsvps.notes,
          clerkUserId: eventRsvps.clerkUserId,
        })
        .from(eventRsvps)
        .where(eq(eventRsvps.eventId, input.eventId));

      // Fetch user details from Clerk for each RSVP
      const rsvpsWithUsers = await Promise.all(
        rsvps.map(async (rsvp) => {
          const user = await safeGetUser(rsvp.clerkUserId || "");

          return {
            ...rsvp,
            user: user
              ? {
                  id: user.id,
                  name:
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.emailAddresses[0]?.emailAddress,
                  email: user.emailAddresses[0]?.emailAddress,
                  imageUrl: user.imageUrl,
                }
              : null,
          };
        }),
      );

      return rsvpsWithUsers;
    }),

  getUserRSVP: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        clerkUserId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const rsvp = await db
        .select()
        .from(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, input.eventId),
            eq(eventRsvps.clerkUserId, input.clerkUserId),
          ),
        )
        .limit(1);

      return rsvp[0] || null;
    }),

  delete: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        clerkUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .delete(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, input.eventId),
            eq(eventRsvps.clerkUserId, input.clerkUserId),
          ),
        );

      return { success: true };
    }),
});
