import { db } from "~/db";
import { resources, projects, projectTeamMembers, tasks } from "../schema";
import { eq } from "drizzle-orm";
import { client } from "~/lib/clerk";

export async function getResources() {
  const resourcesResponse = await db.select().from(resources).execute();
  return resourcesResponse;
}

export async function getProjects() {
  // Get all projects
  const allProjects = await db.select().from(projects).execute();

  // Get all project team members
  const allProjectTeamMembers = await db
    .select({
      projectId: projectTeamMembers.projectId,
      clerkUserId: projectTeamMembers.clerkUserId,
      role: projectTeamMembers.role,
      joinedAt: projectTeamMembers.joinedAt,
      invitedByClerkUserId: projectTeamMembers.invitedByClerkUserId,
    })
    .from(projectTeamMembers)
    .execute();

  // Get all tasks
  const allTasks = await db.select().from(tasks).execute();

  // Get all resources
  const allResources = await db.select().from(resources).execute();

  // Get unique clerk user IDs from team members
  const uniqueClerkUserIds = [
    ...new Set(
      allProjectTeamMembers
        .map((ptm) => ptm.clerkUserId)
        .filter((id): id is string => id !== null && id !== undefined),
    ),
  ];

  // Fetch user data from Clerk for all team members
  const userDataMap = new Map();
  if (uniqueClerkUserIds.length > 0) {
    try {
      // Try to fetch each user individually
      for (const userId of uniqueClerkUserIds) {
        try {
          const user = await client.users.getUser(userId);
          const userData = {
            id: user.id,
            name:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName ||
                  user.lastName ||
                  user.emailAddresses[0]?.emailAddress ||
                  "Unknown User",
            email: user.emailAddresses[0]?.emailAddress,
            imageUrl: user.imageUrl,
          };
          userDataMap.set(user.id, userData);
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching user data from Clerk:", error);
    }
  }

  // Group team members by project with user data
  const teamMembersByProject: Record<number, any[]> = {};
  for (const ptm of allProjectTeamMembers) {
    if (ptm.projectId) {
      if (!teamMembersByProject[ptm.projectId]) {
        teamMembersByProject[ptm.projectId] = [];
      }

      const userData = userDataMap.get(ptm.clerkUserId);
      teamMembersByProject[ptm.projectId]?.push({
        projectId: ptm.projectId,
        clerkUserId: ptm.clerkUserId,
        role: ptm.role,
        joinedAt: ptm.joinedAt,
        invitedByClerkUserId: ptm.invitedByClerkUserId,
        teamMember: userData || null,
      });
    }
  }

  // Group tasks by project
  const tasksByProject: Record<number, any[]> = {};
  for (const task of allTasks) {
    if (task.projectId) {
      if (!tasksByProject[task.projectId]) {
        tasksByProject[task.projectId] = [];
      }
      tasksByProject[task.projectId]?.push(task);
    }
  }

  // Group resources by project
  const resourcesByProject: Record<number, any[]> = {};
  for (const resource of allResources) {
    if (resource.projectId) {
      if (!resourcesByProject[resource.projectId]) {
        resourcesByProject[resource.projectId] = [];
      }
      resourcesByProject[resource.projectId]?.push(resource);
    }
  }

  // Combine everything
  const projectsWithData = allProjects.map((project) => ({
    ...project,
    teamMembers: teamMembersByProject[project.id] || [],
    tasks: tasksByProject[project.id] || [],
    resources: resourcesByProject[project.id] || [],
  }));

  return projectsWithData;
}

export async function getProjectById(id: number) {
  // Get the project
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
    .execute();

  if (project.length === 0) {
    return null;
  }

  // Get project team members
  const projectTeamMembersData = await db
    .select({
      projectId: projectTeamMembers.projectId,
      clerkUserId: projectTeamMembers.clerkUserId,
      role: projectTeamMembers.role,
      joinedAt: projectTeamMembers.joinedAt,
      invitedByClerkUserId: projectTeamMembers.invitedByClerkUserId,
    })
    .from(projectTeamMembers)
    .where(eq(projectTeamMembers.projectId, id))
    .execute();

  // Get unique clerk user IDs from team members
  const uniqueClerkUserIds = [
    ...new Set(
      projectTeamMembersData
        .map((ptm) => ptm.clerkUserId)
        .filter((id): id is string => id !== null && id !== undefined),
    ),
  ];

  // Fetch user data from Clerk for all team members
  const userDataMap = new Map();
  if (uniqueClerkUserIds.length > 0) {
    try {
      // Try to fetch each user individually
      for (const userId of uniqueClerkUserIds) {
        try {
          const user = await client.users.getUser(userId);
          const userData = {
            id: user.id,
            name:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName ||
                  user.lastName ||
                  user.emailAddresses[0]?.emailAddress ||
                  "Unknown User",
            email: user.emailAddresses[0]?.emailAddress,
            imageUrl: user.imageUrl,
          };
          userDataMap.set(user.id, userData);
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching user data from Clerk:", error);
    }
  }

  // Get tasks
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, id))
    .execute();

  // Get resources
  const projectResources = await db
    .select()
    .from(resources)
    .where(eq(resources.projectId, id))
    .execute();

  // Transform to match your expected data structure
  return {
    ...project[0],
    teamMembers: projectTeamMembersData.map((ptm) => ({
      ...ptm,
      teamMember: userDataMap.get(ptm.clerkUserId) || null,
    })),
    tasks: projectTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      completedAt: task.completedAt,
      projectId: task.projectId,
      assigneeClerkUserId: task.assigneeClerkUserId,
      assigneeClerkUserIds: task.assigneeClerkUserId
        ? (() => {
            try {
              // Try to parse as JSON array (multiple assignees)
              return JSON.parse(task.assigneeClerkUserId);
            } catch {
              // If not JSON, it's a single assignee
              return [task.assigneeClerkUserId];
            }
          })()
        : null,
    })),
    resources: projectResources,
  };
}
