import { client } from "~/lib/clerk";

export async function checkCanDeleteContent(
  userId: string,
  contentOwnerId: string | null | undefined
): Promise<{ canDelete: boolean; isAdmin: boolean; isOwner: boolean }> {
  try {
    // Get current user from Clerk
    const user = await client.users.getUser(userId);
    
    // Check if user is admin via Clerk metadata
    const isAdmin = user.publicMetadata?.role === "admin";
    
    // Check if user owns the content
    const isOwner = contentOwnerId === userId;
    
    // User can delete if they're admin OR owner
    const canDelete = isAdmin || isOwner;
    
    return { canDelete, isAdmin, isOwner };
  } catch (error) {
    console.error("Error checking delete permissions:", error);
    return { canDelete: false, isAdmin: false, isOwner: false };
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  try {
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === "admin";
    
    if (!isAdmin) {
      throw new Error("Admin privileges required");
    }
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    throw new Error("Admin privileges required");
  }
}