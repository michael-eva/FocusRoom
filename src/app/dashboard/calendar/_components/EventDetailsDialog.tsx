import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useIsMobile } from "~/hooks/use-mobile";
import { RSVPDialog } from "../../community/_components/RSVPDialog";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useUser } from "@clerk/nextjs";

interface LocalEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean | null;
  rsvpLink: string | null;
  createdById: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  userRSVP?: {
    id: number;
    eventId: number;
    userId: number;
    status: "attending" | "maybe" | "declined";
    createdAt: string;
    updatedAt: string;
  } | null;
}

interface EventDetailsDialogProps {
  event: LocalEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: LocalEvent) => void;
  onDelete?: (eventId: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function EventDetailsDialog({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: EventDetailsDialogProps) {
  const isMobile = useIsMobile();
  const [isRSVPDialogOpen, setIsRSVPDialogOpen] = useState(false);
  const { user } = useUser();
  const currentUserId = user?.id;

  // RSVP mutation
  const createRSVP = api.rsvp.create.useMutation({
    onSuccess: () => {
      alert("RSVP submitted successfully!");
      setIsRSVPDialogOpen(false);
      // You might want to refresh the event data here
    },
    onError: () => {
      alert("Failed to RSVP. Please try again.");
    }
  });

  if (!event) return null;

  const formatDateRange = (): string => {
    if (event.allDay) {
      const startDate = new Date(event.startDateTime).toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Check if it's a single day or multi-day event
      if (event.startDateTime === event.endDateTime) {
        return `${startDate} (All day)`;
      } else {
        const endDate = new Date(event.endDateTime).toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        return `${startDate} - ${endDate} (All day)`;
      }
    } else {
      const startDateTime = new Date(event.startDateTime).toLocaleString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const endTime = new Date(event.endDateTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Check if it's the same day
      if (new Date(event.startDateTime).toDateString() === new Date(event.endDateTime).toDateString()) {
        return `${startDateTime} - ${endTime}`;
      } else {
        const endDateTime = new Date(event.endDateTime).toLocaleString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${startDateTime} - ${endDateTime}`;
      }
    }
  };

  const getDuration = (): string => {
    const durationMs = new Date(event.endDateTime).getTime() - new Date(event.startDateTime).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (event.allDay) {
      const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      return days === 1 ? "All day" : `${days} days`;
    }

    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    }
  };

  const handleEdit = () => {
    onEdit?.(event);
    // Don't call onClose here - let the parent handle the transition
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete?.(event.id);
      onClose();
    }
  };

  const handleRSVP = () => {
    setIsRSVPDialogOpen(true);
  };

  const handleRSVPSubmit = async (status: "attending" | "maybe" | "declined") => {
    if (!event || !currentUserId) return;

    try {
      await createRSVP.mutateAsync({
        eventId: event.id,
        clerkUserId: currentUserId,
        status,
      });
    } catch (error) {
      console.error("Failed to RSVP:", error);
    }
  };

  const DialogWrapper = isMobile ? Sheet : Dialog;
  const DialogContentWrapper = isMobile ? SheetContent : DialogContent;
  const DialogHeaderWrapper = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleWrapper = isMobile ? SheetTitle : DialogTitle;

  const dialogProps = isMobile ? {
    open: isOpen,
    onOpenChange: onClose,
  } : {
    open: isOpen,
    onOpenChange: onClose,
  };

  const contentProps = isMobile ? {
    side: "bottom" as const,
    className: "max-h-[95vh] overflow-hidden flex flex-col"
  } : {
    className: "sm:max-w-lg"
  };

  return (
    <>
      <DialogWrapper {...dialogProps}>
        <DialogContentWrapper {...contentProps}>
          <DialogHeaderWrapper>
            <DialogTitleWrapper className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </DialogTitleWrapper>
          </DialogHeaderWrapper>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              {/* Event Title */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={event.allDay ? "secondary" : "default"}>
                    {event.allDay ? "All Day" : "Scheduled"}
                  </Badge>
                  <Badge variant="outline" className="text-accent border-accent">
                    Local Event
                  </Badge>
                </div>
              </div>

              {/* Date and Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">When</span>
                </div>
                <div className="ml-6">
                  <p className="text-gray-900">{formatDateRange()}</p>
                  <p className="text-sm text-gray-500">{getDuration()}</p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location</span>
                  </div>
                  <p className="ml-6 text-gray-900">{event.location}</p>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Description</span>
                  </div>
                  <p className="ml-6 text-gray-900 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* RSVP Status */}
              {event.userRSVP && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Your RSVP Status</span>
                  </div>
                  <div className="ml-6">
                    <Badge
                      variant={
                        event.userRSVP.status === "attending"
                          ? "default"
                          : event.userRSVP.status === "maybe"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        event.userRSVP.status === "attending"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : event.userRSVP.status === "maybe"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                      }
                    >
                      {event.userRSVP.status === "attending" && "✓ Attending"}
                      {event.userRSVP.status === "maybe" && "? Maybe"}
                      {event.userRSVP.status === "declined" && "✗ Declined"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* RSVP Link */}
              {event.rsvpLink && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium">RSVP Link</span>
                  </div>
                  <div className="ml-6">
                    <a
                      href={event.rsvpLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {event.rsvpLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 p-6 border-t">
            <Button
              onClick={handleRSVP}
              className="flex-1"
              variant="packOutline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              RSVP
            </Button>
            {canEdit && (
              <Button
                onClick={handleEdit}
                className="flex-1"
                variant="packOutline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            )}
            {canDelete && (
              <Button
                onClick={handleDelete}
                className="flex-1"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            )}
            {!canEdit && !canDelete && !currentUserId && (
              <Button
                onClick={onClose}
                className="flex-1"
                variant="packPrimary"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContentWrapper>
      </DialogWrapper>

      {/* RSVP Dialog */}
      <RSVPDialog
        isOpen={isRSVPDialogOpen}
        onClose={() => setIsRSVPDialogOpen(false)}
        onRSVP={handleRSVPSubmit}
        eventTitle={event?.title || ''}
        currentStatus={event?.userRSVP?.status || null}
      />
    </>
  );
}
