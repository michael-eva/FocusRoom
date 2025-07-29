import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import {
  polls,
  pollOptions,
  pollVotes,
  activityLog,
  likes,
  comments,
} from "~/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { client } from "~/lib/clerk";
import type { User } from "@clerk/nextjs/server";

export const pollsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        question: z.string().min(1).max(500).optional(),
        title: z.string().min(1).max(500).optional(), // For backward compatibility
        content: z.string().min(1).max(500).optional(), // For backward compatibility
        options: z.array(z.string().min(1).max(200)).min(2).max(10),
        createdByClerkUserId: z.string().optional(),
        createdById: z.number().optional(), // For backward compatibility
        endsAt: z.string().min(1, "End date is required"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log("=== STARTING POLL CREATION ===");
        console.log("Input:", input);

        // Handle backward compatibility
        const question = input.question || input.title || input.content;
        const createdByClerkUserId =
          input.createdByClerkUserId ||
          (input.createdById ? input.createdById.toString() : undefined);

        if (!question) {
          throw new Error("question/title/content is required");
        }

        if (!createdByClerkUserId) {
          throw new Error("createdByClerkUserId/createdById is required");
        }

        if (!input.endsAt) {
          throw new Error("endsAt is required");
        }

        // Create the poll
        console.log("Inserting poll into database...");
        const newPoll = await db
          .insert(polls)
          .values({
            question: question,
            createdByClerkUserId: createdByClerkUserId,
            endsAt: input.endsAt,
            isActive: true,
          })
          .returning();

        console.log("Poll created successfully:", newPoll);
        const pollId = newPoll[0]!.id;
        console.log("Poll ID:", pollId);

        // Create poll options
        const pollOptionsData = input.options.map((optionText) => ({
          pollId,
          optionText,
          votes: 0,
        }));

        console.log("Creating poll options:", pollOptionsData);
        const insertedOptions = await db
          .insert(pollOptions)
          .values(pollOptionsData)
          .returning();
        console.log("Poll options created:", insertedOptions);

        // Log the activity
        console.log("Logging activity...");
        const activityLogResult = await db
          .insert(activityLog)
          .values({
            clerkUserId: createdByClerkUserId,
            action: "poll_created",
            details: `Created poll: ${question}`,
            metadata: { pollId },
          })
          .returning();
        console.log("Activity logged:", activityLogResult);

        console.log("=== POLL CREATION COMPLETED SUCCESSFULLY ===");
        return newPoll[0];
      } catch (error) {
        console.error("=== POLL CREATION ERROR ===");
        console.error("Error creating poll:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    }),

  // Get total poll count for community stats
  getCount: publicProcedure.query(async () => {
    const result = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(polls);

    return result[0]?.count || 0;
  }),

  getAll: publicProcedure.query(async () => {
    const allPolls = await db
      .select({
        id: polls.id,
        question: polls.question,
        createdAt: polls.createdAt,
        createdByClerkUserId: polls.createdByClerkUserId,
        endsAt: polls.endsAt,
        isActive: polls.isActive,
      })
      .from(polls)
      .orderBy(desc(polls.createdAt));

    // Fetch user details from Clerk for each poll
    const pollsWithUsers = await Promise.all(
      allPolls.map(async (poll) => {
        let user: User | null = null;
        if (poll.createdByClerkUserId) {
          try {
            user = await client.users.getUser(poll.createdByClerkUserId);
          } catch (error) {
            console.error(
              `Failed to fetch user ${poll.createdByClerkUserId}:`,
              error,
            );
          }
        }

        return {
          ...poll,
          creator: user
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

    return pollsWithUsers;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const poll = await db
        .select({
          id: polls.id,
          question: polls.question,
          createdAt: polls.createdAt,
          createdByClerkUserId: polls.createdByClerkUserId,
          endsAt: polls.endsAt,
          isActive: polls.isActive,
        })
        .from(polls)
        .where(eq(polls.id, input.id))
        .limit(1);

      if (poll.length === 0) {
        return null;
      }

      // Get poll options
      const options = await db
        .select({
          id: pollOptions.id,
          optionText: pollOptions.optionText,
          votes: pollOptions.votes,
        })
        .from(pollOptions)
        .where(eq(pollOptions.pollId, input.id))
        .orderBy(pollOptions.id);

      // Get creator details from Clerk
      let creator: any = null;
      if (poll[0]!.createdByClerkUserId) {
        try {
          const user = await client.users.getUser(
            poll[0]!.createdByClerkUserId,
          );
          creator = {
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.emailAddresses[0]?.emailAddress,
            email: user.emailAddresses[0]?.emailAddress,
            imageUrl: user.imageUrl,
          };
        } catch (error) {
          console.error(
            `Failed to fetch user ${poll[0]!.createdByClerkUserId}:`,
            error,
          );
        }
      }

      return {
        ...poll[0]!,
        creator,
        options,
      };
    }),

  vote: publicProcedure
    .input(
      z.object({
        pollId: z.number(),
        optionId: z.number(),
        clerkUserId: z.string(),
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
            eq(pollVotes.clerkUserId, input.clerkUserId),
          ),
        )
        .limit(1);

      let isVoteChange = false;

      if (existingVote.length > 0) {
        // User is changing their vote
        const oldOptionId = existingVote[0]!.optionId;

        // Only proceed if they're voting for a different option
        if (oldOptionId === input.optionId) {
          return {
            success: true,
            message: "You have already voted for this option",
          };
        }

        isVoteChange = true;

        // Update the existing vote record
        await db
          .update(pollVotes)
          .set({
            optionId: input.optionId,
            votedAt: sql`now()`,
          })
          .where(eq(pollVotes.id, existingVote[0]!.id));

        // Decrease vote count for the old option
        if (oldOptionId) {
          await db
            .update(pollOptions)
            .set({ votes: sql`${pollOptions.votes} - 1` })
            .where(eq(pollOptions.id, oldOptionId));
        }

        // Increase vote count for the new option
        await db
          .update(pollOptions)
          .set({ votes: sql`${pollOptions.votes} + 1` })
          .where(eq(pollOptions.id, input.optionId));
      } else {
        // Create a new vote
        await db.insert(pollVotes).values({
          pollId: input.pollId,
          optionId: input.optionId,
          clerkUserId: input.clerkUserId,
        });

        // Update the option vote count using SQL expression
        await db
          .update(pollOptions)
          .set({ votes: sql`${pollOptions.votes} + 1` })
          .where(eq(pollOptions.id, input.optionId));
      }

      // Log the activity
      await db.insert(activityLog).values({
        clerkUserId: input.clerkUserId,
        action: isVoteChange ? "poll_vote_changed" : "poll_voted",
        details: isVoteChange ? "Changed vote on a poll" : "Voted on a poll",
        metadata: { pollId: input.pollId, optionId: input.optionId },
      });

      return {
        success: true,
        message: isVoteChange
          ? "Vote changed successfully"
          : "Vote cast successfully",
      };
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.number(),
        clerkUserId: z.string().optional(), // Changed to string for Clerk user ID
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Check if poll exists and get its creator
        const poll = await db
          .select({ createdByClerkUserId: polls.createdByClerkUserId })
          .from(polls)
          .where(eq(polls.id, input.id))
          .limit(1);

        if (poll.length === 0) {
          throw new Error("Poll not found");
        }

        // Check ownership and admin status
        if (input.clerkUserId) {
          // For now, allow deletion if user ID matches the creator
          // In a real app, you'd check Clerk user roles
          const isOwner = poll[0]!.createdByClerkUserId === input.clerkUserId;

          // Allow deletion if user is the owner
          if (!isOwner) {
            throw new Error("You can only delete polls that you created");
          }
        }

        // --- Robust deletion: ---
        // 1. Get all poll option IDs for this poll
        const optionRows = await db
          .select({ id: pollOptions.id })
          .from(pollOptions)
          .where(eq(pollOptions.pollId, input.id));
        const optionIds = optionRows.map((row) => row.id);

        // 2. Delete all votes for these option IDs
        if (optionIds.length > 0) {
          await db
            .delete(pollVotes)
            .where(inArray(pollVotes.optionId, optionIds));
        }
        // 2b. Delete all votes for this poll (in case any remain)
        await db.delete(pollVotes).where(eq(pollVotes.pollId, input.id));

        // 3. Delete poll options
        await db.delete(pollOptions).where(eq(pollOptions.pollId, input.id));

        // 4. Delete activity log entries that reference this poll
        await db
          .delete(activityLog)
          .where(
            and(
              sql`${activityLog.metadata}->>'pollId' = ${input.id.toString()}`,
            ),
          );

        // 5. Delete likes that reference this poll
        await db.delete(likes).where(eq(likes.pollId, input.id));

        // 6. Delete comments that reference this poll
        await db.delete(comments).where(eq(comments.pollId, input.id));

        // 7. Finally delete the poll
        await db.delete(polls).where(eq(polls.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error deleting poll:", error);
        throw error;
      }
    }),
});
