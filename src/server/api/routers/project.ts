import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { getProjectById, getProjects, getResources } from "~/db/query";

export const projectRouter = createTRPCRouter({
  getResources: publicProcedure.query(async () => {
    return await getResources();
  }),
  getProjects: publicProcedure.query(async () => {
    const response = await getProjects();
    return response;
  }),
  getProjectById: publicProcedure
    .input(
      z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
      }),
    )
    .query(async ({ input }) => {
      return await getProjectById(input.id);
    }),
});
