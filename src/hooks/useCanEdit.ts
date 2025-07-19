import { useUser } from "@clerk/nextjs";
import { api } from "~/trpc/react";

export default function useCanEdit({
  userId,
  eventId,
}: {
  userId: string | undefined;
  eventId: number | undefined;
}) {
  const { user } = useUser();

  // Always call the hook, but control execution with enabled
  const { data: event } = api.events.getById.useQuery(
    { id: eventId! }, // We use ! because enabled ensures eventId exists when query runs
    {
      enabled: !!eventId && !!userId,
    },
  );

  // Early return after all hooks have been called
  if (!eventId || !userId) return undefined;

  const role = user?.publicMetadata.role;

  const canEdit = role === "admin" || event?.createdById === userId;
  return canEdit;
}
