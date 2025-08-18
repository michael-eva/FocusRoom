import { NextRequest } from "next/server";
import { db } from "~/db";
import { notifications, projects, tasks, events, polls, spotlights, uatQueries } from "~/db/schema";
import { Resend } from "resend";
import { env } from "~/env";
import { client } from "~/lib/clerk";
import { desc, gte } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";

const resend = new Resend(env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (security check)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check when the last notification was sent
    const lastNotification = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.sentAt))
      .limit(1);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // If a notification was sent less than 7 days ago, skip
    if (lastNotification[0]?.sentAt) {
      const lastSentDate = new Date(lastNotification[0].sentAt);
      if (lastSentDate > sevenDaysAgo) {
        return Response.json({ 
          message: "Notification already sent within the last 7 days",
          lastSent: lastNotification[0].sentAt 
        });
      }
    }

    // Get the cutoff date for activity
    const cutoffDate = lastNotification[0]?.sentAt 
      ? new Date(lastNotification[0].sentAt) 
      : sevenDaysAgo;

    const cutoffIsoString = cutoffDate.toISOString();
    
    // Gather recent activity
    const [recentEvents, recentPolls, recentSpotlights, recentUATQueries] = await Promise.all([
      db.select().from(events).where(gte(events.createdAt, cutoffIsoString)),
      db.select().from(polls).where(gte(polls.createdAt, cutoffIsoString)),
      db.select().from(spotlights).where(gte(spotlights.createdAt, cutoffIsoString)),
      db.select().from(uatQueries).where(gte(uatQueries.createdAt, cutoffIsoString))
    ]);

    // Get all projects and tasks (since they don't have creation timestamps)
    const [allProjects, allTasks] = await Promise.all([
      db.select().from(projects).limit(10),
      db.select().from(tasks).limit(10)
    ]);

    // Get all users with email addresses
    const users = await client.users.getUserList({ limit: 500 });
    const emailList = users.data
      .filter(user => user.emailAddresses?.[0]?.emailAddress)
      .map(user => user.emailAddresses[0]!.emailAddress);

    if (emailList.length === 0) {
      return Response.json({ error: "No users with email addresses found" });
    }

    // Determine if there's activity to report
    const hasActivity = recentEvents.length > 0 || recentPolls.length > 0 || 
                       recentSpotlights.length > 0 || recentUATQueries.length > 0 ||
                       allProjects.length > 0 || allTasks.length > 0;

    // Create email content
    const emailContent = createEmailContent({
      projects: allProjects,
      tasks: allTasks, 
      events: recentEvents,
      polls: recentPolls,
      spotlights: recentSpotlights,
      uatQueries: recentUATQueries,
      cutoffDate,
      hasActivity
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send emails using Resend
    if (env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "FocusRoom <notifications@extensa.studio>",
          to: emailList,
          subject: `FocusRoom Weekly Update - ${hasActivity ? 'New Activity' : 'Staying Connected'}`,
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
        sentByClerkUserId: "system", // Mark as system-generated
        recipientCount: emailList.length,
        contentSummary,
        emailsSent,
        emailsFailed,
      })
      .returning();

    return Response.json({
      success: true,
      notificationId: newNotification[0]?.id,
      recipientCount: emailList.length,
      emailsSent,
      emailsFailed,
      contentSummary,
      triggeredBy: "cron",
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function createEmailContent({
  projects,
  tasks,
  events,
  polls,
  spotlights,
  uatQueries,
  cutoffDate,
  hasActivity
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
        ${hasActivity ? `
          <!-- Activity Sections -->
          ${projects.length > 0 ? createSectionHTML("🚀 Active Projects", projects.map(p => `<strong>${p.name || 'Untitled Project'}</strong> - ${p.description || 'No description'}`)) : ''}
          
          ${tasks.length > 0 ? createSectionHTML("✅ Current Tasks", tasks.map(t => `<strong>${t.title || 'Untitled Task'}</strong> - ${t.description || 'No description'} (Priority: ${t.priority || 'Normal'})`)) : ''}
          
          ${events.length > 0 ? createSectionHTML("📅 New Events", events.map(e => `<strong>${e.title || 'Untitled Event'}</strong> - ${e.description || 'No description'} ${e.eventDate ? `on ${new Date(e.eventDate).toLocaleDateString()}` : ''}`)) : ''}
          
          ${polls.length > 0 ? createSectionHTML("📊 New Polls", polls.map(p => `<strong>${p.question || 'Untitled Poll'}</strong> ${p.endsAt ? `(Ends ${new Date(p.endsAt).toLocaleDateString()})` : ''}`)) : ''}
          
          ${spotlights.length > 0 ? createSectionHTML("⭐ New Spotlights", spotlights.map(s => `<strong>${s.name || 'Untitled'}</strong> - ${s.title} (${s.type})`)) : ''}
          
          ${uatQueries.length > 0 ? createSectionHTML("💬 New Feedback", uatQueries.map(u => `User feedback received (${u.status})`)) : ''}
        ` : `
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
        `}

        <!-- Call to Action -->
        <div style="text-align: center; margin: 40px 0 30px 0;">
          <a href="https://focusroom.extensa.studio/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
                    color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                    font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            Visit FocusRoom Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            You're receiving this because you're a member of FocusRoom.<br>
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
        ${items.map(item => `<li style="margin: 8px 0; line-height: 1.5;">${item}</li>`).join('')}
      </ul>
    </div>
  `;
}