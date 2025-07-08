import { relations } from "drizzle-orm";
import { 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  pgTable 
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name"),
  description: text("description"),
  status: text("status"),
  progress: integer("progress"),
  totalTasks: integer("totalTasks"),
  completedTasks: integer("completedTasks"),
  deadline: timestamp("deadline"),
  priority: text("priority"),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  userId: integer("user_id").references(() => users.id),
});

export const projectTeamMembers = pgTable("project_team_members", {
  projectId: integer("project_id").references(() => projects.id),
  teamMemberId: integer("team_member_id").references(() => teamMembers.id),
  role: text("role").default("member"), // "admin", "member", "moderator"
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedBy: integer("invited_by").references(() => teamMembers.id),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  status: text("status"),
  priority: text("priority"),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completed_at"),
  projectId: integer("project_id").references(() => projects.id),
  assigneeId: integer("assignee_id").references(() => teamMembers.id),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title"),
  type: text("type"),
  url: text("url"),
  description: text("description"),
  lastUpdated: timestamp("last_updated"),
  projectId: integer("project_id").references(() => projects.id),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("member"), // "admin", "member", "moderator"
  invitedAt: timestamp("invited_at"),
  invitedBy: integer("invited_by").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  name: text("name"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  allDay: boolean("all_day").default(false),
  rsvpLink: text("rsvp_link"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  googleEventId: text("google_event_id"), // For syncing with Google Calendar
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").references(() => polls.id),
  text: text("text").notNull(),
  votes: integer("votes").default(0),
});

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").references(() => polls.id),
  optionId: integer("option_id").references(() => pollOptions.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRSVPs = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull(), // "attending", "maybe", "declined"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  activityType: text("activity_type").notNull(), // "poll_created", "poll_voted", "event_created", "event_rsvp"
  targetId: integer("target_id"), // ID of the poll, event, etc.
  targetType: text("target_type"), // "poll", "event"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectActivities = pgTable("project_activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  type: text("type").notNull(), // "task_created", "task_completed", "task_assigned", "task_status_changed", "resource_added", "project_updated"
  description: text("description").notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  resourceId: integer("resource_id").references(() => resources.id),
  userId: integer("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  targetId: integer("target_id").notNull(), // ID of the post, event, poll, etc.
  targetType: text("target_type").notNull(), // "event", "poll", "spotlight"
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  targetId: integer("target_id").notNull(), // ID of the post, event, poll, etc.
  targetType: text("target_type").notNull(), // "event", "poll", "spotlight"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const spotlights = pgTable("spotlights", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "musician", "venue"
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  location: text("location"),
  genre: text("genre"),
  established: text("established"),
  links: text("links"), // JSON string of links array
  stats: text("stats"), // JSON string of stats object
  featuredSince: timestamp("featured_since").defaultNow(),
  isCurrent: boolean("is_current").default(false),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations remain exactly the same
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
  spotlights: many(spotlights),
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

export const spotlightsRelations = relations(spotlights, ({ one }) => ({
  author: one(users, {
    fields: [spotlights.createdById],
    references: [users.id],
  }),
}));
