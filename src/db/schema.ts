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
  userId: integer("user_id").references(() => users.id),
});

export const projectTeamMembers = sqliteTable("project_team_members", {
  projectId: integer("project_id").references(() => projects.id),
  teamMemberId: integer("team_member_id").references(() => teamMembers.id),
  role: text("role").default("member"), // "admin", "member", "moderator"
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  invitedBy: integer("invited_by").references(() => teamMembers.id),
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
  role: text("role").default("member"), // "admin", "member", "moderator"
  invitedAt: integer("invited_at", { mode: "timestamp" }),
  invitedBy: integer("invited_by").references(() => users.id),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
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

export const polls = sqliteTable("polls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const pollOptions = sqliteTable("poll_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pollId: integer("poll_id").references(() => polls.id),
  text: text("text").notNull(),
  votes: integer("votes").default(0),
});

export const pollVotes = sqliteTable("poll_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pollId: integer("poll_id").references(() => polls.id),
  optionId: integer("option_id").references(() => pollOptions.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const eventRSVPs = sqliteTable("event_rsvps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").references(() => events.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull(), // "attending", "maybe", "declined"
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(), // "poll_created", "poll_voted", "event_created", "event_rsvp"
  targetId: integer("target_id"), // ID of the poll, event, etc.
  targetType: text("target_type"), // "poll", "event"
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const projectActivities = sqliteTable("project_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id),
  type: text("type").notNull(), // "task_created", "task_completed", "task_assigned", "task_status_changed", "resource_added", "project_updated"
  description: text("description").notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  resourceId: integer("resource_id").references(() => resources.id),
  userId: integer("user_id").references(() => users.id),
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  targetId: integer("target_id").notNull(), // ID of the post, event, poll, etc.
  targetType: text("target_type").notNull(), // "event", "poll", "spotlight"
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  targetId: integer("target_id").notNull(), // ID of the post, event, poll, etc.
  targetType: text("target_type").notNull(), // "event", "poll", "spotlight"
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  teamMembers: many(projectTeamMembers),
  tasks: many(tasks),
  resources: many(resources),
  activities: many(projectActivities),
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

export const projectActivitiesRelations = relations(
  projectActivities,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectActivities.projectId],
      references: [projects.id],
    }),
    task: one(tasks, {
      fields: [projectActivities.taskId],
      references: [tasks.id],
    }),
    resource: one(resources, {
      fields: [projectActivities.resourceId],
      references: [resources.id],
    }),
    user: one(users, {
      fields: [projectActivities.userId],
      references: [users.id],
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
  polls: many(polls),
  pollVotes: many(pollVotes),
  eventRSVPs: many(eventRSVPs),
  activities: many(activityLog),
  likes: many(likes),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.createdById],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  author: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  rsvps: many(eventRSVPs),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  author: one(users, {
    fields: [polls.createdById],
    references: [users.id],
  }),
  options: many(pollOptions),
  votes: many(pollVotes),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  option: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}));

export const eventRSVPsRelations = relations(eventRSVPs, ({ one }) => ({
  event: one(events, {
    fields: [eventRSVPs.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRSVPs.userId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
