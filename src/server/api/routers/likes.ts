import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { likes, users, activityLog } from "~/db/schema";
import { eq, and, count } from "drizzle-orm";

export const likesRouter = createTRPCRouter({
  toggleLike: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        targetId: z.number(),
        targetType: z.enum(["event", "poll", "spotlight"]),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if like already exists
      const existingLike = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.userId, input.userId),
            eq(likes.targetId, input.targetId),
            eq(likes.targetType, input.targetType),
          ),
        )
        .limit(1);

      if (existingLike.length > 0) {
        // Remove like
        await db
          .delete(likes)
          .where(
            and(
              eq(likes.userId, input.userId),
              eq(likes.targetId, input.targetId),
              eq(likes.targetType, input.targetType),
            ),
          );
        return { liked: false };
      } else {
        // Add like
        await db.insert(likes).values({
          userId: input.userId,
          targetId: input.targetId,
          targetType: input.targetType,
        });

        // Log activity
        await db.insert(activityLog).values({
          userId: input.userId,
          activityType: "post_liked",
          targetId: input.targetId,
          targetType: input.targetType,
          description: `User liked a ${input.targetType}`,
        });

        return { liked: true };
      }
    }),

  getLikesCount: publicProcedure
    .input(
      z.object({
        targetId: z.number(),
        targetType: z.enum(["event", "poll", "spotlight"]),
      }),
    )
    .query(async ({ input }) => {
      const result = await db
        .select({ count: count() })
        .from(likes)
        .where(
          and(
            eq(likes.targetId, input.targetId),
            eq(likes.targetType, input.targetType),
          ),
        );

      return result[0]?.count || 0;
    }),

  getUserLikes: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        targetIds: z.array(z.number()).optional(),
        targetType: z.enum(["event", "poll", "spotlight"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(likes.userId, input.userId)];

      if (input.targetIds && input.targetIds.length > 0) {
        // For now, just check the first ID - this can be improved later
        const firstId = input.targetIds[0];
        if (firstId !== undefined) {
          conditions.push(eq(likes.targetId, firstId));
        }
      }

      if (input.targetType) {
        conditions.push(eq(likes.targetType, input.targetType));
      }

      const userLikes = await db
        .select({
          targetId: likes.targetId,
          targetType: likes.targetType,
        })
        .from(likes)
        .where(and(...conditions));

      return userLikes;
    }),

  checkUserLiked: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        targetId: z.number(),
        targetType: z.enum(["event", "poll", "spotlight"]),
      }),
    )
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.userId, input.userId),
            eq(likes.targetId, input.targetId),
            eq(likes.targetType, input.targetType),
          ),
        )
        .limit(1);

      return result.length > 0;
    }),
});
