import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { projectTeamMembers, projects } from "~/db/schema";
import { db } from "~/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createInvitation } from "~/services/clerk";
import { client } from "~/lib/clerk";
import { safeGetUser } from "~/lib/clerk-utils";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import type { User } from "@clerk/nextjs/server";

export const usersRouter = createTRPCRouter({
  // Get current user's profile
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    // ctx.userId is guaranteed to exist in protected procedures
    const user = await client.users.getUser(ctx.userId);
    return user;
  }),

  // Get all users
  getAll: publicProcedure.query(async () => {
    const users = await client.users.getUserList();
    return users;
  }),

  // Get current user if logged in (public procedure example)
  getCurrentUserIfLoggedIn: publicProcedure.query(async ({ ctx }) => {
    // ctx.userId might be null in public procedures
    if (!ctx.userId) {
      return null;
    }

    const user = await client.users.getUser(ctx.userId);
    return user;
  }),

  // Get all team members for a project (using Clerk users)
  getAllTeamMembers: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const projectTeamMembersData = await db
        .select({
          clerkUserId: projectTeamMembers.clerkUserId,
          role: projectTeamMembers.role,
          joinedAt: projectTeamMembers.joinedAt,
          invitedByClerkUserId: projectTeamMembers.invitedByClerkUserId,
        })
        .from(projectTeamMembers)
        .where(eq(projectTeamMembers.projectId, input.projectId))
        .orderBy(desc(projectTeamMembers.joinedAt));

      // Fetch user details from Clerk for each team member
      const teamMembersWithDetails = await Promise.all(
        projectTeamMembersData.map(async (member) => {
          const user = await safeGetUser(member?.clerkUserId || "");

          return {
            clerkUserId: member.clerkUserId,
            role: member.role,
            joinedAt: member.joinedAt,
            invitedByClerkUserId: member.invitedByClerkUserId,
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

      return teamMembersWithDetails;
    }),

  // Get team members for a specific project/focus room
  getTeamMembers: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const projectTeamMembersData = await db
        .select({
          clerkUserId: projectTeamMembers.clerkUserId,
          role: projectTeamMembers.role,
          joinedAt: projectTeamMembers.joinedAt,
          invitedByClerkUserId: projectTeamMembers.invitedByClerkUserId,
        })
        .from(projectTeamMembers)
        .where(eq(projectTeamMembers.projectId, input.projectId))
        .orderBy(desc(projectTeamMembers.joinedAt));

      // Fetch user details from Clerk for each team member
      const teamMembersWithDetails = await Promise.all(
        projectTeamMembersData.map(async (member) => {
          const user = await safeGetUser(member.clerkUserId || "");

          return {
            clerkUserId: member.clerkUserId,
            role: member.role,
            joinedAt: member.joinedAt,
            invitedByClerkUserId: member.invitedByClerkUserId,
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

      return teamMembersWithDetails;
    }),

  // Get total user count for community stats (from Clerk)
  getCount: publicProcedure.query(async () => {
    const users = await client.users.getUserList();
    return users.data.length;
  }),

  // Get users by role in a specific project
  getByRole: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        role: z.enum(["admin", "member", "moderator"]),
      }),
    )
    .query(async ({ input }) => {
      const usersByRole = await db
        .select({
          clerkUserId: projectTeamMembers.clerkUserId,
          role: projectTeamMembers.role,
          joinedAt: projectTeamMembers.joinedAt,
          invitedByClerkUserId: projectTeamMembers.invitedByClerkUserId,
        })
        .from(projectTeamMembers)
        .where(
          and(
            eq(projectTeamMembers.projectId, input.projectId),
            eq(projectTeamMembers.role, input.role),
          ),
        )
        .orderBy(projectTeamMembers.joinedAt);

      // Fetch user details from Clerk
      const usersWithDetails = await Promise.all(
        usersByRole.map(async (member) => {
          const user = await safeGetUser(member.clerkUserId || "");

          return {
            clerkUserId: member.clerkUserId,
            role: member.role,
            joinedAt: member.joinedAt,
            invitedByClerkUserId: member.invitedByClerkUserId,
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

      return usersWithDetails;
    }),

  // Get pending invitations for a specific project
  getPendingInvitations: publicProcedure.query(async () => {
    const invitations = await client.invitations.getInvitationList();

    // Filter for pending invitations
    const pendingInvitations = invitations.data.filter(
      (invitation) => invitation.status === "pending",
    );

    return pendingInvitations;
  }),

  // Invite a new user to a specific project/focus room
  inviteToProject: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        projectId: z.number(),
        role: z.enum(["admin", "member", "moderator"]).default("member"),
        invitedBy: z.string(), // clerk user ID who is inviting
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const invitation = await createInvitation({
          emailAddress: input.email,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation`,
          notify: true,
          ignoreExisting: true,
          publicMetadata: {
            role: input.role,
            projectId: input.projectId,
          },
        });

        // Add to project team members table
        await db.insert(projectTeamMembers).values({
          projectId: input.projectId,
          clerkUserId: invitation.emailAddress, // This will be updated when user accepts
          role: input.role,
          invitedByClerkUserId: input.invitedBy,
        });

        return invitation;
      } catch (error) {
        console.error("Failed to create invitation:", error);
        throw new Error(
          "Failed to create invitation. Please check your Clerk configuration.",
        );
      }
    }),

  // Update user role in a specific project
  updateProjectRole: protectedProcedure
    .input(
      z.object({
        clerkUserId: z.string(),
        role: z.enum(["admin", "member"]),
        projectId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const currentUser = await client.users.getUser(ctx.userId);
      console.log("User role:", currentUser.publicMetadata?.role);

      if (currentUser.publicMetadata?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update user roles",
        });
      }

      // Update in project team members table
      await db
        .update(projectTeamMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(projectTeamMembers.projectId, input.projectId),
            eq(projectTeamMembers.clerkUserId, input.clerkUserId),
          ),
        );

      // Also update the user's global role in Clerk's publicMetadata
      await client.users.updateUserMetadata(input.clerkUserId, {
        publicMetadata: {
          role: input.role,
        },
      });

      return { success: true };
    }),

  // Remove user from a specific project and delete from Clerk
  removeFromProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        clerkUserId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const currentUser = await client.users.getUser(ctx.userId);

      if (currentUser.publicMetadata?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can remove users",
        });
      }

      try {
        // First remove from project team members
        await db
          .delete(projectTeamMembers)
          .where(
            and(
              eq(projectTeamMembers.projectId, input.projectId),
              eq(projectTeamMembers.clerkUserId, input.clerkUserId),
            ),
          );

        // Then delete the user from Clerk entirely
        await client.users.deleteUser(input.clerkUserId);

        console.log(
          "Successfully removed user from project and deleted from Clerk:",
          {
            projectId: input.projectId,
            clerkUserId: input.clerkUserId,
            deletedBy: ctx.userId,
          },
        );

        return { success: true };
      } catch (error) {
        console.error("Failed to remove user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove user. They may have already been deleted.",
        });
      }
    }),
});
