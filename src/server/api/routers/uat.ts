import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import { uatQueries } from "~/db/schema";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY);

export const uatRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        query: z.string().min(1, "Query is required"),
        clerkUserId: z.string().optional(),
        userName: z.string().optional(),
        userEmail: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Insert the UAT query into the database
        const newQuery = await db
          .insert(uatQueries)
          .values({
            query: input.query,
            clerkUserId: input.clerkUserId,
            userName: input.userName,
            userEmail: input.userEmail,
            status: "pending",
          })
          .returning();

        // Send email notification to michael@extensa.studio
        if (env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: "Extensa Studio <michael@notifications.extensa.studio>",
              to: "michael@extensa.studio",
              subject: "New UAT Query Submitted - Focus Room",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">New UAT Query Submitted</h2>
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #555;">Query Details:</h3>
                    <p style="line-height: 1.6; color: #333;">${input.query.replace(/\n/g, "<br>")}</p>
                  </div>
                  
                  <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #2c5aa0;">User Information:</h4>
                    <p style="margin: 5px 0;"><strong>User ID:</strong> ${input.clerkUserId || "Not provided"}</p>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${input.userName || "Not provided"}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${input.userEmail || "Not provided"}</p>
                    <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px;">
                      This query has been automatically logged in the database with ID: ${newQuery[0]?.id}
                    </p>
                  </div>
                </div>
              `,
            });
          } catch (emailError) {
            console.error("Failed to send email notification:", emailError);
            // Don't fail the whole operation if email fails
          }
        } else {
          console.warn(
            "RESEND_API_KEY not configured - skipping email notification",
          );
        }

        return newQuery[0];
      } catch (error) {
        console.error("Failed to submit UAT query:", error);
        throw new Error("Failed to submit UAT query. Please try again.");
      }
    }),

  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["pending", "reviewed", "resolved"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const queries = await db
        .select()
        .from(uatQueries)
        .orderBy(uatQueries.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return queries;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "reviewed", "resolved"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const updatedQuery = await db
        .update(uatQueries)
        .set({
          status: input.status,
          notes: input.notes,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(uatQueries.id, input.id))
        .returning();

      return updatedQuery[0];
    }),
});
