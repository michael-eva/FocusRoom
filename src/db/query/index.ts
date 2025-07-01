import { db } from "~/index";
import { resources, projects, projectTeamMembers } from "../schema";
import { eq } from "drizzle-orm";

export async function getResources() {
  const resourcesResponse = await db.select().from(resources).all();
  return resourcesResponse;
}

export async function getProjects() {
  const projectsWithData = await db.query.projects.findMany({
    with: {
      teamMembers: {
        with: {
          teamMember: true,
        },
      },
      tasks: true,
      resources: true,
    },
  });

  return projectsWithData;
}

export async function getProjectById(id: number) {
  const projectWithData = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      teamMembers: {
        with: {
          teamMember: true,
        },
      },
      tasks: {
        with: {
          assignee: true, // Include task assignee data
        },
      },
      resources: true,
    },
  });

  if (!projectWithData) {
    return null;
  }

  // Transform to match your expected data structure
  return {
    ...projectWithData,
    teamMembers: projectWithData.teamMembers.map((tm) => tm.teamMember),
    tasks: projectWithData.tasks.map((task) => ({
      ...task,
      assignee: task.assignee
        ? {
            name: task.assignee.name,
            avatar: task.assignee.avatar,
          }
        : null,
    })),
  };
}
