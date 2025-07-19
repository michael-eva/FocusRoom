import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { getProjectById, getProjects, getResources } from "~/db/query";
import { db } from "~/db";
import {
  projects,
  projectTeamMembers,
  tasks,
  resources,
  projectActivities,
} from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export const projectRouter = createTRPCRouter({
  getResources: publicProcedure.query(async () => {
    return await getResources();
  }),
  getProjects: publicProcedure.query(async () => {
    const response = await getProjects();
    return response;
  }),
  getProjectById: publicProcedure
    .input(
      z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      }),
    )
    .query(async ({ input }) => {
      return await getProjectById(input.id);
    }),
  createProject: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        status: z
          .enum(["draft", "planning", "active", "completed", "on-hold"])
          .default("planning"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        deadline: z.date().optional(),
        createdBy: z.number(),
        teamMemberIds: z.array(z.string()).default([]),
        tasks: z
          .array(
            z.object({
              title: z.string().min(1, "Task title is required"),
              description: z.string().optional(),
              status: z
                .enum(["pending", "in-progress", "completed", "overdue"])
                .default("pending"),
              priority: z.enum(["low", "medium", "high"]).default("medium"),
              deadline: z.date().optional(),
              assigneeId: z.number().optional(),
            }),
          )
          .default([]),
        resources: z
          .array(
            z.object({
              title: z.string().min(1, "Resource title is required"),
              type: z.string().optional(),
              url: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ input }) => {
      // Create the project
      const newProject = await db
        .insert(projects)
        .values({
          name: input.name,
          description: input.description,
          status: input.status,
          priority: input.priority,
          deadline: input.deadline?.toISOString(),
          createdBy: input.createdBy,
          progress: 0,
          totalTasks: input.tasks.length,
          completedTasks: 0,
        })
        .returning();

      const projectId = newProject[0]!.id;

      // Add team members if provided
      if (input.teamMemberIds.length > 0) {
        const teamMemberData = input.teamMemberIds.map((teamMemberId) => ({
          projectId,
          teamMemberId,
          role: "member" as const,
        }));

        await db.insert(projectTeamMembers).values(teamMemberData);
      }

      // Create tasks if provided
      if (input.tasks.length > 0) {
        const taskData = input.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline?.toISOString(),
          projectId,
          assigneeId: task.assigneeId,
        }));

        await db.insert(tasks).values(taskData);
      }

      // Create resources if provided
      if (input.resources.length > 0) {
        const resourceData = input.resources.map((resource) => ({
          title: resource.title,
          type: resource.type,
          url: resource.url,
          description: resource.description,
          projectId,
          lastUpdated: new Date().toISOString(),
        }));

        await db.insert(resources).values(resourceData);
      }

      return newProject[0];
    }),
  saveDraft: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        status: z
          .enum(["draft", "planning", "active", "completed", "on-hold"])
          .default("draft"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        deadline: z.date().optional(),
        createdBy: z.number(),
        teamMemberIds: z.array(z.string()).default([]),
        tasks: z
          .array(
            z.object({
              title: z.string().optional(),
              description: z.string().optional(),
              status: z
                .enum(["pending", "in-progress", "completed", "overdue"])
                .default("pending"),
              priority: z.enum(["low", "medium", "high"]).default("medium"),
              deadline: z.date().optional(),
              assigneeId: z.number().optional(),
            }),
          )
          .default([]),
        resources: z
          .array(
            z.object({
              title: z.string().optional(),
              type: z.string().optional(),
              url: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ input }) => {
      // Create the draft project
      const newProject = await db
        .insert(projects)
        .values({
          name: input.name || "Untitled Project",
          description: input.description,
          status: "draft",
          priority: input.priority,
          deadline: input.deadline?.toISOString(),
          createdBy: input.createdBy,
          progress: 0,
          totalTasks: input.tasks.length,
          completedTasks: 0,
        })
        .returning();

      const projectId = newProject[0]!.id;

      // Add team members if provided
      if (input.teamMemberIds.length > 0) {
        const teamMemberData = input.teamMemberIds.map((teamMemberId) => ({
          projectId,
          teamMemberId,
          role: "member" as const,
        }));

        await db.insert(projectTeamMembers).values(teamMemberData);
      }

      // Create tasks if provided
      if (input.tasks.length > 0) {
        const taskData = input.tasks.map((task) => ({
          title: task.title || "Untitled Task",
          description: task.description,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline?.toISOString(),
          projectId,
          assigneeId: task.assigneeId,
        }));

        await db.insert(tasks).values(taskData);
      }

      // Create resources if provided
      if (input.resources.length > 0) {
        const resourceData = input.resources.map((resource) => ({
          title: resource.title || "Untitled Resource",
          type: resource.type,
          url: resource.url,
          description: resource.description,
          projectId,
          lastUpdated: new Date().toISOString(),
        }));

        await db.insert(resources).values(resourceData);
      }

      return newProject[0];
    }),
  createTask: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        status: z
          .enum(["pending", "in-progress", "completed", "overdue"])
          .default("pending"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        deadline: z.date().optional(),
        assigneeId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newTask = await db
        .insert(tasks)
        .values({
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          deadline: input.deadline?.toISOString(),
          projectId: input.projectId,
          assigneeId: input.assigneeId,
        })
        .returning();

      // Update project task counts
      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, input.projectId));
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db
        .update(projects)
        .set({
          totalTasks,
          completedTasks,
          progress,
        })
        .where(eq(projects.id, input.projectId));

      return newTask[0];
    }),
  createResource: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1, "Resource title is required"),
        type: z.string().optional(),
        url: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newResource = await db
        .insert(resources)
        .values({
          title: input.title,
          type: input.type,
          url: input.url,
          description: input.description,
          projectId: input.projectId,
          lastUpdated: new Date().toISOString(),
        })
        .returning();

      return newResource[0];
    }),
  updateTaskAssignment: publicProcedure
    .input(
      z.object({
        taskId: z.number(),
        assigneeId: z.number().optional(),
        deadline: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedTask = await db
        .update(tasks)
        .set({
          assigneeId: input.assigneeId,
          deadline: input.deadline?.toISOString(),
        })
        .where(eq(tasks.id, input.taskId))
        .returning();

      return updatedTask[0];
    }),
  updateTaskStatus: publicProcedure
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["pending", "in-progress", "completed", "overdue"]),
        completedAt: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Get the task to find the project ID
      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.taskId))
        .limit(1);

      if (task.length === 0) {
        throw new Error("Task not found");
      }

      const taskInfo = task[0];
      if (!taskInfo) {
        throw new Error("Task not found");
      }
      const projectId = taskInfo.projectId;

      const updateData: any = {
        status: input.status,
      };

      // Set completedAt when marking as completed
      if (input.status === "completed") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      const updatedTask = await db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, input.taskId))
        .returning();

      // Update project task counts and progress
      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId!));

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db
        .update(projects)
        .set({
          totalTasks,
          completedTasks,
          progress,
        })
        .where(eq(projects.id, projectId!));

      return updatedTask[0];
    }),
  updateTask: publicProcedure
    .input(
      z.object({
        taskId: z.number(),
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        status: z.enum(["pending", "in-progress", "completed", "overdue"]),
        priority: z.enum(["low", "medium", "high"]),
        deadline: z.date().optional(),
        assigneeId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Get the task to find the project ID
      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.taskId))
        .limit(1);

      if (task.length === 0) {
        throw new Error("Task not found");
      }

      const taskInfo = task[0];
      if (!taskInfo) {
        throw new Error("Task not found");
      }
      const projectId = taskInfo.projectId;

      const updateData: any = {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        deadline: input.deadline,
        assigneeId: input.assigneeId,
      };

      // Set completedAt when marking as completed
      if (input.status === "completed") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }

      const updatedTask = await db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, input.taskId))
        .returning();

      // Update project task counts and progress
      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId!));

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db
        .update(projects)
        .set({
          totalTasks,
          completedTasks,
          progress,
        })
        .where(eq(projects.id, projectId!));

      return updatedTask[0];
    }),
  logActivity: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        type: z.enum([
          "task_created",
          "task_completed",
          "task_assigned",
          "task_status_changed",
          "resource_added",
          "project_updated",
        ]),
        description: z.string(),
        taskId: z.number().optional(),
        resourceId: z.number().optional(),
        userId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newActivity = await db
        .insert(projectActivities)
        .values({
          projectId: input.projectId,
          type: input.type,
          description: input.description,
          taskId: input.taskId,
          resourceId: input.resourceId,
          userId: input.userId,
          timestamp: new Date().toISOString(),
        })
        .returning();

      return newActivity[0];
    }),
  getProjectActivities: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const activities = await db
        .select()
        .from(projectActivities)
        .where(eq(projectActivities.projectId, input.projectId))
        .orderBy(desc(projectActivities.timestamp))
        .limit(20);

      return activities;
    }),
  deleteTask: publicProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      // Get task info before deletion for activity logging
      const task = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.taskId))
        .limit(1);

      if (task.length === 0) {
        throw new Error("Task not found");
      }

      const taskInfo = task[0];
      if (!taskInfo) {
        throw new Error("Task not found");
      }
      const projectId = taskInfo.projectId;

      // Delete the task
      await db.delete(tasks).where(eq(tasks.id, input.taskId));

      // Update project task counts
      const remainingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId!));

      const totalTasks = remainingTasks.length;
      const completedTasks = remainingTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db
        .update(projects)
        .set({
          totalTasks,
          completedTasks,
          progress,
        })
        .where(eq(projects.id, projectId!));

      return { success: true, deletedTask: taskInfo };
    }),
  deleteResource: publicProcedure
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input }) => {
      // Get resource info before deletion for activity logging
      const resource = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.resourceId))
        .limit(1);

      if (resource.length === 0) {
        throw new Error("Resource not found");
      }

      const resourceInfo = resource[0];

      try {
        // First, delete activities that reference this resource
        await db
          .delete(projectActivities)
          .where(eq(projectActivities.resourceId, input.resourceId));

        // Then delete the resource
        await db.delete(resources).where(eq(resources.id, input.resourceId));

        return { success: true, deletedResource: resourceInfo };
      } catch (error) {
        console.error("Error deleting resource:", error);
        throw new Error("Failed to delete resource. Please try again.");
      }
    }),
  deleteProject: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      // Get project info before deletion
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      const projectInfo = project[0];

      try {
        // First, delete activities that reference specific tasks or resources
        // Get all tasks and resources for this project
        const projectTasks = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(eq(tasks.projectId, input.projectId));

        const projectResources = await db
          .select({ id: resources.id })
          .from(resources)
          .where(eq(resources.projectId, input.projectId));

        // Delete activities that reference these specific tasks
        for (const task of projectTasks) {
          await db
            .delete(projectActivities)
            .where(eq(projectActivities.taskId, task.id));
        }

        // Delete activities that reference these specific resources
        for (const resource of projectResources) {
          await db
            .delete(projectActivities)
            .where(eq(projectActivities.resourceId, resource.id));
        }

        // Now delete all remaining project activities
        await db
          .delete(projectActivities)
          .where(eq(projectActivities.projectId, input.projectId));

        // Delete project team members
        await db
          .delete(projectTeamMembers)
          .where(eq(projectTeamMembers.projectId, input.projectId));

        // Delete tasks
        await db.delete(tasks).where(eq(tasks.projectId, input.projectId));

        // Delete resources
        await db
          .delete(resources)
          .where(eq(resources.projectId, input.projectId));

        // Finally delete the project
        await db.delete(projects).where(eq(projects.id, input.projectId));

        return { success: true, deletedProject: projectInfo };
      } catch (error) {
        console.error("Error deleting project:", error);
        throw new Error("Failed to delete project. Please try again.");
      }
    }),
  updateProject: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1, "Project name is required").optional(),
        description: z.string().optional(),
        status: z
          .enum(["draft", "planning", "active", "completed", "on-hold"])
          .optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        deadline: z.date().optional(),
        teamMemberIds: z.array(z.string()).optional(),
        tasks: z
          .array(
            z.object({
              title: z.string().min(1, "Task title is required"),
              description: z.string().optional(),
              status: z
                .enum(["pending", "in-progress", "completed", "overdue"])
                .default("pending"),
              priority: z.enum(["low", "medium", "high"]).default("medium"),
              deadline: z.date().optional(),
              assigneeId: z.number().optional(),
            }),
          )
          .optional(),
        resources: z
          .array(
            z.object({
              title: z.string().min(1, "Resource title is required"),
              type: z.string().optional(),
              url: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        projectId,
        teamMemberIds: newTeamMemberIds,
        tasks: newTasks,
        resources: newResources,
        ...updateData
      } = input;

      // Update the project
      const updatedProject = await db
        .update(projects)
        .set({
          ...updateData,
          deadline: updateData.deadline?.toISOString(),
          totalTasks: newTasks?.length || undefined,
        })
        .where(eq(projects.id, projectId))
        .returning();

      if (updatedProject.length === 0) {
        throw new Error("Project not found");
      }

      // Update team members if provided
      if (newTeamMemberIds !== undefined) {
        // Remove existing team members
        await db
          .delete(projectTeamMembers)
          .where(eq(projectTeamMembers.projectId, projectId));

        // Add new team members
        if (newTeamMemberIds.length > 0) {
          const teamMemberData = newTeamMemberIds.map((teamMemberId) => ({
            projectId,
            teamMemberId,
            role: "member" as const,
          }));

          await db.insert(projectTeamMembers).values(teamMemberData);
        }
      }

      // Update tasks if provided
      if (newTasks !== undefined) {
        // Remove existing tasks
        await db.delete(tasks).where(eq(tasks.projectId, projectId));

        // Add new tasks
        if (newTasks.length > 0) {
          const taskData = newTasks.map((task) => ({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline?.toISOString(),
            projectId,
            assigneeId: task.assigneeId,
          }));

          await db.insert(tasks).values(taskData);
        }
      }

      // Update resources if provided
      if (newResources !== undefined) {
        // Remove existing resources
        await db.delete(resources).where(eq(resources.projectId, projectId));

        // Add new resources
        if (newResources.length > 0) {
          const resourceData = newResources.map((resource) => ({
            title: resource.title,
            type: resource.type,
            url: resource.url,
            description: resource.description,
            projectId,
            lastUpdated: new Date().toISOString(),
          }));

          await db.insert(resources).values(resourceData);
        }
      }

      // Update project task counts and progress
      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId));

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await db
        .update(projects)
        .set({
          totalTasks,
          completedTasks,
          progress,
        })
        .where(eq(projects.id, projectId));

      return updatedProject[0];
    }),
});
