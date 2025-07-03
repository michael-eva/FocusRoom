import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  description: text("description"),
  status: text("status"),
  progress: integer("progress"),
  totalTasks: integer("totalTasks"),
  completedTasks: integer("completedTasks"),
  deadline: integer("deadline", { mode: "timestamp" }),
  priority: text("priority"),
});

export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
});

export const projectTeamMembers = sqliteTable("project_team_members", {
  projectId: integer("project_id").references(() => projects.id),
  teamMemberId: integer("team_member_id").references(() => teamMembers.id),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  description: text("description"),
  status: text("status"),
  priority: text("priority"),
  deadline: integer("deadline", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  projectId: integer("project_id").references(() => projects.id),
  assigneeId: integer("assignee_id").references(() => teamMembers.id),
});

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  type: text("type"),
  url: text("url"),
  description: text("description"),
  lastUpdated: integer("last_updated", { mode: "timestamp" }),
  projectId: integer("project_id").references(() => projects.id),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email"),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDateTime: integer("start_date_time", { mode: "timestamp" }).notNull(),
  endDateTime: integer("end_date_time", { mode: "timestamp" }).notNull(),
  allDay: integer("all_day", { mode: "boolean" }).default(false),
  rsvpLink: text("rsvp_link"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  googleEventId: text("google_event_id"), // For syncing with Google Calendar
});

export const projectsRelations = relations(projects, ({ many }) => ({
  teamMembers: many(projectTeamMembers),
  tasks: many(tasks),
  resources: many(resources),
}));

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  projects: many(projectTeamMembers),
  tasks: many(tasks),
}));

export const projectTeamMembersRelations = relations(
  projectTeamMembers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectTeamMembers.projectId],
      references: [projects.id],
    }),
    teamMember: one(teamMembers, {
      fields: [projectTeamMembers.teamMemberId],
      references: [teamMembers.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(teamMembers, {
    fields: [tasks.assigneeId],
    references: [teamMembers.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  project: one(projects, {
    fields: [resources.projectId],
    references: [projects.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  events: many(events),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.createdById],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  author: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
}));
