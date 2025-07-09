import { relations } from "drizzle-orm/relations";
import { users, activityLog, comments, events, eventRsvps, likes, polls, pollOptions, pollVotes, posts, projects, projectActivities, tasks, resources, teamMembers, projectTeamMembers, spotlights } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	user: one(users, {
		fields: [users.invitedBy],
		references: [users.id],
		relationName: "users_invitedBy_users_id"
	}),
	users: many(users, {
		relationName: "users_invitedBy_users_id"
	}),
	activityLogs: many(activityLog),
	comments: many(comments),
	events: many(events),
	eventRsvps: many(eventRsvps),
	likes: many(likes),
	polls: many(polls),
	pollVotes: many(pollVotes),
	posts: many(posts),
	projectActivities: many(projectActivities),
	teamMembers: many(teamMembers),
	spotlights: many(spotlights),
}));

export const activityLogRelations = relations(activityLog, ({one}) => ({
	user: one(users, {
		fields: [activityLog.userId],
		references: [users.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	user: one(users, {
		fields: [events.createdById],
		references: [users.id]
	}),
	eventRsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({one}) => ({
	event: one(events, {
		fields: [eventRsvps.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventRsvps.userId],
		references: [users.id]
	}),
}));

export const likesRelations = relations(likes, ({one}) => ({
	user: one(users, {
		fields: [likes.userId],
		references: [users.id]
	}),
}));

export const pollsRelations = relations(polls, ({one, many}) => ({
	user: one(users, {
		fields: [polls.createdById],
		references: [users.id]
	}),
	pollOptions: many(pollOptions),
	pollVotes: many(pollVotes),
}));

export const pollOptionsRelations = relations(pollOptions, ({one, many}) => ({
	poll: one(polls, {
		fields: [pollOptions.pollId],
		references: [polls.id]
	}),
	pollVotes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({one}) => ({
	poll: one(polls, {
		fields: [pollVotes.pollId],
		references: [polls.id]
	}),
	pollOption: one(pollOptions, {
		fields: [pollVotes.optionId],
		references: [pollOptions.id]
	}),
	user: one(users, {
		fields: [pollVotes.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one}) => ({
	user: one(users, {
		fields: [posts.createdById],
		references: [users.id]
	}),
}));

export const projectActivitiesRelations = relations(projectActivities, ({one}) => ({
	project: one(projects, {
		fields: [projectActivities.projectId],
		references: [projects.id]
	}),
	task: one(tasks, {
		fields: [projectActivities.taskId],
		references: [tasks.id]
	}),
	resource: one(resources, {
		fields: [projectActivities.resourceId],
		references: [resources.id]
	}),
	user: one(users, {
		fields: [projectActivities.userId],
		references: [users.id]
	}),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	projectActivities: many(projectActivities),
	tasks: many(tasks),
	resources: many(resources),
	projectTeamMembers: many(projectTeamMembers),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	projectActivities: many(projectActivities),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	teamMember: one(teamMembers, {
		fields: [tasks.assigneeId],
		references: [teamMembers.id]
	}),
}));

export const resourcesRelations = relations(resources, ({one, many}) => ({
	projectActivities: many(projectActivities),
	project: one(projects, {
		fields: [resources.projectId],
		references: [projects.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one, many}) => ({
	tasks: many(tasks),
	projectTeamMembers_teamMemberId: many(projectTeamMembers, {
		relationName: "projectTeamMembers_teamMemberId_teamMembers_id"
	}),
	projectTeamMembers_invitedBy: many(projectTeamMembers, {
		relationName: "projectTeamMembers_invitedBy_teamMembers_id"
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
}));

export const projectTeamMembersRelations = relations(projectTeamMembers, ({one}) => ({
	project: one(projects, {
		fields: [projectTeamMembers.projectId],
		references: [projects.id]
	}),
	teamMember_teamMemberId: one(teamMembers, {
		fields: [projectTeamMembers.teamMemberId],
		references: [teamMembers.id],
		relationName: "projectTeamMembers_teamMemberId_teamMembers_id"
	}),
	teamMember_invitedBy: one(teamMembers, {
		fields: [projectTeamMembers.invitedBy],
		references: [teamMembers.id],
		relationName: "projectTeamMembers_invitedBy_teamMembers_id"
	}),
}));

export const spotlightsRelations = relations(spotlights, ({one}) => ({
	user: one(users, {
		fields: [spotlights.createdById],
		references: [users.id]
	}),
}));