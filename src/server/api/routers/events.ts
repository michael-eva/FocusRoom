import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { events } from "~/db/schema";
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
        googleEventId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newEvent = await db
        .insert(events)
        .values({
          title: input.title,
          description: input.description,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          allDay: input.allDay,
          rsvpLink: input.rsvpLink,
          createdById: input.createdById,
          googleEventId: input.googleEventId,
        })
        .returning();

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
            gte(events.startDateTime, input.startDate),
            lte(events.startDateTime, input.endDate),
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
      }),
    )
    .query(async ({ input }) => {
      const startDate = new Date(input.year, input.month, 1);
      const endDate = new Date(input.year, input.month + 1, 0, 23, 59, 59);

      const eventsInMonth = await db
        .select()
        .from(events)
        .where(
          and(
            gte(events.startDateTime, startDate),
            lte(events.startDateTime, endDate),
          ),
        )
        .orderBy(events.startDateTime);

      return eventsInMonth;
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
        googleEventId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const updatedEvent = await db
        .update(events)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
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
        .where(gte(events.startDateTime, now))
        .orderBy(events.startDateTime)
        .limit(input.limit);

      return upcomingEvents;
    }),
});
