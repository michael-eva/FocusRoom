import { client } from "~/lib/clerk";
import { db } from "~/db";
import { projects, projectTeamMembers, tasks, resources } from "~/db/schema";
import { eq, and } from "drizzle-orm";

export async function checkCanDeleteContent(
  userId: string,
  contentOwnerId: string | null | undefined
): Promise<{ canDelete: boolean; isAdmin: boolean; isOwner: boolean }> {
  try {
    // Get current user from Clerk
    const user = await client.users.getUser(userId);
    
    // Check if user is admin via Clerk metadata
    const isAdmin = user.publicMetadata?.role === "admin";
    
    // Check if user owns the content
    const isOwner = contentOwnerId === userId;
    
    // User can delete if they're admin OR owner
    const canDelete = isAdmin || isOwner;
    
    return { canDelete, isAdmin, isOwner };
  } catch (error) {
    console.error("Error checking delete permissions:", error);
    return { canDelete: false, isAdmin: false, isOwner: false };
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  try {
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === "admin";
    
    if (!isAdmin) {
      throw new Error("Admin privileges required");
    }
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    throw new Error("Admin privileges required");
  }
}

export async function checkCanEditProject(
  userId: string,
  projectId: number
): Promise<{ canEdit: boolean; isAdmin: boolean; isCreator: boolean; isTeamMember: boolean }> {
  try {
    // Get current user from Clerk
    const user = await client.users.getUser(userId);
    
    // Check if user is admin via Clerk metadata
    const isAdmin = user.publicMetadata?.role === "admin";
    
    // Get project details
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (project.length === 0) {
      return { canEdit: false, isAdmin, isCreator: false, isTeamMember: false };
    }
    
    // Check if user is the creator
    const isCreator = project[0]?.createdBy === userId;
    
    // Check if user is a team member
    const teamMembership = await db
      .select()
      .from(projectTeamMembers)
      .where(
        and(
          eq(projectTeamMembers.projectId, projectId),
          eq(projectTeamMembers.clerkUserId, userId)
        )
      )
      .limit(1);
    
    const isTeamMember = teamMembership.length > 0;
    
    // User can edit if they're admin, creator, or team member
    const canEdit = isAdmin || isCreator || isTeamMember;
    
    return { canEdit, isAdmin, isCreator, isTeamMember };
  } catch (error) {
    console.error("Error checking project edit permissions:", error);
    return { canEdit: false, isAdmin: false, isCreator: false, isTeamMember: false };
  }
}

export async function requireProjectEditAccess(
  userId: string,
  projectId: number
): Promise<void> {
  const { canEdit } = await checkCanEditProject(userId, projectId);
  
  if (!canEdit) {
    throw new Error("Insufficient permissions to edit this project");
  }
}

export async function requireTaskEditAccess(
  userId: string,
  taskId: number
): Promise<void> {
  try {
    // Get the project ID from the task
    const task = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    if (task.length === 0) {
      throw new Error("Task not found");
    }
    
    const projectId = task[0]!.projectId;
    if (!projectId) {
      throw new Error("Task has no associated project");
    }
    await requireProjectEditAccess(userId, projectId);
  } catch (error) {
    console.error("Error checking task edit permissions:", error);
    throw new Error("Insufficient permissions to edit this task");
  }
}

export async function requireResourceEditAccess(
  userId: string,
  resourceId: number
): Promise<void> {
  try {
    // Get the project ID from the resource
    const resource = await db
      .select({ projectId: resources.projectId })
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);
    
    if (resource.length === 0) {
      throw new Error("Resource not found");
    }
    
    const projectId = resource[0]!.projectId;
    if (!projectId) {
      throw new Error("Resource has no associated project");
    }
    await requireProjectEditAccess(userId, projectId);
  } catch (error) {
    console.error("Error checking resource edit permissions:", error);
    throw new Error("Insufficient permissions to edit this resource");
  }
}