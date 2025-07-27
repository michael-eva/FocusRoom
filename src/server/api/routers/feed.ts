import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import {
  events,
  polls,
  pollOptions,
  pollVotes,
  likes,
  comments,
  eventRsvps,
} from "~/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { client } from "~/lib/clerk";
import type { User } from "@clerk/nextjs/server";

export const feedRouter = createTRPCRouter({
  getFeed: publicProcedure
    .input(
      z
        .object({
          limit: z.number().default(20),
          offset: z.number().default(0),
          userId: z.string().optional(), // Changed to string for Clerk user ID
        })
        .optional()
        .default({}),
    )
    .query(async ({ input }) => {
      // Get events with RSVP data
      const eventsData = await db
        .select({
          id: events.id,
          type: sql`'event'`.as("type"),
          title: events.title,
          content: events.description,
          location: events.location,
          eventDate: events.eventDate,
          endDate: events.endDate, // <-- Use correct property name
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          createdByClerkUserId: events.createdByClerkUserId,
          userRSVP: eventRsvps,
          timezone: events.timezone,
        })
        .from(events)
        .leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
        .orderBy(desc(events.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get polls with options and vote data
      let pollsData;
      if (input.userId) {
        pollsData = await db
          .select({
            id: polls.id,
            type: sql`'poll'`.as("type"),
            question: polls.question,
            createdAt: polls.createdAt,
            createdByClerkUserId: polls.createdByClerkUserId,
            options: pollOptions,
            userVote: pollVotes,
          })
          .from(polls)
          .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
          .leftJoin(
            pollVotes,
            and(
              eq(polls.id, pollVotes.pollId),
              eq(pollVotes.clerkUserId, input.userId),
            ),
          )
          .orderBy(desc(polls.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      } else {
        pollsData = await db
          .select({
            id: polls.id,
            type: sql`'poll'`.as("type"),
            question: polls.question,
            createdAt: polls.createdAt,
            createdByClerkUserId: polls.createdByClerkUserId,
            options: pollOptions,
            userVote: sql`null`.as("userVote"),
          })
          .from(polls)
          .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
          .orderBy(desc(polls.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }

      // Group poll options by poll and collect vote data
      const pollsWithOptions = pollsData.reduce((acc, row) => {
        const existingPoll = acc.find((p) => p.id === row.id);
        if (existingPoll) {
          if (row.options) {
            existingPoll.options.push(row.options);
          }
          // Only set userVote if we don't already have one and this row has a valid vote
          if (
            !existingPoll.userVote &&
            row.userVote &&
            input.userId &&
            row.userVote.clerkUserId === input.userId
          ) {
            existingPoll.userVote = row.userVote;
          }
        } else {
          acc.push({
            id: row.id,
            type: row.type,
            question: row.question,
            createdAt: row.createdAt,
            createdByClerkUserId: row.createdByClerkUserId,
            options: row.options ? [row.options] : [],
            userVote:
              row.userVote &&
              input.userId &&
              row.userVote.clerkUserId === input.userId
                ? row.userVote
                : null,
          });
        }
        return acc;
      }, [] as any[]);

      // Group events by ID and collect RSVP data
      const eventsWithRSVPs = eventsData.reduce((acc, row) => {
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
            type: row.type,
            title: row.title,
            content: row.content,
            location: row.location,
            eventDate: row.eventDate,
            endDate: row.endDate, // <-- Use correct property name
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            createdByClerkUserId: row.createdByClerkUserId,
            userRSVP:
              row.userRSVP &&
              input.userId &&
              row.userRSVP.clerkUserId === input.userId
                ? row.userRSVP
                : null,
            timezone: row.timezone,
          });
        }
        return acc;
      }, [] as any[]);

      // Get like and comment counts for events
      const eventIds = eventsWithRSVPs.map((e) => e.id);
      const eventLikes =
        eventIds.length > 0
          ? await db
              .select({
                targetId: likes.postId,
                count: sql<number>`count(*)`.as("count"),
              })
              .from(likes)
              .where(and(inArray(likes.postId, eventIds)))
              .groupBy(likes.postId)
          : [];

      const eventComments =
        eventIds.length > 0
          ? await db
              .select({
                targetId: comments.eventId,
                count: sql<number>`count(*)`.as("count"),
              })
              .from(comments)
              .where(and(inArray(comments.eventId, eventIds)))
              .groupBy(comments.eventId)
          : [];

      const eventRSVPs =
        eventIds.length > 0
          ? await db
              .select({
                eventId: eventRsvps.eventId,
                count: sql<number>`count(*)`.as("count"),
              })
              .from(eventRsvps)
              .where(and(inArray(eventRsvps.eventId, eventIds)))
              .groupBy(eventRsvps.eventId)
          : [];

      // Get user's likes for events
      const userEventLikes =
        input.userId && eventIds.length > 0
          ? await db
              .select({
                targetId: likes.postId,
              })
              .from(likes)
              .where(
                and(
                  eq(likes.clerkUserId, input.userId),
                  inArray(likes.postId, eventIds),
                ),
              )
          : [];

      // Transform events to match feed format
      const transformedEvents = eventsWithRSVPs.map((event) => {
        const likeCount =
          eventLikes.find((l) => l.targetId === event.id)?.count || 0;
        const commentCount =
          eventComments.find((c) => c.targetId === event.id)?.count || 0;
        const rsvpCount =
          eventRSVPs.find((r) => r.eventId === event.id)?.count || 0;
        const userHasLiked = userEventLikes.some(
          (l) => l.targetId === event.id,
        );

        // Format date and times in the event's timezone
        const timezone = event.timezone || "UTC";
        const eventDateObj = event.eventDate ? new Date(event.eventDate) : null;
        const endDateObj = event.endDate ? new Date(event.endDate) : null;

        return {
          id: event.id,
          type: event.type,
          title: event.title,
          content: event.content,
          eventDetails: {
            date: eventDateObj
              ? eventDateObj.toLocaleDateString("en-CA", { timeZone: timezone })
              : "",
            time: eventDateObj
              ? eventDateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: timezone,
                })
              : "",
            endTime: endDateObj
              ? endDateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: timezone,
                })
              : "",
            location: event.location || "Location TBD",
            rsvpLink: "#", // Not in new schema
            timezone: timezone,
          },
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          createdByClerkUserId: event.createdByClerkUserId,
          likes: likeCount,
          comments: commentCount,
          rsvps: rsvpCount,
          userHasLiked,
          userHasRSVPd: !!event.userRSVP,
          userRSVPStatus: event.userRSVP?.status || null,
        };
      });

      // Get like and comment counts for polls
      const pollIds = pollsWithOptions.map((p) => p.id);
      const pollLikes =
        pollIds.length > 0
          ? await db
              .select({
                targetId: likes.pollId,
                count: sql<number>`count(*)`.as("count"),
              })
              .from(likes)
              .where(and(inArray(likes.pollId, pollIds)))
              .groupBy(likes.pollId)
          : [];

      const pollComments =
        pollIds.length > 0
          ? await db
              .select({
                targetId: comments.pollId,
                count: sql<number>`count(*)`.as("count"),
              })
              .from(comments)
              .where(and(inArray(comments.pollId, pollIds)))
              .groupBy(comments.pollId)
          : [];

      // Get user's likes for polls
      const userPollLikes =
        input.userId && pollIds.length > 0
          ? await db
              .select({
                targetId: likes.pollId,
              })
              .from(likes)
              .where(
                and(
                  eq(likes.clerkUserId, input.userId),
                  inArray(likes.pollId, pollIds),
                ),
              )
          : [];

      // Transform polls to match feed format
      const transformedPolls = pollsWithOptions.map((poll) => {
        const likeCount =
          pollLikes.find((l) => l.targetId === poll.id)?.count || 0;
        const commentCount =
          pollComments.find((c) => c.targetId === poll.id)?.count || 0;
        const userHasLiked = userPollLikes.some((l) => l.targetId === poll.id);

        return {
          id: poll.id,
          type: poll.type,
          title: poll.question,
          content: poll.question,
          createdAt: poll.createdAt,
          updatedAt: poll.createdAt, // Use createdAt since updatedAt doesn't exist
          createdByClerkUserId: poll.createdByClerkUserId,
          options: poll.options,
          userVote: poll.userVote,
          likes: likeCount,
          comments: commentCount,
          userHasLiked,
        };
      });

      // Fetch user data from Clerk for all events and polls
      const allUserIds = [
        ...new Set([
          ...transformedEvents
            .map((e) => e.createdByClerkUserId)
            .filter(Boolean),
          ...transformedPolls
            .map((p) => p.createdByClerkUserId)
            .filter(Boolean),
        ]),
      ];

      const userDataMap = new Map<string, any>();

      for (const userId of allUserIds) {
        if (userId) {
          try {
            // Skip test user IDs that don't exist in Clerk
            if (userId === "1" || userId === "67") {
              console.log(`Skipping test user ID: ${userId}`);
              continue;
            }

            const user = await client.users.getUser(userId);
            userDataMap.set(userId, {
              id: user.id,
              name:
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.emailAddresses[0]?.emailAddress,
              email: user.emailAddresses[0]?.emailAddress,
              imageUrl: user.imageUrl,
            });
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
            // Continue without user data
          }
        }
      }

      // Add author data to events and polls
      const eventsWithAuthors = transformedEvents.map((event) => ({
        ...event,
        author: event.createdByClerkUserId
          ? userDataMap.get(event.createdByClerkUserId)
          : null,
      }));

      const pollsWithAuthors = transformedPolls.map((poll) => ({
        ...poll,
        author: poll.createdByClerkUserId
          ? userDataMap.get(poll.createdByClerkUserId)
          : null,
      }));

      // Combine and sort by creation date
      const combinedFeed = [...eventsWithAuthors, ...pollsWithAuthors].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return combinedFeed.slice(0, input.limit);
    }),
});
