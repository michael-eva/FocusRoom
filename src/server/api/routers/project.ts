
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

const resources = [
    {
        id: 1,
        title: "Venue Contact List",
        type: "Google Sheets",
        url: "https://docs.google.com/spreadsheets/d/example",
        description: "Master list of all venues with contact information and status",
        lastUpdated: "2025-01-15",
    },
    {
        id: 2,
        title: "Outreach Email Templates",
        type: "Google Docs",
        url: "https://docs.google.com/document/d/example",
        description: "Collection of email templates for different types of venues",
        lastUpdated: "2025-01-12",
    },
    {
        id: 3,
        title: "Partnership Agreement Template",
        type: "Google Docs",
        url: "https://docs.google.com/document/d/example2",
        description: "Legal template for venue partnership agreements",
        lastUpdated: "2025-01-10",
    },
    {
        id: 4,
        title: "Venue Response Tracker",
        type: "Google Sheets",
        url: "https://docs.google.com/spreadsheets/d/example2",
        description: "Track responses and follow-up actions for each venue",
        lastUpdated: "2025-01-14",
    },
];

const projects = [
    {
        id: "venue-outreach",
        name: "Venue outreach campaign",
        description: "Reach out to local venues for partnership opportunities",
        status: "active",
        progress: 65,
        totalTasks: 12,
        completedTasks: 8,
        teamMembers: ["Alice", "Bob", "Charlie"],
        deadline: "2025-02-15",
        priority: "high",
    },
    {
        id: "songwriters-showcase",
        name: "Songwriters Showcase Event",
        description: "Organize monthly showcase for local songwriters",
        status: "active",
        progress: 40,
        totalTasks: 15,
        completedTasks: 6,
        teamMembers: ["Diana", "Eve", "Frank"],
        deadline: "2025-01-30",
        priority: "high",
    },
    {
        id: "community-platform",
        name: "Community Platform Updates",
        description: "Improve user experience and add new features",
        status: "planning",
        progress: 20,
        totalTasks: 8,
        completedTasks: 2,
        teamMembers: ["Grace", "Henry"],
        deadline: "2025-03-01",
        priority: "medium",
    },
    {
        id: "marketing-campaign",
        name: "Social Media Marketing",
        description: "Increase online presence and engagement",
        status: "active",
        progress: 80,
        totalTasks: 10,
        completedTasks: 8,
        teamMembers: ["Ivy", "Jack", "Kate", "Liam"],
        deadline: "2025-01-20",
        priority: "low",
    },
]

const projectData = {
    "venue-outreach": {
        name: "Venue outreach campaign",
        description:
            "Reach out to local venues for partnership opportunities and establish relationships for future events",
        status: "active",
        progress: 65,
        deadline: "2025-02-15",
        priority: "high",
        teamMembers: [
            { id: 1, name: "Alice Johnson", email: "alice@packmusic.com", avatar: "AJ" },
            { id: 2, name: "Bob Smith", email: "bob@packmusic.com", avatar: "BS" },
            { id: 3, name: "Charlie Brown", email: "charlie@packmusic.com", avatar: "CB" },
        ],
        tasks: [
            {
                id: 1,
                title: "Research local venues",
                description: "Compile list of 50+ venues in the area",
                status: "completed",
                priority: "high",
                assignee: { name: "Alice Johnson", avatar: "AJ" },
                deadline: "2025-01-10",
                completedAt: "2025-01-08",
            },
            {
                id: 2,
                title: "Create outreach email template",
                description: "Draft professional email template for venue outreach",
                status: "completed",
                priority: "high",
                assignee: { name: "Bob Smith", avatar: "BS" },
                deadline: "2025-01-12",
                completedAt: "2025-01-11",
            },
            {
                id: 3,
                title: "Contact first batch of venues (1-20)",
                description: "Send initial outreach emails to venues 1-20 on the list",
                status: "in-progress",
                priority: "high",
                assignee: { name: "Charlie Brown", avatar: "CB" },
                deadline: "2025-01-20",
            },
            {
                id: 4,
                title: "Follow up with interested venues",
                description: "Schedule calls with venues that responded positively",
                status: "pending",
                priority: "medium",
                assignee: null,
                deadline: "2025-01-25",
            },
            {
                id: 5,
                title: "Create venue partnership agreements",
                description: "Draft legal agreements for venue partnerships",
                status: "pending",
                priority: "medium",
                assignee: null,
                deadline: "2025-02-01",
            },
        ],
    },
}

export const projectRouter = createTRPCRouter({
  getResources: publicProcedure.query(() => {
    return resources;
  }),
  getProjects: publicProcedure.query(() => {
    return projects;
  }),
  getProjectById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return projectData[input.id as keyof typeof projectData];
    }),
});
