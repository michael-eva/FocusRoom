import { useState } from "react";
import { api } from "~/trpc/react";
import { useUser } from "@clerk/nextjs";

interface PollData {
  title: string;
  description?: string;
  options: string[];
}

interface UseCreatePollOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCreatePoll(options?: UseCreatePollOptions) {
  const { user } = useUser();
  const utils = api.useUtils();
  const [isCreating, setIsCreating] = useState(false);

  const createPollMutation = api.polls.create.useMutation({
    onSuccess: async () => {
      await utils.activity.getRecentActivity.invalidate();
      await utils.feed.getFeed.invalidate();
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error as unknown as Error);
    },
  });

  const createPoll = async (pollData: PollData) => {
    if (!user?.id) {
      throw new Error("User must be authenticated to create polls");
    }

    if (!pollData.title.trim()) {
      throw new Error("Poll title is required");
    }

    if (pollData.options.length < 2) {
      throw new Error("Poll must have at least 2 options");
    }

    const validOptions = pollData.options.filter(
      (option) => option.trim() !== "",
    );
    if (validOptions.length < 2) {
      throw new Error("Poll must have at least 2 valid options");
    }

    setIsCreating(true);
    console.log("pollData", pollData);
    try {
      await createPollMutation.mutateAsync({
        question: pollData.title,
        options: validOptions,
        createdByClerkUserId: user.id,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createPoll,
    isCreating: isCreating || createPollMutation.isPending,
    error: createPollMutation.error,
    isSuccess: createPollMutation.isSuccess,
    reset: createPollMutation.reset,
  };
}
