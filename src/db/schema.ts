import {
  pgTable,
  foreignKey,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";

export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
]);
export const userRole = pgEnum("user_role", ["admin", "member"]);
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey().notNull(),
    name: text(),
    email: text(),
    role: userRole("role").default("member"),
    invitedAt: timestamp("invited_at", { mode: "string" }),
    invitedBy: integer("invited_by"),
    invitationStatus: invitationStatus("invitation_status").default("pending"),
    acceptedAt: timestamp("accepted_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [table.id],
      name: "users_invited_by_users_id_fk",
    }),
  ],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: serial().primaryKey().notNull(),
    userId: integer("user_id"),
    activityType: text("activity_type").notNull(),
    targetId: integer("target_id"),
    targetType: text("target_type"),
    description: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "activity_log_user_id_users_id_fk",
    }),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: serial().primaryKey().notNull(),
    userId: integer("user_id"),
    targetId: integer("target_id").notNull(),
    targetType: text("target_type").notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "comments_user_id_users_id_fk",
    }),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    location: text(),
    startDateTime: timestamp("start_date_time", { mode: "string" }).notNull(),
    endDateTime: timestamp("end_date_time", { mode: "string" }).notNull(),
    allDay: boolean("all_day").default(false),
    rsvpLink: text("rsvp_link"),
    createdById: integer("created_by_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    googleEventId: text("google_event_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "events_created_by_id_users_id_fk",
    }),
  ],
);

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: serial().primaryKey().notNull(),
    eventId: integer("event_id"),
    userId: integer("user_id"),
    status: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [events.id],
      name: "event_rsvps_event_id_events_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "event_rsvps_user_id_users_id_fk",
    }),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: serial().primaryKey().notNull(),
    userId: integer("user_id"),
    targetId: integer("target_id").notNull(),
    targetType: text("target_type").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "likes_user_id_users_id_fk",
    }),
  ],
);

export const polls = pgTable(
  "polls",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    content: text(),
    createdById: integer("created_by_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "polls_created_by_id_users_id_fk",
    }),
  ],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: serial().primaryKey().notNull(),
    pollId: integer("poll_id"),
    text: text().notNull(),
    votes: integer().default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.pollId],
      foreignColumns: [polls.id],
      name: "poll_options_poll_id_polls_id_fk",
    }),
  ],
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: serial().primaryKey().notNull(),
    pollId: integer("poll_id"),
    optionId: integer("option_id"),
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.pollId],
      foreignColumns: [polls.id],
      name: "poll_votes_poll_id_polls_id_fk",
    }),
    foreignKey({
      columns: [table.optionId],
      foreignColumns: [pollOptions.id],
      name: "poll_votes_option_id_poll_options_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "poll_votes_user_id_users_id_fk",
    }),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: serial().primaryKey().notNull(),
    name: text(),
    createdById: integer("created_by_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "posts_created_by_id_users_id_fk",
    }),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: serial().primaryKey().notNull(),
    name: text(),
    description: text(),
    status: text(),
    progress: integer(),
    totalTasks: integer(),
    completedTasks: integer(),
    deadline: timestamp({ mode: "string" }),
    priority: text(),
    createdBy: integer("created_by"),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "projects_created_by_users_id_fk",
    }),
  ],
);

export const projectActivities = pgTable(
  "project_activities",
  {
    id: serial().primaryKey().notNull(),
    projectId: integer("project_id"),
    type: text().notNull(),
    description: text().notNull(),
    taskId: integer("task_id"),
    resourceId: integer("resource_id"),
    userId: integer("user_id"),
    timestamp: timestamp({ mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_activities_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "project_activities_task_id_tasks_id_fk",
    }),
    foreignKey({
      columns: [table.resourceId],
      foreignColumns: [resources.id],
      name: "project_activities_resource_id_resources_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "project_activities_user_id_users_id_fk",
    }),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial().primaryKey().notNull(),
    title: text(),
    description: text(),
    status: text(),
    priority: text(),
    deadline: timestamp({ mode: "string" }),
    completedAt: timestamp("completed_at", { mode: "string" }),
    projectId: integer("project_id"),
    assigneeId: integer("assignee_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "tasks_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [teamMembers.id],
      name: "tasks_assignee_id_team_members_id_fk",
    }),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: serial().primaryKey().notNull(),
    title: text(),
    type: text(),
    url: text(),
    description: text(),
    lastUpdated: timestamp("last_updated", { mode: "string" }),
    projectId: integer("project_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "resources_project_id_projects_id_fk",
    }),
  ],
);

export const projectTeamMembers = pgTable(
  "project_team_members",
  {
    projectId: integer("project_id"),
    teamMemberId: text("team_member_id"),
    role: text().default("member"),
    joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow(),
    invitedBy: integer("invited_by"),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_team_members_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.teamMemberId],
      foreignColumns: [teamMembers.id],
      name: "project_team_members_team_member_id_team_members_id_fk",
    }),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [teamMembers.id],
      name: "project_team_members_invited_by_team_members_id_fk",
    }),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial().primaryKey().notNull(),
    name: text(),
    email: text(),
    avatar: text(),
    userId: integer("user_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "team_members_user_id_users_id_fk",
    }),
  ],
);

export const spotlights = pgTable(
  "spotlights",
  {
    id: serial().primaryKey().notNull(),
    type: text().notNull(),
    name: text().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    image: text(),
    location: text(),
    genre: text(),
    established: text(),
    links: json(),
    stats: json(),
    featuredSince: timestamp("featured_since", { mode: "string" }).defaultNow(),
    isCurrent: boolean("is_current").default(false),
    createdById: integer("created_by_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "spotlights_created_by_id_users_id_fk",
    }),
  ],
);
