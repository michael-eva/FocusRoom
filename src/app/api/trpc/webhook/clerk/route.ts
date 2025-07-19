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
// - organization.invitation.accepted (when a user accepts an invitation)
// - organization.invitation.created (when a new invitation is created)
// - organization.invitation.revoked (when an invitation is revoked)
// - user.created (when a new user is created)
// - user.updated (when a user profile is updated)

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

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
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
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

  // Handle organization invitation events (both formats)
  if (
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

    // TODO: Add database update logic here
    // Update user table with invitation status
    // Example: await db.user.update({
    //   where: { email: invitationData.email_address },
    //   data: {
    //     organizationId: invitationData.organization_id,
    //     role: invitationData.role,
    //     invitationStatus: 'accepted'
    //   }
    // });
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
  } else if (eventType === "user.created") {
    const userData = evt.data as any;
    console.log("User created:", {
      userId: userData.id,
      emailAddress: userData.email_addresses?.[0]?.email_address,
      firstName: userData.first_name,
      lastName: userData.last_name,
      createdAt: safeParseDate(userData.created_at),
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
