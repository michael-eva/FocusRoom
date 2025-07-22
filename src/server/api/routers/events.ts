import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { events, activityLog } from "~/db/schema";
import { eq, gte, lte, and, desc } from "drizzle-orm";

export const eventsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        startDateTime: z.date().optional().nullable(),
        endDateTime: z.date().optional().nullable(),
        eventDate: z.string().optional(), // For new schema
        allDay: z.boolean().default(false),
        rsvpLink: z.string().optional(),
        createdById: z.union([z.string(), z.number()]).optional(), // Handle both string and number
        createdByClerkUserId: z.string().optional(), // For new schema
      }),
    )
    .mutation(async ({ input }) => {
      // Handle backward compatibility
      const createdByClerkUserId =
        input.createdByClerkUserId ||
        (input.createdById ? input.createdById.toString() : undefined);
      const eventDate =
        input.eventDate ||
        (input.startDateTime ? input.startDateTime.toISOString() : undefined);

      if (!createdByClerkUserId) {
        throw new Error("createdByClerkUserId/createdById is required");
      }

      const newEvent = await db
        .insert(events)
        .values({
          title: input.title,
          description: input.description,
          location: input.location,
          eventDate: eventDate,
          createdByClerkUserId: createdByClerkUserId,
        })
        .returning();

      // Log the activity
      await db.insert(activityLog).values({
        clerkUserId: createdByClerkUserId,
        action: "event_created",
        details: `Created event: ${input.title}`,
        metadata: { eventId: newEvent[0]!.id },
      });

      return newEvent[0];
    }),

  getAll: publicProcedure.query(async () => {
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.eventDate || events.createdAt));
    return allEvents;
  }),

  getByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ input }) => {
      const eventsInRange = await db
        .select()
        .from(events)
        .where(
          and(
            events.eventDate
              ? gte(events.eventDate, input.startDate.toISOString())
              : undefined,
            events.eventDate
              ? lte(events.eventDate, input.endDate.toISOString())
              : undefined,
          ),
        )
        .orderBy(events.eventDate || events.createdAt);

      return eventsInRange;
    }),

  getByMonth: publicProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(), // 0-11 (JavaScript month format)
        userId: z.string().optional(), // Add userId to check user RSVP status
      }),
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month, 1);
      const endDate = new Date(input.year, input.month + 1, 0, 23, 59, 59);

      // Import eventRsvps schema
      const { eventRsvps } = await import("~/db/schema");

      const eventsInMonth = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          location: events.location,
          eventDate: events.eventDate,
          maxAttendees: events.maxAttendees,
          isVirtual: events.isVirtual,
          virtualLink: events.virtualLink,
          eventType: events.eventType,
          createdByClerkUserId: events.createdByClerkUserId,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          userRSVP: eventRsvps,
        })
        .from(events)
        .leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
        .where(
          and(
            events.eventDate
              ? gte(events.eventDate, startDate.toISOString())
              : undefined,
            events.eventDate
              ? lte(events.eventDate, endDate.toISOString())
              : undefined,
          ),
        )
        .orderBy(events.eventDate || events.createdAt);

      // Group events by ID and collect RSVP data
      const eventsWithRSVPs = eventsInMonth.reduce((acc, row) => {
        const existingEvent = acc.find((e) => e.id === row.id);
        if (existingEvent) {
          if (
            row.userRSVP &&
            input.userId &&
            row.userRSVP.clerkUserId === input.userId
          ) {
            existingEvent.userRSVP = row.userRSVP;
          }
        } else {
          acc.push({
            id: row.id,
            title: row.title,
            description: row.description,
            location: row.location,
            eventDate: row.eventDate,
            maxAttendees: row.maxAttendees,
            isVirtual: row.isVirtual,
            virtualLink: row.virtualLink,
            eventType: row.eventType,
            createdByClerkUserId: row.createdByClerkUserId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            userRSVP:
              row.userRSVP &&
              input.userId &&
              row.userRSVP.clerkUserId === input.userId
                ? row.userRSVP
                : null,
          });
        }
        return acc;
      }, [] as any[]);

      // Map to backward compatible format for calendar component
      const backwardCompatibleEvents = eventsWithRSVPs.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startDateTime:
          event.eventDate || event.createdAt || new Date().toISOString(),
        endDateTime:
          event.eventDate || event.createdAt || new Date().toISOString(), // Use same as start for now
        allDay: false, // Default to false since we don't have this field in new schema
        rsvpLink: null, // Not in new schema
        createdById: null, // Keep as null since Clerk IDs are strings, not numbers
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        googleEventId: null, // Not in new schema
        userRSVP: event.userRSVP
          ? {
              id: event.userRSVP.id,
              eventId: event.userRSVP.eventId || 0,
              userId: event.userRSVP.clerkUserId
                ? parseInt(event.userRSVP.clerkUserId)
                : 0, // Convert string to number for compatibility
              status: event.userRSVP.status as
                | "attending"
                | "maybe"
                | "declined",
              createdAt: event.userRSVP.rsvpDate || new Date().toISOString(),
              updatedAt: event.userRSVP.rsvpDate || new Date().toISOString(),
            }
          : null,
      }));

      return backwardCompatibleEvents;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, input.id))
        .limit(1);

      return event[0];
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        eventDate: z.string().optional(),
        maxAttendees: z.number().optional(),
        isVirtual: z.boolean().optional(),
        virtualLink: z.string().optional(),
        eventType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const processedUpdateData: any = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      const updatedEvent = await db
        .update(events)
        .set(processedUpdateData)
        .where(eq(events.id, id))
        .returning();

      return updatedEvent[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),

  getUpcoming: publicProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const now = new Date();
      const upcomingEvents = await db
        .select()
        .from(events)
        .where(
          events.eventDate
            ? gte(events.eventDate, now.toISOString())
            : undefined,
        )
        .orderBy(events.eventDate || events.createdAt)
        .limit(input.limit);

      return upcomingEvents;
    }),
});
