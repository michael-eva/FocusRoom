"use client"

import { useState, useCallback } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { ChevronLeft, ChevronRight, Plus, Bell, User, RefreshCw, Calendar, MoreHorizontal } from "lucide-react"
import { CreateEventDialog, type EventFormData } from "~/app/dashboard/community/_components/CreateEventDialog"
import { EventDetailsDialog } from "~/app/dashboard/calendar/_components/EventDetailsDialog"
import { EditEventDialog } from "~/app/dashboard/calendar/_components/EditEventDialog"
import { api } from "~/trpc/react"
import useCanEdit from "~/hooks/useCanEdit"
import { useUser } from "@clerk/nextjs"
import CommonNavbar from "~/app/_components/CommonNavbar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"


const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

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
    timezone?: string; // Add this line
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
    const [isEditEventOpen, setIsEditEventOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    console.log("selectedEvent", selectedEvent);

    const utils = api.useUtils();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // API calls
    const createLocalEvent = api.events.create.useMutation();
    const updateLocalEvent = api.events.update.useMutation();
    const deleteLocalEvent = api.events.delete.useMutation();

    // Get current user info from Clerk
    const { user } = useUser();
    const currentUserId = user?.id;
    const canEdit = useCanEdit({ userId: currentUserId, eventId: selectedEvent?.id });
    console.log("canEdit", canEdit);
    // Get local events for the current month
    const { data: localEvents = [], refetch: refetchLocalEvents, isFetching: localEventsFetching } = api.events.getByMonth.useQuery({
        year,
        month,
        userId: currentUserId,
    }, {
        staleTime: 10 * 60 * 1000, // 10 minutes - events don't change that often
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    });

    // Calendar navigation
    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === "prev") {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    // Event creation handler
    const handleCreateEvent = useCallback(async (eventData: EventFormData) => {
        const eventDate = new Date(`${eventData.date}T${eventData.startTime}`).toISOString();
        const endDate = new Date(`${eventData.date}T${eventData.endTime}`).toISOString();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        try {
            // Create local event
            await createLocalEvent.mutateAsync({
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                eventDate: eventDate,
                endDate: endDate,
                createdByClerkUserId: currentUserId,
                timezone, // Pass timezone
            });

            // Refresh local events
            await refetchLocalEvents();

            alert("Event created successfully!");
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Please try again.");
        }
    }, [createLocalEvent, refetchLocalEvents]);

    // Calendar grid generation
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayWeekday; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const getEventsForDate = useCallback((day: number): LocalEvent[] => {
        const targetDate = new Date(year, month, day);
        return localEvents.filter(event => {
            const eventDate = new Date(event.startDateTime);
            return eventDate.toDateString() === targetDate.toDateString();
        });
    }, [localEvents, year, month]);

    const isToday = (day: number): boolean => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    // Add a helper to format date/time in the event's timezone
    function formatInTimeZone(dateString: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
        return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(new Date(dateString));
    }

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Event interaction handlers
    const handleEventClick = (event: LocalEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsOpen(true);
    };

    const handleEventEdit = (event: LocalEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsOpen(false);
        setIsEditEventOpen(true);
    };

    const handleEventUpdate = useCallback(async (eventData: EventFormData) => {
        if (!selectedEvent) return;

        try {
            // Create event date strings
            const eventDate = new Date(`${eventData.date}T${eventData.startTime}`).toISOString();
            const endDate = new Date(`${eventData.date}T${eventData.endTime}`).toISOString();

            await updateLocalEvent.mutateAsync({
                id: selectedEvent.id,
                title: eventData.title,
                description: eventData.description || undefined,
                location: eventData.location || undefined,
                eventDate: eventDate,
                endDate: endDate,
            });

            // Refresh local events
            await refetchLocalEvents();

            setIsEditEventOpen(false);
            setSelectedEvent(null);

            alert('Event updated successfully!');
        } catch (error) {
            console.error('Failed to update event:', error);
            alert('Failed to update event. Please try again.');
        }
    }, [selectedEvent, updateLocalEvent, refetchLocalEvents]);

    const handleEventDelete = async (eventId: number) => {
        if (!selectedEvent) return;

        try {
            await deleteLocalEvent.mutateAsync({ id: eventId });
            await refetchLocalEvents();

            setIsEventDetailsOpen(false);
            setSelectedEvent(null);

            alert('Event deleted successfully!');
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event. Please try again.');
        }
    };

    return (
        <>
            {/* <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-white">
                <div className="flex items-center gap-2 sm:gap-4">
                    <SidebarTrigger />
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Calendar & Events</h1>
                    {localEventsFetching && (
                        <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span>Loading events...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base px-2 sm:px-4"
                        onClick={() => setIsCreateEventOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Create Event</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header> */}

            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title="Calendar"
                    rightContent={<div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base px-2 sm:px-4"
                            onClick={() => setIsCreateEventOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Create Event</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </div>}
                    mobilePopoverContent={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                    <Button onClick={() => setIsCreateEventOpen(true)} variant="ghost" className="justify-start">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Event
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                />
                <div className="max-w-7xl mx-auto">
                    <Card className="h-full">
                        <CardContent className="p-3 sm:p-6 h-full">
                            {/* Calendar Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                <div className="flex items-center justify-between sm:justify-start">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                        {MONTHS[month]} {year}
                                    </h2>
                                    {/* Mobile view toggle */}
                                    <div className="flex sm:hidden gap-1">
                                        <Button
                                            variant={viewMode === "calendar" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("calendar")}
                                            className="px-2"
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === "list" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                            className="px-2"
                                        >
                                            List
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} className="h-8 w-8 sm:h-10 sm:w-10">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="text-sm px-2 sm:px-4">
                                        Today
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} className="h-8 w-8 sm:h-10 sm:w-10">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={async () => {
                                            await utils.events.getByMonth.invalidate({ year, month });
                                        }}
                                        disabled={localEventsFetching}
                                        title="Refresh events"
                                        className="h-8 w-8 sm:h-10 sm:w-10"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${localEventsFetching ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Loading indicator for mobile */}
                            {localEventsFetching && (
                                <div className="flex sm:hidden items-center justify-center gap-2 py-4 bg-blue-50 text-blue-700 rounded-lg mb-4">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    <span className="text-sm">Loading events...</span>
                                </div>
                            )}

                            {/* Calendar Grid - Hidden on mobile when in list view */}
                            {viewMode === "calendar" && (
                                <div className="grid grid-cols-7 gap-1 h-full">
                                    {/* Day Headers */}
                                    {DAYS.map((day) => (
                                        <div key={day} className="p-2 sm:p-3 text-center font-semibold text-gray-600 border-b text-xs sm:text-sm">
                                            {day}
                                        </div>
                                    ))}

                                    {/* Calendar Days */}
                                    {calendarDays.map((day, index) => (
                                        <div
                                            key={index}
                                            className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${day ? "cursor-pointer" : ""
                                                }`}
                                        >
                                            {day && (
                                                <>
                                                    <div
                                                        className={`text-xs sm:text-sm font-medium mb-1 ${isToday(day)
                                                            ? "bg-orange-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                                                            : "text-gray-700"
                                                            }`}
                                                    >
                                                        {day}
                                                    </div>

                                                    {/* Events for this day */}
                                                    <div className="space-y-1">
                                                        {getEventsForDate(day).map((event) => (
                                                            <div
                                                                key={event.id}
                                                                className={`text-xs p-1 rounded truncate relative group cursor-pointer hover:shadow-md transition-shadow border-l-2 ${event.userRSVP?.status === "attending"
                                                                    ? "bg-green-100 text-green-800 border-green-500 hover:bg-green-200"
                                                                    : event.userRSVP?.status === "maybe"
                                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-500 hover:bg-yellow-200"
                                                                        : event.userRSVP?.status === "declined"
                                                                            ? "bg-red-100 text-red-800 border-red-500 hover:bg-red-200"
                                                                            : "bg-blue-100 text-blue-800 border-blue-500 hover:bg-blue-200"
                                                                    }`}
                                                                title={`${event.title}${event.location ? ` - ${event.location}` : ''}${!event.allDay ? ` at ${formatInTimeZone(event.startDateTime, event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, { hour: '2-digit', minute: '2-digit' })}` : ''
                                                                    }${event.userRSVP ? ` (RSVP: ${event.userRSVP.status})` : ''}`}
                                                                onClick={() => handleEventClick(event)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="truncate flex-1">
                                                                        {!event.allDay && (
                                                                            <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 mr-1">🕐</span>
                                                                        )}
                                                                        <span className="hidden sm:inline">{event.title}</span>
                                                                        <span className="sm:hidden">{event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}</span>
                                                                    </span>
                                                                    {event.userRSVP && (
                                                                        <span className="ml-1 text-xs font-medium">
                                                                            {event.userRSVP.status === "attending" && "✓"}
                                                                            {event.userRSVP.status === "maybe" && "?"}
                                                                            {event.userRSVP.status === "declined" && "✗"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {event.location && (
                                                                    <div className="hidden sm:flex items-center text-xs opacity-75 mt-1">
                                                                        <span className="inline-block w-3 h-3 mr-1">📍</span>
                                                                        <span className="truncate">{event.location}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* List View - Mobile optimized */}
                            {viewMode === "list" && (
                                <div className="space-y-3">
                                    <div className="text-lg font-semibold text-gray-800 mb-4">
                                        Events for {MONTHS[month]} {year}
                                    </div>
                                    {localEvents.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                            <p>No events scheduled for this month</p>
                                            <Button
                                                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                                                onClick={() => setIsCreateEventOpen(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Event
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {localEvents
                                                .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                                                .map((event) => (
                                                    <div
                                                        key={event.id}
                                                        className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${event.userRSVP?.status === "attending"
                                                            ? "bg-green-50 border-green-500 hover:bg-green-100"
                                                            : event.userRSVP?.status === "maybe"
                                                                ? "bg-yellow-50 border-yellow-500 hover:bg-yellow-100"
                                                                : event.userRSVP?.status === "declined"
                                                                    ? "bg-red-50 border-red-500 hover:bg-red-100"
                                                                    : "bg-blue-50 border-blue-500 hover:bg-blue-100"
                                                            }`}
                                                        onClick={() => handleEventClick(event)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-gray-400">📅</span>
                                                                        <span>{new Date(event.startDateTime).toLocaleDateString()}</span>
                                                                    </div>
                                                                    {!event.allDay && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-gray-400">🕐</span>
                                                                            <span>{formatInTimeZone(event.startDateTime, event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                    )}
                                                                    {event.location && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-gray-400">📍</span>
                                                                            <span className="truncate">{event.location}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {event.description && (
                                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                                                                )}
                                                            </div>
                                                            {event.userRSVP && (
                                                                <div className="ml-2">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${event.userRSVP.status === "attending" ? "bg-green-100 text-green-800" :
                                                                        event.userRSVP.status === "maybe" ? "bg-yellow-100 text-yellow-800" :
                                                                            "bg-red-100 text-red-800"
                                                                        }`}>
                                                                        {event.userRSVP.status === "attending" && "✓ Attending"}
                                                                        {event.userRSVP.status === "maybe" && "? Maybe"}
                                                                        {event.userRSVP.status === "declined" && "✗ Declined"}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <CreateEventDialog
                isOpen={isCreateEventOpen}
                onClose={() => setIsCreateEventOpen(false)}
                onCreateEvent={handleCreateEvent}
                showCommunityFeatures={false}
            />

            <EventDetailsDialog
                event={selectedEvent}
                isOpen={isEventDetailsOpen}
                onClose={() => {
                    setIsEventDetailsOpen(false);
                    setSelectedEvent(null);
                }}
                onEdit={handleEventEdit}
                onDelete={handleEventDelete}
                canEdit={canEdit}
                canDelete={canEdit}
            />

            <EditEventDialog
                event={selectedEvent}
                isOpen={isEditEventOpen}
                onClose={() => {
                    setIsEditEventOpen(false);
                    setSelectedEvent(null);
                }}
                onUpdateEvent={handleEventUpdate}
            />
        </>
    );
}
