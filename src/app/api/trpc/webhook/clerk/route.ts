//db call to update the user table with the invitation status
//
// Test this webhook with the following sample data:
// {
//   "data": {
//     "created_at": 1716883200000,
//     "email_address": "jane.doe@acme.com",
//     "expires_at": 1717487999000,
//     "id": "orginv_2g7np7Hrk0SN6kj5EDMLDaKNL0S",
//     "object": "organization_invitation",
//     "organization_id": "org_2g7np7Hrk0SN6kj5EDMLDaKNL0S",
//     "private_metadata": {},
//     "public_metadata": {},
//     "role": "org:member",
//     "role_name": "Member",
//     "status": "accepted",
//     "updated_at": 1716883500000,
//     "url": "https://accounts.acme.com/accept-invitation?token=abc123"
//   },
//   "event_attributes": {
//     "http_request": {
//       "client_ip": "192.168.1.100",
//       "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
//     }
//   },
//   "instance_id": "ins_2g7np7Hrk0SN6kj5EDMLDaKNL0S",
//   "object": "event",
//   "timestamp": 1716883200,
//   "type": "organization.invitation.accepted"
// }
//
// This webhook handles the following events:
// - invitation.accepted (when a user accepts a standard invitation)
// - user.created (when a new user is created - links user to project teams)
// - user.updated (when a user profile is updated)
// - organization.invitation.accepted (when a user accepts an organization invitation)
// - organization.invitation.created (when a new organization invitation is created)
// - organization.invitation.revoked (when an organization invitation is revoked)

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "~/db";
import { projectTeamMembers } from "~/db/schema";
import { eq } from "drizzle-orm";
import { env } from "~/env";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Check if webhook secret is configured
  const webhookSecret = env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!webhookSecret) {
    console.error(
      "CLERK_WEBHOOK_SIGNING_SECRET environment variable is not set",
    );
    return new NextResponse("Webhook secret not configured", {
      status: 500,
    });
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook event
  const eventType = evt.type as string;

  console.log(`Webhook received: ${eventType}`, {
    eventId: evt.data.id,
  });

  // Helper function to safely parse dates
  const safeParseDate = (timestamp: number | string) => {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  // Handle standard invitation events
  if (eventType === "invitation.accepted") {
    const invitationData = evt.data as any;

    console.log("Invitation accepted:", {
      invitationId: invitationData.id,
      emailAddress: invitationData.email_address,
      publicMetadata: invitationData.public_metadata,
      acceptedAt: safeParseDate(invitationData.updated_at),
    });

    try {
      // Get the project ID and role from the invitation metadata
      const projectId = invitationData.public_metadata?.projectId;
      const role = invitationData.public_metadata?.role;

      if (projectId && invitationData.email_address) {
        // Find the user who accepted the invitation by email
        // Note: We need to get the user ID from a separate user.created event
        // For now, we'll update the record when we have the actual user ID
        console.log(
          "Updating project team member record for accepted invitation",
          {
            projectId,
            email: invitationData.email_address,
            role,
          },
        );
      }
    } catch (error) {
      console.error(
        "Error updating project team member on invitation acceptance:",
        error,
      );
    }
  }
  // Handle user creation (when invitation is fully completed)
  else if (eventType === "user.created") {
    const userData = evt.data as any;
    console.log("User created:", {
      userId: userData.id,
      emailAddress: userData.email_addresses?.[0]?.email_address,
      firstName: userData.first_name,
      lastName: userData.last_name,
      createdAt: safeParseDate(userData.created_at),
    });

    try {
      // Update any pending project team member records with the new user ID
      const userEmail = userData.email_addresses?.[0]?.email_address;
      if (userEmail && userData.id) {
        const updateResult = await db
          .update(projectTeamMembers)
          .set({
            clerkUserId: userData.id,
            joinedAt: new Date().toISOString(),
          })
          .where(eq(projectTeamMembers.clerkUserId, userEmail))
          .returning();

        if (updateResult.length > 0) {
          console.log("Successfully linked user to project team:", {
            userId: userData.id,
            email: userEmail,
            projectsLinked: updateResult.length,
          });
        }
      }
    } catch (error) {
      console.error("Error linking user to project teams:", error);
    }
  }
  // Handle organization invitation events (both formats)
  else if (
    eventType === "organization.invitation.accepted" ||
    eventType === "organizationInvitation.accepted"
  ) {
    const invitationData = evt.data as any;

    console.log("Organization invitation accepted:", {
      invitationId: invitationData.id,
      organizationId: invitationData.organization_id,
      emailAddress: invitationData.email_address,
      role: invitationData.role,
      roleName: invitationData.role_name,
      status: invitationData.status,
      acceptedAt: safeParseDate(invitationData.updated_at),
      expiresAt: safeParseDate(invitationData.expires_at),
      url: invitationData.url,
    });

    // Organization invitations are handled differently - they don't use our project system
    console.log(
      "Organization invitation handling not implemented for project teams",
    );
  } else if (
    eventType === "organization.invitation.created" ||
    eventType === "organizationInvitation.created"
  ) {
    const invitationData = evt.data as any;
    console.log("Organization invitation created:", {
      invitationId: invitationData.id,
      organizationId: invitationData.organization_id,
      emailAddress: invitationData.email_address,
      role: invitationData.role,
      roleName: invitationData.role_name,
      status: invitationData.status,
      createdAt: safeParseDate(invitationData.created_at),
      expiresAt: safeParseDate(invitationData.expires_at),
      url: invitationData.url,
    });
  } else if (
    eventType === "organization.invitation.revoked" ||
    eventType === "organizationInvitation.revoked"
  ) {
    const invitationData = evt.data as any;
    console.log("Organization invitation revoked:", {
      invitationId: invitationData.id,
      organizationId: invitationData.organization_id,
      emailAddress: invitationData.email_address,
      role: invitationData.role,
      roleName: invitationData.role_name,
      status: invitationData.status,
      revokedAt: safeParseDate(invitationData.updated_at),
    });
  } else if (eventType === "user.updated") {
    const userData = evt.data as any;
    console.log("User updated:", {
      userId: userData.id,
      emailAddress: userData.email_addresses?.[0]?.email_address,
      firstName: userData.first_name,
      lastName: userData.last_name,
      updatedAt: safeParseDate(userData.updated_at),
    });
  } else {
    console.log(`Unhandled webhook event type: ${eventType}`, {
      data: evt.data,
    });
  }

  return new NextResponse("Webhook processed successfully", { status: 200 });
}
