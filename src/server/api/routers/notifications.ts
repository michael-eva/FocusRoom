import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/db";
import {
  notifications,
  projects,
  tasks,
  events,
  polls,
  spotlights,
  uatQueries,
} from "~/db/schema";
import { Resend } from "resend";
import { env } from "~/env";
import { client } from "~/lib/clerk";
import { desc, gte, sql } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";

const resend = new Resend(env.RESEND_API_KEY);

export const notificationsRouter = createTRPCRouter({
  sendWeeklyDigest: protectedProcedure
    .input(
      z.object({
        adminOnly: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is admin
      const currentUser = await client.users.getUser(ctx.userId);
      if (currentUser.publicMetadata.role !== "admin") {
        throw new Error("Only admins can send notifications");
      }

      // Get the last notification sent
      const lastNotification = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.sentAt))
        .limit(1);

      const cutoffDate = lastNotification[0]?.sentAt
        ? new Date(lastNotification[0].sentAt)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      // Gather activity data since last notification
      const cutoffIsoString = cutoffDate.toISOString();

      const [recentEvents, recentPolls, recentSpotlights, recentUATQueries] =
        await Promise.all([
          db
            .select()
            .from(events)
            .where(gte(events.createdAt, cutoffIsoString)),
          db.select().from(polls).where(gte(polls.createdAt, cutoffIsoString)),
          db
            .select()
            .from(spotlights)
            .where(gte(spotlights.createdAt, cutoffIsoString)),
          db
            .select()
            .from(uatQueries)
            .where(gte(uatQueries.createdAt, cutoffIsoString)),
        ]);

      // Get all projects and tasks (since they don't have creation timestamps)
      const [allProjects, allTasks] = await Promise.all([
        db.select().from(projects).limit(10),
        db.select().from(tasks).limit(10),
      ]);

      // Get all users to send notifications to
      const users = await client.users.getUserList({ limit: 500 });
      const emailList = users.data
        .filter((user) => user.emailAddresses?.[0]?.emailAddress)
        .map((user) => user.emailAddresses[0]!.emailAddress);

      if (emailList.length === 0) {
        throw new Error("No users with email addresses found");
      }

      // Create email content
      const hasActivity =
        recentEvents.length > 0 ||
        recentPolls.length > 0 ||
        recentSpotlights.length > 0 ||
        recentUATQueries.length > 0 ||
        allProjects.length > 0 ||
        allTasks.length > 0;

      const emailContent = createEmailContent({
        projects: allProjects,
        tasks: allTasks,
        events: recentEvents,
        polls: recentPolls,
        spotlights: recentSpotlights,
        uatQueries: recentUATQueries,
        cutoffDate,
        hasActivity,
      });

      let emailsSent = 0;
      let emailsFailed = 0;

      // Send emails
      if (env.RESEND_API_KEY && !input.adminOnly) {
        try {
          console.log("Sending emails to", emailList);
          console.log("Email content:", emailContent);

          await resend.emails.send({
            from: "FocusRoom <michael@notifications.extensa.studio>",
            to: "michael@extensa.studio",
            // to: emailList,
            subject: `FocusRoom Weekly Update - ${hasActivity ? "New Activity" : "Staying Connected"}`,
            html: emailContent,
          });
          emailsSent = emailList.length;
        } catch (error) {
          console.error("Failed to send notification emails:", error);
          emailsFailed = emailList.length;
        }
      }

      // Record the notification in database
      const contentSummary = `${allProjects.length} projects, ${allTasks.length} tasks, ${recentEvents.length} events, ${recentPolls.length} polls, ${recentSpotlights.length} spotlights, ${recentUATQueries.length} UAT queries`;

      const newNotification = await db
        .insert(notifications)
        .values({
          sentByClerkUserId: ctx.userId,
          recipientCount: emailList.length,
          contentSummary,
          emailsSent,
          emailsFailed,
        })
        .returning();

      return {
        success: true,
        notificationId: newNotification[0]?.id,
        recipientCount: emailList.length,
        emailsSent,
        emailsFailed,
        contentSummary,
      };
    }),

  getLastNotification: protectedProcedure.query(async () => {
    const lastNotification = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.sentAt))
      .limit(1);

    return lastNotification[0] || null;
  }),

  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const notificationHistory = await db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.sentAt))
        .limit(input.limit)
        .offset(input.offset);

      return notificationHistory;
    }),
});

