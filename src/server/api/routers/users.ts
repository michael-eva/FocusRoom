import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users, teamMembers, projectTeamMembers, projects } from "~/db/schema";
import { db } from "~/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const usersRouter = createTRPCRouter({
  // Get all users
  getAll: publicProcedure.query(async () => {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        invitedAt: users.invitedAt,
        invitedBy: users.invitedBy,
        acceptedAt: users.acceptedAt,
      })
      .from(users)
      .orderBy(users.name);

    return allUsers;
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
  getPendingInvitations: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const pendingUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          invitedAt: users.invitedAt,
          invitedBy: users.invitedBy,
          acceptedAt: users.acceptedAt,
        })
        .from(users)
        .where(and(isNull(users.acceptedAt), isNull(users.name)))
        .orderBy(users.invitedAt);

      return pendingUsers;
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
      // Check if user already exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      let userId: number;

      if (user.length === 0) {
        // Create new user
        const newUser = await db
          .insert(users)
          .values({
            email: input.email,
            role: input.role,
            invitedAt: new Date().toISOString(),
            invitedBy: input.invitedBy,
          })
          .returning();
        userId = newUser[0]!.id;
      } else {
        userId = user[0]!.id;
      }

      // Check if team member already exists for this user
      const teamMember = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, userId))
        .limit(1);

      let teamMemberId: number;

      if (teamMember.length === 0) {
        // Create new team member
        const newTeamMember = await db
          .insert(teamMembers)
          .values({
            userId: userId,
            email: input.email,
          })
          .returning();
        teamMemberId = newTeamMember[0]!.id;
      } else {
        teamMemberId = teamMember[0]!.id;
      }

      // Check if already a member of this project
      const existingProjectMember = await db
        .select()
        .from(projectTeamMembers)
        .where(
          and(
            eq(projectTeamMembers.projectId, input.projectId),
            eq(projectTeamMembers.teamMemberId, teamMemberId),
          ),
        )
        .limit(1);

      if (existingProjectMember.length > 0) {
        throw new Error("User is already a member of this project");
      }

      // Add to project team
      const newProjectMember = await db
        .insert(projectTeamMembers)
        .values({
          projectId: input.projectId,
          teamMemberId: teamMemberId,
          role: input.role,
          invitedBy: input.invitedBy,
        })
        .returning();

      return newProjectMember[0];
    }),

  // Update user role in a specific project
  updateProjectRole: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        teamMemberId: z.number(),
        role: z.enum(["admin", "member", "moderator"]),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedMember = await db
        .update(projectTeamMembers)
        .set({ role: input.role })
        .where(
          and(
            eq(projectTeamMembers.projectId, input.projectId),
            eq(projectTeamMembers.teamMemberId, input.teamMemberId),
          ),
        )
        .returning();

      return updatedMember[0];
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
        teamMemberId: z.number(),
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
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      // Remove from all project teams
      const teamMembersToRemove = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.userId, input.userId));

      for (const teamMember of teamMembersToRemove) {
        await db
          .delete(projectTeamMembers)
          .where(eq(projectTeamMembers.teamMemberId, teamMember.id));
      }

      // Remove team members
      await db.delete(teamMembers).where(eq(teamMembers.userId, input.userId));

      // Remove user
      await db.delete(users).where(eq(users.id, input.userId));
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
