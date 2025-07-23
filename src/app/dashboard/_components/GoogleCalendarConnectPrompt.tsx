"use client"

import { Button } from "~/components/ui/button";
import { CalendarPlus } from "lucide-react";

interface GoogleCalendarConnectPromptProps {
  onConnect: () => void;
}

export function GoogleCalendarConnectPrompt({ onConnect }: GoogleCalendarConnectPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] bg-gray-50 p-6 rounded-lg shadow-sm">
      <CalendarPlus className="h-24 w-24 text-gray-400 mb-6" />
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Connect Your Google Calendar</h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Integrate your Google Calendar to seamlessly add events directly from FocusRoom and manage your schedule.
      </p>
      <Button
        className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-4"
        onClick={onConnect}
      >
        Connect Google Calendar
      </Button>
    </div>
  );
}