function createEmailContent({
  projects,
  tasks,
  events,
  polls,
  spotlights,
  uatQueries,
  cutoffDate,
  hasActivity,
}: {
  projects: any[];
  tasks: any[];
  events: any[];
  polls: any[];
  spotlights: any[];
  uatQueries: any[];
  cutoffDate: Date;
  hasActivity: boolean;
}) {
  const timePeriod = formatDistanceToNow(cutoffDate, { addSuffix: false });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">FocusRoom Weekly Update</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
          Activity from the past ${timePeriod}
        </p>
      </div>

      <!-- Content -->
      <div style="padding: 30px 20px;">
        ${
          hasActivity
            ? `
          <!-- Activity Sections -->
          ${
            projects.length > 0
              ? createSectionHTML(
                  "🚀 New Projects",
                  projects.map(
                    (p) =>
                      `<strong>${p.name}</strong> - ${p.description || "No description"}`,
                  ),
                )
              : ""
          }
          
          ${
            tasks.length > 0
              ? createSectionHTML(
                  "✅ New Tasks",
                  tasks.map(
                    (t) =>
                      `<strong>${t.title}</strong> - ${t.description || "No description"} (Priority: ${t.priority || "Normal"})`,
                  ),
                )
              : ""
          }
          
          ${
            events.length > 0
              ? createSectionHTML(
                  "📅 New Events",
                  events.map(
                    (e) =>
                      `<strong>${e.title}</strong> - ${e.description || "No description"} ${e.eventDate ? `on ${new Date(e.eventDate).toLocaleDateString()}` : ""}`,
                  ),
                )
              : ""
          }
          
          ${
            polls.length > 0
              ? createSectionHTML(
                  "📊 New Polls",
                  polls.map(
                    (p) =>
                      `<strong>${p.question}</strong> ${p.endsAt ? `(Ends ${new Date(p.endsAt).toLocaleDateString()})` : ""}`,
                  ),
                )
              : ""
          }
          
          ${
            spotlights.length > 0
              ? createSectionHTML(
                  "⭐ New Spotlights",
                  spotlights.map(
                    (s) =>
                      `<strong>${s.name}</strong> - ${s.title} (${s.type})`,
                  ),
                )
              : ""
          }
        `
            : `
          <!-- No Activity Message -->
          <div style="text-align: center; padding: 40px 20px; background-color: #f8fafc; border-radius: 12px; margin: 20px 0;">
            <h2 style="color: #475569; margin: 0 0 15px 0; font-size: 24px;">Staying Connected</h2>
            <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.6;">
              No new activity in the past ${timePeriod}, but we wanted to check in and keep you connected with the FocusRoom community.
            </p>
            <p style="color: #64748b; margin: 15px 0 0 0; font-size: 16px;">
              Ready to collaborate? Jump back in and start something new!
            </p>
          </div>
        `
        }

        <!-- Call to Action -->
        <div style="text-align: center; margin: 40px 0 30px 0;">
          <a href="${env.NEXT_PUBLIC_FRONTEND_URL}/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                    color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            Visit FocusRoom Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            You're receiving this because you're a member of The Pack Music.<br>
            These weekly updates are sent automatically to keep everyone connected.
          </p>
        </div>
      </div>
    </div>
  `;
}

function createSectionHTML(title: string, items: string[]) {
  return `
    <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #f97316;">
      <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">${title}</h3>
      <ul style="margin: 0; padding-left: 20px; color: #475569;">
        ${items.map((item) => `<li style="margin: 8px 0; line-height: 1.5;">${item}</li>`).join("")}
      </ul>
    </div>
  `;
}
