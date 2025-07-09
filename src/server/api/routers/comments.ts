import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { comments, users, activityLog } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const commentsRouter = createTRPCRouter({
  createComment: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        targetId: z.number(),
        targetType: z.enum(["event", "poll", "spotlight"]),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input }) => {
      const newComment = await db
        .insert(comments)
        .values({
          userId: input.userId,
          targetId: input.targetId,
          targetType: input.targetType,
          content: input.content,
        })
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        userId: input.userId,
        activityType: "comment_created",
        targetId: input.targetId,
        targetType: input.targetType,
        description: `User commented on a ${input.targetType}`,
      });

      return newComment[0];
    }),

  getComments: publicProcedure
    .input(
      z.object({
        targetId: z.number(),
        targetType: z.enum(["event", "poll", "spotlight"]),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const commentsData = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(
          and(
            eq(comments.targetId, input.targetId),
            eq(comments.targetType, input.targetType),
          ),
        )
        .orderBy(desc(comments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return commentsData;
    }),

  updateComment: publicProcedure
    .input(
      z.object({
        commentId: z.number(),
        userId: z.number(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedComment = await db
        .update(comments)
        .set({
          content: input.content,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(comments.id, input.commentId),
            eq(comments.userId, input.userId),
          ),
        )
        .returning();

      return updatedComment[0];
    }),

  deleteComment: publicProcedure
    .input(
      z.object({
        commentId: z.number(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const deletedComment = await db
        .delete(comments)
        .where(
          and(
            eq(comments.id, input.commentId),
            eq(comments.userId, input.userId),
          ),
        )
        .returning();

      return deletedComment[0];
    }),

  getCommentsCount: publicProcedure
    .input(
      z.object({
        targetId: z.number(),
        targetType: z.enum(["event", "poll", "spotlight"]),
      }),
    )
    .query(async ({ input }) => {
      const result = await db
        .select({ count: comments.id })
        .from(comments)
        .where(
          and(
            eq(comments.targetId, input.targetId),
            eq(comments.targetType, input.targetType),
          ),
        );

      return result.length;
    }),
});
