import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { events, polls, pollOptions, users } from "~/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const feedRouter = createTRPCRouter({
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      // Get events with author info
      const eventsData = await db
        .select({
          id: events.id,
          type: sql`'event'`.as("type"),
          title: events.title,
          content: events.description,
          location: events.location,
          startDateTime: events.startDateTime,
          endDateTime: events.endDateTime,
          rsvpLink: events.rsvpLink,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(events)
        .leftJoin(users, eq(events.createdById, users.id))
        .orderBy(desc(events.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get polls with author info and options
      const pollsData = await db
        .select({
          id: polls.id,
          type: sql`'poll'`.as("type"),
          title: polls.title,
          content: polls.content,
          createdAt: polls.createdAt,
          updatedAt: polls.updatedAt,
          author: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          options: pollOptions,
        })
        .from(polls)
        .leftJoin(users, eq(polls.createdById, users.id))
        .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
        .orderBy(desc(polls.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Group poll options by poll
      const pollsWithOptions = pollsData.reduce((acc, row) => {
        const existingPoll = acc.find((p) => p.id === row.id);
        if (existingPoll) {
          if (row.options) {
            existingPoll.options.push(row.options);
          }
        } else {
          acc.push({
            id: row.id,
            type: row.type,
            title: row.title,
            content: row.content,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            author: row.author,
            options: row.options ? [row.options] : [],
          });
        }
        return acc;
      }, [] as any[]);

      // Transform events to match feed format
      const transformedEvents = eventsData.map((event) => ({
        id: event.id,
        type: event.type,
        title: event.title,
        content: event.content,
        eventDetails: {
          date: event.startDateTime.toISOString().split("T")[0],
          time: event.startDateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          location: event.location || "Location TBD",
          rsvpLink: event.rsvpLink || "#",
        },
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        author: event.author,
        likes: 0, // Mock data for now
        comments: 0, // Mock data for now
        rsvps: 0, // Mock data for now
        userHasLiked: false,
        userHasRSVPd: false,
      }));

      // Transform polls to match feed format
      const transformedPolls = pollsWithOptions.map((poll) => ({
        id: poll.id,
        type: poll.type,
        title: poll.title,
        content: poll.content,
        pollOptions: poll.options.map((option: any) => ({
          id: option.id,
          text: option.text,
          votes: option.votes,
        })),
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        author: poll.author,
        likes: 0, // Mock data for now
        comments: 0, // Mock data for now
        totalVotes: poll.options.reduce(
          (sum: number, option: any) => sum + option.votes,
          0,
        ),
        userHasVoted: false,
      }));

      // Combine and sort by creation date
      const combinedFeed = [...transformedEvents, ...transformedPolls].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return combinedFeed;
    }),
});
