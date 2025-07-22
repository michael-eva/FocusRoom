import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { chatMessages, activityLog } from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { client } from "~/lib/clerk";
import type { User } from "@clerk/nextjs/server";

export const chatRouter = createTRPCRouter({
  // Get chat messages with pagination
  getMessages: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const messages = await db
        .select()
        .from(chatMessages)
        .orderBy(chatMessages.createdAt) // Ascending order (oldest first)
        .limit(input.limit)
        .offset(input.offset);

      // Get user information from Clerk for each message
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          try {
            const user = await client.users.getUser(message.clerkUserId);
            return {
              ...message,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                emailAddresses: user.emailAddresses,
              },
            };
          } catch (error) {
            console.error(
              `Failed to get user data for ${message.clerkUserId}:`,
              error,
            );
            return {
              ...message,
              user: {
                id: message.clerkUserId,
                firstName: "Unknown",
                lastName: "User",
                imageUrl: null,
                emailAddresses: [],
              },
            };
          }
        }),
      );

      return messagesWithUsers; // Return in chronological order (oldest first)
    }),

  // Send a new chat message
  sendMessage: publicProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
        clerkUserId: z.string(),
        replyToId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Create the message
      const newMessage = await db
        .insert(chatMessages)
        .values({
          content: input.content,
          clerkUserId: input.clerkUserId,
          replyToId: input.replyToId,
        })
        .returning();

      // Log activity for the chat message
      await db.insert(activityLog).values({
        clerkUserId: input.clerkUserId,
        action: "chat_message_sent",
        details: `User sent a chat message`,
        metadata: {
          messageId: newMessage[0]?.id,
          messageLength: input.content.length,
          isReply: !!input.replyToId,
        },
      });

      return newMessage[0];
    }),

  // Edit a chat message (optional feature)
  editMessage: publicProcedure
    .input(
      z.object({
        messageId: z.number(),
        content: z.string().min(1).max(1000),
        clerkUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Verify the user owns the message
      const existingMessage = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.id, input.messageId),
            eq(chatMessages.clerkUserId, input.clerkUserId),
          ),
        )
        .limit(1);

      if (existingMessage.length === 0) {
        throw new Error(
          "Message not found or you don't have permission to edit it",
        );
      }

      // Update the message
      const updatedMessage = await db
        .update(chatMessages)
        .set({
          content: input.content,
          isEdited: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(chatMessages.id, input.messageId))
        .returning();

      return updatedMessage[0];
    }),

  // Delete a chat message (optional feature)
  deleteMessage: publicProcedure
    .input(
      z.object({
        messageId: z.number(),
        clerkUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Verify the user owns the message or is an admin
      const existingMessage = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.id, input.messageId),
            eq(chatMessages.clerkUserId, input.clerkUserId),
          ),
        )
        .limit(1);

      if (existingMessage.length === 0) {
        throw new Error(
          "Message not found or you don't have permission to delete it",
        );
      }

      // Delete the message
      await db.delete(chatMessages).where(eq(chatMessages.id, input.messageId));

      return { success: true };
    }),

  // Get recent message count for notifications
  getRecentMessageCount: publicProcedure
    .input(
      z.object({
        since: z.string(), // ISO timestamp
      }),
    )
    .query(async ({ input }) => {
      const count = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.createdAt, input.since));

      return count.length;
    }),
});
