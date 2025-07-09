import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { spotlights, likes, comments } from "~/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export const spotlightRouter = createTRPCRouter({
  getCurrent: publicProcedure.query(async () => {
    const currentSpotlight = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.isCurrent, true))
      .limit(1);

    if (currentSpotlight.length === 0) {
      return null;
    }

    const spotlight = currentSpotlight[0]!;

    // Access JSON fields directly
    const links = spotlight.links;
    const stats = spotlight.stats;

    // Get likes count
    const likesResult = await db
      .select({ count: count() })
      .from(likes)
      .where(
        and(
          eq(likes.targetId, spotlight.id),
          eq(likes.targetType, "spotlight"),
        ),
      );

    // Get comments count
    const commentsResult = await db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.targetId, spotlight.id),
          eq(comments.targetType, "spotlight"),
        ),
      );

    return {
      id: spotlight.id,
      type: spotlight.type,
      name: spotlight.name,
      title: spotlight.title,
      description: spotlight.description,
      image: spotlight.image,
      location: spotlight.location,
      genre: spotlight.genre,
      established: spotlight.established,
      links,
      stats,
      featuredSince: spotlight.featuredSince,
      likes: likesResult[0]?.count || 0,
      comments: commentsResult[0]?.count || 0,
      userHasLiked: false, // This will be checked separately by the frontend
    };
  }),

  getPrevious: publicProcedure.query(async () => {
    const previousSpotlights = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.isCurrent, false))
      .orderBy(desc(spotlights.updatedAt))
      .limit(10);

    return previousSpotlights.map((spotlight) => ({
      id: spotlight.id,
      type: spotlight.type,
      name: spotlight.name,
      title: spotlight.title,
      image: spotlight.image,
      description: spotlight.description,
      featuredDate: spotlight.updatedAt || spotlight.featuredSince,
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const spotlight = await db
        .select()
        .from(spotlights)
        .where(eq(spotlights.id, input.id))
        .limit(1);

      if (spotlight.length === 0) {
        return null;
      }

      const spotlightData = spotlight[0]!;

      // Access JSON fields directly
      const links = spotlightData.links;
      const stats = spotlightData.stats;

      // Get likes count
      const likesResult = await db
        .select({ count: count() })
        .from(likes)
        .where(
          and(
            eq(likes.targetId, spotlightData.id),
            eq(likes.targetType, "spotlight"),
          ),
        );

      // Get comments count
      const commentsResult = await db
        .select({ count: count() })
        .from(comments)
        .where(
          and(
            eq(comments.targetId, spotlightData.id),
            eq(comments.targetType, "spotlight"),
          ),
        );

      return {
        id: spotlightData.id,
        type: spotlightData.type,
        name: spotlightData.name,
        title: spotlightData.title,
        description: spotlightData.description,
        image: spotlightData.image,
        location: spotlightData.location,
        genre: spotlightData.genre,
        established: spotlightData.established,
        links,
        stats,
        featuredSince: spotlightData.featuredSince,
        updatedAt: spotlightData.updatedAt,
        isCurrent: spotlightData.isCurrent,
        likes: likesResult[0]?.count || 0,
        comments: commentsResult[0]?.count || 0,
        userHasLiked: false, // This will be checked separately by the frontend
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        type: z.enum(["musician", "venue"]),
        name: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        image: z.string().optional(),
        location: z.string().optional(),
        genre: z.string().optional(),
        established: z.string().optional(),
        links: z
          .array(
            z.object({
              type: z.string(),
              url: z.string(),
              label: z.string(),
            }),
          )
          .optional(),
        stats: z
          .object({
            monthlyListeners: z.string().optional(),
            followers: z.string().optional(),
            upcomingShows: z.string().optional(),
          })
          .optional(),
        createdById: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Debug logging
      console.log("🔍 Spotlight create input:", input);
      console.log(
        "🔍 Location value:",
        input.location,
        "Type:",
        typeof input.location,
      );
      console.log("🔍 Genre value:", input.genre, "Type:", typeof input.genre);
      console.log(
        "🔍 Established value:",
        input.established,
        "Type:",
        typeof input.established,
      );

      // Get the current spotlight before creating a new one
      const currentSpotlight = await db
        .select()
        .from(spotlights)
        .where(eq(spotlights.isCurrent, true))
        .limit(1);

      // If there's a current spotlight, move it to previous spotlights
      if (currentSpotlight.length > 0) {
        await db
          .update(spotlights)
          .set({
            isCurrent: false,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(spotlights.isCurrent, true));
      }

      const spotlightValues: any = {
        type: input.type,
        name: input.name,
        title: input.title,
        description: input.description,
        image:
          input.image && input.image.trim() !== ""
            ? input.image
            : "/placeholder.svg?height=300&width=300",
        location:
          input.location && input.location.trim() !== ""
            ? input.location
            : null,
        genre: input.genre && input.genre.trim() !== "" ? input.genre : null,
        established:
          input.established && input.established.trim() !== ""
            ? input.established
            : null,
        links: input.links || null,
        stats: input.stats || null,
        isCurrent: true,
        createdById: input.createdById || null,
      };

      console.log("🔍 Final spotlightValues:", spotlightValues);

      try {
        const newSpotlight = await db
          .insert(spotlights)
          .values(spotlightValues)
          .returning();

        return newSpotlight[0];
      } catch (error) {
        console.error("🔍 Database error:", error);
        throw error;
      }
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        type: z.enum(["musician", "venue"]).optional(),
        name: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        image: z.string().optional(),
        location: z.string().optional(),
        genre: z.string().optional(),
        established: z.string().optional(),
        links: z
          .array(
            z.object({
              type: z.string(),
              url: z.string(),
              label: z.string(),
            }),
          )
          .optional(),
        stats: z
          .object({
            monthlyListeners: z.string().optional(),
            followers: z.string().optional(),
            upcomingShows: z.string().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const updateValues: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Handle JSON fields
      if (updateData.links) {
        updateValues.links = updateData.links;
      }
      if (updateData.stats) {
        updateValues.stats = updateData.stats;
      }

      const updatedSpotlight = await db
        .update(spotlights)
        .set(updateValues)
        .where(eq(spotlights.id, id))
        .returning();

      return updatedSpotlight[0];
    }),
});
