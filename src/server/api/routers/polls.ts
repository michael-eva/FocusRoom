import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import {
  polls,
  pollOptions,
  pollVotes,
  users,
  activityLog,
  likes,
  comments,
} from "~/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const pollsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        options: z.array(z.string().min(1)).min(2).max(10), // 2-10 options
        createdById: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log("Creating poll with input:", input);

        // Ensure we have a valid user ID
        let userId = input.createdById;
        if (!userId) {
          // Check if there are any users in the database
          const existingUsers = await db.select().from(users).limit(1);
          if (existingUsers.length > 0) {
            userId = existingUsers[0]!.id;
          } else {
            // Create a default user if none exists
            const defaultUser = await db
              .insert(users)
              .values({
                name: "Default User",
                email: "default@example.com",
              })
              .returning();
            userId = defaultUser[0]!.id;
          }
        }

        // Create the poll
        const newPoll = await db
          .insert(polls)
          .values({
            title: input.title,
            content: input.content,
            createdById: userId,
          })
          .returning();

        console.log("Poll created:", newPoll);
        const pollId = newPoll[0]!.id;

        // Create poll options
        const pollOptionsData = input.options.map((text) => ({
          pollId,
          text,
          votes: 0,
        }));

        console.log("Creating poll options:", pollOptionsData);
        await db.insert(pollOptions).values(pollOptionsData);

        // Log the activity
        await db.insert(activityLog).values({
          userId,
          activityType: "poll_created",
          targetId: pollId,
          targetType: "poll",
          description: `Created poll: ${input.title}`,
        });

        console.log("Poll creation completed successfully");
        return newPoll[0];
      } catch (error) {
        console.error("Error creating poll:", error);
        throw error;
      }
    }),

  getAll: publicProcedure.query(async () => {
    const allPolls = await db
      .select({
        id: polls.id,
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
      .orderBy(desc(polls.createdAt));

    // Group options by poll
    const pollsWithOptions = allPolls.reduce((acc, row) => {
      const existingPoll = acc.find((p) => p.id === row.id);
      if (existingPoll) {
        if (row.options) {
          existingPoll.options.push(row.options);
        }
      } else {
        acc.push({
          id: row.id,
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

    return pollsWithOptions;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const poll = await db
        .select({
          id: polls.id,
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
        .where(eq(polls.id, input.id));

      if (poll.length === 0) {
        return null;
      }

      // Group options
      const pollWithOptions = {
        id: poll[0]!.id,
        title: poll[0]!.title,
        content: poll[0]!.content,
        createdAt: poll[0]!.createdAt,
        updatedAt: poll[0]!.updatedAt,
        author: poll[0]!.author,
        options: poll.map((row) => row.options).filter(Boolean),
      };

      return pollWithOptions;
    }),

  vote: publicProcedure
    .input(
      z.object({
        pollId: z.number(),
        optionId: z.number(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user already voted on this poll
      const existingVote = await db
        .select()
        .from(pollVotes)
        .where(
          and(
            eq(pollVotes.pollId, input.pollId),
            eq(pollVotes.userId, input.userId),
          ),
        )
        .limit(1);

      if (existingVote.length > 0) {
        throw new Error("User has already voted on this poll");
      }

      // Create the vote
      await db.insert(pollVotes).values({
        pollId: input.pollId,
        optionId: input.optionId,
        userId: input.userId,
      });

      // Update the option vote count using SQL expression
      await db
        .update(pollOptions)
        .set({ votes: sql`${pollOptions.votes} + 1` })
        .where(eq(pollOptions.id, input.optionId));

      // Log the activity
      await db.insert(activityLog).values({
        userId: input.userId,
        activityType: "poll_voted",
        targetId: input.pollId,
        targetType: "poll",
        description: "Voted on a poll",
      });

      return { success: true };
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.number(),
        userId: z.number().optional(), // Add userId for ownership validation
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Check if poll exists and get its creator
        const poll = await db
          .select({ createdById: polls.createdById })
          .from(polls)
          .where(eq(polls.id, input.id))
          .limit(1);

        if (poll.length === 0) {
          throw new Error("Poll not found");
        }

        // Check ownership and admin status
        if (input.userId) {
          // Get the current user's role
          const currentUser = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

          if (currentUser.length === 0) {
            throw new Error("User not found");
          }

          const isAdmin = currentUser[0]!.role === "admin";
          const isOwner = poll[0]!.createdById === input.userId;

          // Allow deletion if user is admin OR if user is the owner
          if (!isAdmin && !isOwner) {
            throw new Error(
              "You can only delete polls that you created, unless you are an admin",
            );
          }
        }

        // Delete poll votes first (they reference poll options)
        await db.delete(pollVotes).where(eq(pollVotes.pollId, input.id));

        // Delete poll options
        await db.delete(pollOptions).where(eq(pollOptions.pollId, input.id));

        // Delete activity log entries that reference this poll
        await db
          .delete(activityLog)
          .where(
            and(
              eq(activityLog.targetId, input.id),
              eq(activityLog.targetType, "poll"),
            ),
          );

        // Delete likes that reference this poll
        await db
          .delete(likes)
          .where(
            and(eq(likes.targetId, input.id), eq(likes.targetType, "poll")),
          );

        // Delete comments that reference this poll
        await db
          .delete(comments)
          .where(
            and(
              eq(comments.targetId, input.id),
              eq(comments.targetType, "poll"),
            ),
          );

        // Finally delete the poll
        await db.delete(polls).where(eq(polls.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error deleting poll:", error);
        throw error;
      }
    }),
});
