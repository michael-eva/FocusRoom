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
        startDateTime: z.date(),
        endDateTime: z.date(),
        allDay: z.boolean().default(false),
        rsvpLink: z.string().optional(),
        createdById: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newEvent = await db
        .insert(events)
        .values({
          title: input.title,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime.toISOString(),
          endDateTime: input.endDateTime.toISOString(),
          allDay: input.allDay,
          rsvpLink: input.rsvpLink,
          createdById: input.createdById,
        })
        .returning();

      // Log the activity
      if (input.createdById) {
        await db.insert(activityLog).values({
          userId: input.createdById,
          activityType: "event_created",
          targetId: newEvent[0]!.id,
          targetType: "event",
          description: `Created event: ${input.title}`,
        });
      }

      return newEvent[0];
    }),

  getAll: publicProcedure.query(async () => {
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.startDateTime));
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
            gte(events.startDateTime, input.startDate.toISOString()),
            lte(events.startDateTime, input.endDate.toISOString()),
          ),
        )
        .orderBy(events.startDateTime);

      return eventsInRange;
    }),

  getByMonth: publicProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(), // 0-11 (JavaScript month format)
        userId: z.number().optional(), // Add userId to check user RSVP status
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
          startDateTime: events.startDateTime,
          endDateTime: events.endDateTime,
          allDay: events.allDay,
          rsvpLink: events.rsvpLink,
          createdById: events.createdById,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          userRSVP: eventRsvps,
        })
        .from(events)
        .leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
        .where(
          and(
            gte(events.startDateTime, startDate.toISOString()),
            lte(events.startDateTime, endDate.toISOString()),
          ),
        )
        .orderBy(events.startDateTime);

      // Group events by ID and collect RSVP data
      const eventsWithRSVPs = eventsInMonth.reduce((acc, row) => {
        const existingEvent = acc.find((e) => e.id === row.id);
        if (existingEvent) {
          if (
            row.userRSVP &&
            input.userId &&
            row.userRSVP.userId === input.userId
          ) {
            existingEvent.userRSVP = row.userRSVP;
          }
        } else {
          acc.push({
            id: row.id,
            title: row.title,
            description: row.description,
            location: row.location,
            startDateTime: row.startDateTime,
            endDateTime: row.endDateTime,
            allDay: row.allDay,
            rsvpLink: row.rsvpLink,
            createdById: row.createdById,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            userRSVP:
              row.userRSVP &&
              input.userId &&
              row.userRSVP.userId === input.userId
                ? row.userRSVP
                : null,
          });
        }
        return acc;
      }, [] as any[]);

      return eventsWithRSVPs;
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
        startDateTime: z.date().optional(),
        endDateTime: z.date().optional(),
        allDay: z.boolean().optional(),
        rsvpLink: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      // Convert Date objects to ISO strings
      const processedUpdateData: any = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      if (updateData.startDateTime) {
        processedUpdateData.startDateTime =
          updateData.startDateTime.toISOString();
      }
      if (updateData.endDateTime) {
        processedUpdateData.endDateTime = updateData.endDateTime.toISOString();
      }

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
        .where(gte(events.startDateTime, now.toISOString()))
        .orderBy(events.startDateTime)
        .limit(input.limit);

      return upcomingEvents;
    }),
});
