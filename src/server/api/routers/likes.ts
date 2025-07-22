import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { likes, activityLog } from "~/db/schema";
import { eq, and, count } from "drizzle-orm";

export const likesRouter = createTRPCRouter({
  toggleLike: publicProcedure
    .input(
      z.object({
        clerkUserId: z.string().optional(),
        userId: z.number().optional(), // For backward compatibility
        postId: z.number().optional(),
        pollId: z.number().optional(),
        spotlightId: z.number().optional(),
        targetId: z.number().optional(), // For backward compatibility
        targetType: z.string().optional(), // For backward compatibility
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
      let pollId = input.pollId;
      let spotlightId = input.spotlightId;

      if (input.targetId && input.targetType) {
        switch (input.targetType) {
          case "post":
            postId = input.targetId;
            break;
          case "poll":
            pollId = input.targetId;
            break;
          case "spotlight":
            spotlightId = input.targetId;
            break;
        }
      }

      // Check if like already exists
      const existingLike = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.clerkUserId, clerkUserId),
            postId ? eq(likes.postId, postId) : undefined,
            pollId ? eq(likes.pollId, pollId) : undefined,
            spotlightId ? eq(likes.spotlightId, spotlightId) : undefined,
          ),
        )
        .limit(1);

      if (existingLike.length > 0) {
        // Remove like
        await db
          .delete(likes)
          .where(
            and(
              eq(likes.clerkUserId, clerkUserId),
              postId ? eq(likes.postId, postId) : undefined,
              pollId ? eq(likes.pollId, pollId) : undefined,
              spotlightId ? eq(likes.spotlightId, spotlightId) : undefined,
            ),
          );
        return { liked: false };
      } else {
        // Add like
        await db.insert(likes).values({
          clerkUserId: clerkUserId,
          postId: postId,
          pollId: pollId,
          spotlightId: spotlightId,
        });

        // Log activity
        await db.insert(activityLog).values({
          clerkUserId: clerkUserId,
          action: "post_liked",
          details: `User liked a ${postId ? "post" : pollId ? "poll" : "spotlight"}`,
          metadata: {
            postId: postId,
            pollId: pollId,
            spotlightId: spotlightId,
          },
        });

        return { liked: true };
      }
    }),

  getLikesCount: publicProcedure
    .input(
      z.object({
        postId: z.number().optional(),
        pollId: z.number().optional(),
        spotlightId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await db
        .select({ count: count() })
        .from(likes)
        .where(
          and(
            input.postId ? eq(likes.postId, input.postId) : undefined,
            input.pollId ? eq(likes.pollId, input.pollId) : undefined,
            input.spotlightId
              ? eq(likes.spotlightId, input.spotlightId)
              : undefined,
          ),
        );

      return result[0]?.count || 0;
    }),

  getUserLikes: publicProcedure
    .input(
      z.object({
        clerkUserId: z.string(),
        postIds: z.array(z.number()).optional(),
        pollIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(likes.clerkUserId, input.clerkUserId)];

      if (input.postIds && input.postIds.length > 0) {
        // For now, just check the first ID - this can be improved later
        const firstId = input.postIds[0];
        if (firstId !== undefined) {
          conditions.push(eq(likes.postId, firstId));
        }
      }

      if (input.pollIds && input.pollIds.length > 0) {
        // For now, just check the first ID - this can be improved later
        const firstId = input.pollIds[0];
        if (firstId !== undefined) {
          conditions.push(eq(likes.pollId, firstId));
        }
      }

      const userLikes = await db
        .select({
          postId: likes.postId,
          pollId: likes.pollId,
        })
        .from(likes)
        .where(and(...conditions));

      return userLikes;
    }),

  checkUserLiked: publicProcedure
    .input(
      z.object({
        clerkUserId: z.string().optional(),
        userId: z.number().optional(), // For backward compatibility
        postId: z.number().optional(),
        pollId: z.number().optional(),
        spotlightId: z.number().optional(),
        targetId: z.number().optional(), // For backward compatibility
        targetType: z.string().optional(), // For backward compatibility
      }),
    )
    .query(async ({ input }) => {
      // Handle backward compatibility
      const clerkUserId =
        input.clerkUserId ||
        (input.userId ? input.userId.toString() : undefined);

      // Handle backward compatibility for targetId/targetType
      if (input.targetId && input.targetType === "spotlight") {
        input.spotlightId = input.targetId;
      }

      if (!clerkUserId) {
        return false;
      }

      const result = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.clerkUserId, clerkUserId),
            input.postId ? eq(likes.postId, input.postId) : undefined,
            input.pollId ? eq(likes.pollId, input.pollId) : undefined,
            input.spotlightId
              ? eq(likes.spotlightId, input.spotlightId)
              : undefined,
          ),
        )
        .limit(1);

      return result.length > 0;
    }),
});
