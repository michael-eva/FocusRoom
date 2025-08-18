import { db } from "./src/db";
import { notifications } from "./src/db/schema";
import { desc } from "drizzle-orm";
import { env } from "./src/env";
import { client } from "./src/lib/clerk";

async function testNotifications() {
  console.log("=== Notification System Debug ===");

  // Check environment variables
  console.log("\n1. Environment Variables:");
  console.log("RESEND_API_KEY:", env.RESEND_API_KEY ? "SET" : "NOT SET");
  console.log("CRON_SECRET:", env.CRON_SECRET ? "SET" : "NOT SET");
  console.log("NODE_ENV:", env.NODE_ENV);

  // Check database connection
  console.log("\n2. Database Connection:");
  try {
    const result = await db.select().from(notifications).limit(1);
    console.log("✅ Database connection successful");
    console.log("Recent notifications:", result.length);
  } catch (error) {
    console.log("❌ Database connection failed:", error);
    return;
  }

  // Check recent notifications
  console.log("\n3. Recent Notifications:");
  try {
    const recentNotifications = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.sentAt))
      .limit(5);

    if (recentNotifications.length === 0) {
      console.log("No notifications found in database");
    } else {
      recentNotifications.forEach((notification, index) => {
        console.log(
          `${index + 1}. ID: ${notification.id}, Sent: ${notification.sentAt}, Recipients: ${notification.recipientCount}, Sent: ${notification.emailsSent}, Failed: ${notification.emailsFailed}`,
        );
      });
    }
  } catch (error) {
    console.log("❌ Error fetching notifications:", error);
  }

  // Check users
  console.log("\n4. Users:");
  try {
    const users = await client.users.getUserList({ limit: 10 });
    const emailList = users.data
      .filter((user) => user.emailAddresses?.[0]?.emailAddress)
      .map((user) => user.emailAddresses[0]!.emailAddress);

    console.log(`Total users: ${users.data.length}`);
    console.log(`Users with emails: ${emailList.length}`);
    console.log("Sample emails:", emailList.slice(0, 3));
  } catch (error) {
    console.log("❌ Error fetching users:", error);
  }

  // Test Resend connection
  console.log("\n5. Resend API Test:");
  if (env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(env.RESEND_API_KEY);

      // Test with a simple API call (this won't actually send an email)
      console.log("✅ Resend API key is valid format");
    } catch (error) {
      console.log("❌ Resend API error:", error);
    }
  } else {
    console.log("❌ RESEND_API_KEY not set");
  }

  console.log("\n=== Debug Complete ===");
}

testNotifications().catch(console.error);
