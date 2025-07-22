import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { comments, activityLog } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { client } from "~/lib/clerk";
import type { User } from "@clerk/nextjs/server";

export const commentsRouter = createTRPCRouter({
  createComment: publicProcedure
    .input(
      z.object({
        clerkUserId: z.string().optional(),
        userId: z.number().optional(), // For backward compatibility
        postId: z.number().optional(),
        eventId: z.number().optional(),
        pollId: z.number().optional(),
        spotlightId: z.number().optional(),
        targetId: z.number().optional(), // For backward compatibility
        targetType: z.string().optional(), // For backward compatibility
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input }) => {
      // Handle backward compatibility
      const clerkUserId =
        input.clerkUserId ||
        (input.userId ? input.userId.toString() : undefined);

      if (!clerkUserId) {
        throw new Error("clerkUserId is required");
      }

      // Handle backward compatibility for targetId/targetType
      let postId = input.postId;
      let eventId = input.eventId;
      let pollId = input.pollId;
      let spotlightId = input.spotlightId;

      if (input.targetId && input.targetType) {
        switch (input.targetType) {
          case "post":
            postId = input.targetId;
            break;
          case "event":
            eventId = input.targetId;
            break;
          case "poll":
            pollId = input.targetId;
            break;
          case "spotlight":
            spotlightId = input.targetId;
            break;
        }
      }

      const newComment = await db
        .insert(comments)
        .values({
          clerkUserId: clerkUserId,
          postId: postId,
          eventId: eventId,
          pollId: pollId,
          spotlightId: spotlightId,
          content: input.content,
        })
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        clerkUserId: clerkUserId,
        action: "comment_created",
        details: `User commented on content`,
        metadata: {
          commentId: newComment[0]?.id,
          postId: postId,
          eventId: eventId,
          pollId: pollId,
          spotlightId: spotlightId,
        },
      });

      return newComment[0];
    }),

  getComments: publicProcedure
    .input(
      z.object({
        postId: z.number().optional(),
        eventId: z.number().optional(),
        pollId: z.number().optional(),
        spotlightId: z.number().optional(),
        targetId: z.number().optional(), // For backward compatibility
        targetType: z.string().optional(), // For backward compatibility
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      // Handle backward compatibility for spotlight comments
      if (input.targetType === "spotlight" && input.targetId) {
        input.spotlightId = input.targetId;
      }

      const commentsData = await db
        .select({
          id: comments.id,
          content: comments.content,
          timestamp: comments.timestamp,
          clerkUserId: comments.clerkUserId,
          postId: comments.postId,
          eventId: comments.eventId,
          pollId: comments.pollId,
          spotlightId: comments.spotlightId,
        })
        .from(comments)
        .where(
          and(
            input.postId ? eq(comments.postId, input.postId) : undefined,
            input.eventId ? eq(comments.eventId, input.eventId) : undefined,
            input.pollId ? eq(comments.pollId, input.pollId) : undefined,
            input.spotlightId
              ? eq(comments.spotlightId, input.spotlightId)
              : undefined,
          ),
        )
        .orderBy(desc(comments.timestamp))
        .limit(input.limit)
        .offset(input.offset);

      // Fetch user data from Clerk for each comment
      const commentsWithUsers = await Promise.all(
        commentsData.map(async (comment) => {
          let user: User | null = null;
          if (comment.clerkUserId) {
            try {
              user = await client.users.getUser(comment.clerkUserId);
            } catch (error) {
              console.error(
                `Failed to fetch user ${comment.clerkUserId}:`,
                error,
              );
            }
          }

          return {
            ...comment,
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

      return commentsWithUsers;
    }),

  updateComment: publicProcedure
    .input(
      z.object({
        commentId: z.number(),
        clerkUserId: z.string(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedComment = await db
        .update(comments)
        .set({
          content: input.content,
        })
        .where(
          and(
            eq(comments.id, input.commentId),
            eq(comments.clerkUserId, input.clerkUserId),
          ),
        )
        .returning();

      return updatedComment[0];
    }),

  deleteComment: publicProcedure
    .input(
      z.object({
        commentId: z.number(),
        clerkUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const deletedComment = await db
        .delete(comments)
        .where(
          and(
            eq(comments.id, input.commentId),
            eq(comments.clerkUserId, input.clerkUserId),
          ),
        )
        .returning();

      return deletedComment[0];
    }),

  // Get total comments count for community stats
  getCount: publicProcedure.query(async () => {
    const result = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(comments);

    return result[0]?.count || 0;
  }),

  getCommentsCount: publicProcedure
    .input(
      z.object({
        postId: z.number().optional(),
        eventId: z.number().optional(),
        pollId: z.number().optional(),
        spotlightId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(comments)
        .where(
          and(
            input.postId ? eq(comments.postId, input.postId) : undefined,
            input.eventId ? eq(comments.eventId, input.eventId) : undefined,
            input.pollId ? eq(comments.pollId, input.pollId) : undefined,
            input.spotlightId
              ? eq(comments.spotlightId, input.spotlightId)
              : undefined,
          ),
        );

      return result[0]?.count || 0;
    }),
});
