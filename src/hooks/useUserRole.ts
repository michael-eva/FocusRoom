import { useUser } from "@clerk/nextjs";

export function useUserRole() {
  const { user } = useUser();
  return user?.publicMetadata.role;
}
