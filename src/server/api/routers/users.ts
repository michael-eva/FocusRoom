import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { users, teamMembers, projectTeamMembers, projects } from "~/db/schema";
import { db } from "~/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createInvitation } from "~/services/clerk";
import { client } from "~/lib/clerk";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

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

  // Get all team members
  getAllTeamMembers: publicProcedure.query(async () => {
    const allTeamMembers = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
        avatar: teamMembers.avatar,
        userId: teamMembers.userId,
      })
      .from(teamMembers)
      .orderBy(teamMembers.name);

    return allTeamMembers;
  }),

  // Get team members for a specific project/focus room
  getTeamMembers: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const teamMembersData = await db
        .select({
          id: teamMembers.id,
          name: teamMembers.name,
          email: teamMembers.email,
          avatar: teamMembers.avatar,
          userId: teamMembers.userId,
          projectRole: projectTeamMembers.role,
          joinedAt: projectTeamMembers.joinedAt,
          invitedBy: projectTeamMembers.invitedBy,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            invitedAt: users.invitedAt,
            acceptedAt: users.acceptedAt,
          },
        })
        .from(projectTeamMembers)
        .leftJoin(
          teamMembers,
          eq(projectTeamMembers.teamMemberId, teamMembers.id),
        )
        .leftJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(projectTeamMembers.projectId, input.projectId))
        .orderBy(desc(projectTeamMembers.joinedAt));

      return teamMembersData;
    }),

  // Get total user count for community stats
  getCount: publicProcedure.query(async () => {
    const result = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(users);

    return result[0]?.count || 0;
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
          id: teamMembers.id,
          name: teamMembers.name,
          email: teamMembers.email,
          avatar: teamMembers.avatar,
          userId: teamMembers.userId,
          projectRole: projectTeamMembers.role,
          joinedAt: projectTeamMembers.joinedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          },
        })
        .from(projectTeamMembers)
        .leftJoin(
          teamMembers,
          eq(projectTeamMembers.teamMemberId, teamMembers.id),
        )
        .leftJoin(users, eq(teamMembers.userId, users.id))
        .where(
          and(
            eq(projectTeamMembers.projectId, input.projectId),
            eq(projectTeamMembers.role, input.role),
          ),
        )
        .orderBy(teamMembers.name);

      return usersByRole;
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
        invitedBy: z.number(), // team member ID who is inviting
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
          },
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
        teamMemberId: z.string(),
        role: z.enum(["admin", "member"]),
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
      const updatedUser = await client.users.updateUserMetadata(
        input.teamMemberId,
        {
          publicMetadata: {
            role: input.role,
          },
        },
      );
      return updatedUser;
    }),

  // Accept invitation (complete user profile)
  acceptInvitation: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedUser = await db
        .update(users)
        .set({
          name: input.name,
          acceptedAt: new Date().toISOString(),
        })
        .where(eq(users.id, input.userId))
        .returning();

      return updatedUser[0];
    }),

  // Remove user from a specific project
  removeFromProject: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        teamMemberId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .delete(projectTeamMembers)
        .where(
          and(
            eq(projectTeamMembers.projectId, input.projectId),
            eq(projectTeamMembers.teamMemberId, input.teamMemberId),
          ),
        );
      return { success: true };
    }),

  // Remove user completely (from all projects and users table)
  removeUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      // Remove from all project teams
      const teamMembersToRemove = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.userId, parseInt(input.userId)));

      for (const teamMember of teamMembersToRemove) {
        await db
          .delete(projectTeamMembers)
          .where(eq(projectTeamMembers.teamMemberId, teamMember.id.toString()));
      }

      // Remove team members
      await db
        .delete(teamMembers)
        .where(eq(teamMembers.userId, parseInt(input.userId)));

      // Remove user
      await db.delete(users).where(eq(users.id, parseInt(input.userId)));
      return { success: true };
    }),

  // Resend invitation
  resendInvitation: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const updatedUser = await db
        .update(users)
        .set({ invitedAt: new Date().toISOString() })
        .where(eq(users.id, input.userId))
        .returning();

      return updatedUser[0];
    }),
});
