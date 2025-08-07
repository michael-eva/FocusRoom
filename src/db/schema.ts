import {
  pgTable,
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
  "declined",
]);
export const userRole = pgEnum("user_role", ["admin", "member", "moderator"]);

export const drizzleMigrations = pgTable("__drizzle_migrations", {
  id: serial().primaryKey().notNull(),
  hash: text().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial().primaryKey().notNull(),
  content: text().notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  isEdited: boolean("is_edited").default(false),
  replyToId: integer("reply_to_id"), // For threading/replies
});

export const spotlights = pgTable("spotlights", {
  id: serial().primaryKey().notNull(),
  type: text().notNull(),
  name: text().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  image: text(),
  location: text(),
  genre: text(),
  established: text(),
  links: text(),
  stats: text(),
  featuredSince: timestamp("featured_since", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  createdByClerkUserId: text("created_by_clerk_user_id"),
});

export const likes = pgTable("likes", {
  id: serial().primaryKey().notNull(),
  clerkUserId: text("clerk_user_id"),
  postId: integer("post_id"),
  pollId: integer("poll_id"),
  spotlightId: integer("spotlight_id"),
  timestamp: timestamp({ mode: "string", withTimezone: true }).defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial().primaryKey().notNull(),
  eventId: integer("event_id"),
  status: text(),
  clerkUserId: text("clerk_user_id"),
  rsvpDate: timestamp("rsvp_date", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  notes: text(),
});

export const pollOptions = pgTable("poll_options", {
  id: serial().primaryKey().notNull(),
  pollId: integer("poll_id"),
  votes: integer().default(0),
  optionText: text("option_text"),
});

export const activityLog = pgTable("activity_log", {
  id: serial().primaryKey().notNull(),
  clerkUserId: text("clerk_user_id"),
  action: text(),
  details: text(),
  timestamp: timestamp({ mode: "string", withTimezone: true }).defaultNow(),
  metadata: json(),
});

export const resources = pgTable("resources", {
  id: serial().primaryKey().notNull(),
  title: text(),
  type: text(),
  url: text(),
  description: text(),
  lastUpdated: timestamp("last_updated", {
    mode: "string",
    withTimezone: true,
  }),
  projectId: integer("project_id"),
});

export const tasks = pgTable("tasks", {
  id: serial().primaryKey().notNull(),
  title: text(),
  description: text(),
  status: text(),
  priority: text(),
  deadline: timestamp({ mode: "string", withTimezone: true }),
  completedAt: timestamp("completed_at", {
    mode: "string",
    withTimezone: true,
  }),
  projectId: integer("project_id"),
  assigneeClerkUserId: text("assignee_clerk_user_id"), // Will store JSON array for multiple assignees
});

export const pollVotes = pgTable("poll_votes", {
  id: serial().primaryKey().notNull(),
  pollId: integer("poll_id"),
  optionId: integer("option_id"),
  clerkUserId: text("clerk_user_id"),
  votedAt: timestamp("voted_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
});

export const events = pgTable("events", {
  id: serial().primaryKey().notNull(),
  title: text(),
  description: text(),
  location: text(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  eventDate: timestamp("event_date", { mode: "string", withTimezone: true }),
  endDate: timestamp("end_date", { mode: "string", withTimezone: true }),
  maxAttendees: integer("max_attendees"),
  isVirtual: boolean("is_virtual").default(false),
  virtualLink: text("virtual_link"),
  eventType: text("event_type"),
  createdByClerkUserId: text("created_by_clerk_user_id"),
  timezone: text("timezone"),
});

export const comments = pgTable("comments", {
  id: serial().primaryKey().notNull(),
  content: text(),
  clerkUserId: text("clerk_user_id"),
  timestamp: timestamp({ mode: "string", withTimezone: true }).defaultNow(),
  postId: integer("post_id"),
  eventId: integer("event_id"),
  pollId: integer("poll_id"),
  spotlightId: integer("spotlight_id"),
});

export const polls = pgTable("polls", {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  question: text(),
  createdByClerkUserId: text("created_by_clerk_user_id"),
  endsAt: timestamp("ends_at", { mode: "string", withTimezone: true }),
  isActive: boolean("is_active").default(true),
});

export const posts = pgTable("posts", {
  id: serial().primaryKey().notNull(),
  name: text(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  createdByClerkUserId: text("created_by_clerk_user_id"),
});

export const projectActivities = pgTable("project_activities", {
  id: serial().primaryKey().notNull(),
  projectId: integer("project_id"),
  type: text().notNull(),
  description: text().notNull(),
  taskId: integer("task_id"),
  resourceId: integer("resource_id"),
  timestamp: timestamp({ mode: "string", withTimezone: true }).defaultNow(),
  clerkUserId: text("clerk_user_id"),
});

export const projectTeamMembers = pgTable("project_team_members", {
  projectId: integer("project_id"),
  role: text().default("member"),
  joinedAt: timestamp("joined_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  clerkUserId: text("clerk_user_id"),
  invitedByClerkUserId: text("invited_by_clerk_user_id"),
});

export const projects = pgTable("projects", {
  id: serial().primaryKey().notNull(),
  name: text(),
  description: text(),
  status: text(),
  progress: integer(),
  totalTasks: integer(),
  completedTasks: integer(),
  deadline: timestamp({ mode: "string", withTimezone: true }),
  priority: text(),
  createdBy: text("created_by"),
});

export const uatQueries = pgTable("uat_queries", {
  id: serial().primaryKey().notNull(),
  query: text().notNull(),
  clerkUserId: text("clerk_user_id"),
  userName: text("user_name"),
  userEmail: text("user_email"),
  status: text().default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  }).defaultNow(),
  notes: text(), // For admin notes
});
