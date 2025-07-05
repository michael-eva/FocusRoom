import { postRouter } from "~/server/api/routers/post";
import { projectRouter } from "~/server/api/routers/project";
import { spotlightRouter } from "~/server/api/routers/spotlight";
import { googleCalendarRouter } from "~/server/api/routers/googleCalendar";
import { eventsRouter } from "~/server/api/routers/events";
import { pollsRouter } from "~/server/api/routers/polls";
import { feedRouter } from "~/server/api/routers/feed";
import { rsvpRouter } from "~/server/api/routers/rsvp";
import { activityRouter } from "~/server/api/routers/activity";
import { likesRouter } from "~/server/api/routers/likes";
import { commentsRouter } from "~/server/api/routers/comments";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  project: projectRouter,
  spotlight: spotlightRouter,
  googleCalendar: googleCalendarRouter,
  events: eventsRouter,
  polls: pollsRouter,
  feed: feedRouter,
  rsvp: rsvpRouter,
  activity: activityRouter,
  likes: likesRouter,
  comments: commentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
