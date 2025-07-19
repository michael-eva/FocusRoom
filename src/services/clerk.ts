import { clerkClient, type Invitation } from "@clerk/nextjs/server";
import { client } from "~/lib/clerk";

interface CreateInvitationParams {
  emailAddress: string;
  redirectUrl?: string;
  notify?: boolean;
  ignoreExisting?: boolean;
  publicMetadata: {
    role: string;
  };
}

export async function createInvitation(
  params: CreateInvitationParams,
): Promise<Invitation> {
  const invitation = await client.invitations.createInvitation(params);
  console.log(invitation);
  return invitation;
}
