"use client"

import { useState, useCallback } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { ChevronLeft, ChevronRight, Plus, Bell, User, RefreshCw } from "lucide-react"
import { CreateEventDialog } from "~/app/dashboard/community/_components/CreateEventDialog"
import { EventDetailsDialog } from "~/app/dashboard/calendar/_components/EventDetailsDialog"
import { EditEventDialog } from "~/app/dashboard/calendar/_components/EditEventDialog"
import { api } from "~/trpc/react"


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
    startDateTime: Date;
    endDateTime: Date;
    allDay: boolean | null;
    rsvpLink: string | null;
    createdById: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    googleEventId: string | null;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
    const [isEditEventOpen, setIsEditEventOpen] = useState(false);

    const utils = api.useUtils();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // API calls
    const createLocalEvent = api.events.create.useMutation();
    const updateLocalEvent = api.events.update.useMutation();
    const deleteLocalEvent = api.events.delete.useMutation();

    // Get current user info (for now using first available user)
    const { data: currentUser } = api.users.getAll.useQuery();
    const currentUserId = currentUser?.[0]?.id || 67; // Use first available user or fallback to 67

    // Get local events for the current month
    const { data: localEvents = [], refetch: refetchLocalEvents, isFetching: localEventsFetching } = api.events.getByMonth.useQuery({
        year,
        month,
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
    const handleCreateEvent = useCallback(async (eventData: any) => {
        const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
        const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour later by default

        try {
            // Create local event
            await createLocalEvent.mutateAsync({
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                startDateTime,
                endDateTime,
                allDay: false,
                rsvpLink: eventData.rsvpLink,
                createdById: currentUserId,
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

    const formatTime = (date: Date): string => {
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

    const handleEventUpdate = useCallback(async (eventData: any) => {
        if (!selectedEvent) return;

        try {
            // Create new date/time objects
            const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
            const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour later by default

            await updateLocalEvent.mutateAsync({
                id: selectedEvent.id,
                title: eventData.title,
                description: eventData.description || undefined,
                location: eventData.location || undefined,
                startDateTime,
                endDateTime,
                allDay: false,
                rsvpLink: eventData.rsvpLink || undefined,
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
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold text-gray-800">Calendar & Events</h1>
                    {localEventsFetching && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span>Loading events...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => setIsCreateEventOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    <Card className="h-full">
                        <CardContent className="p-6 h-full">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {MONTHS[month]} {year}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                                        Today
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
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
                                    >
                                        <RefreshCw className={`h-4 w-4 ${localEventsFetching ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 h-full">
                                {/* Day Headers */}
                                {DAYS.map((day) => (
                                    <div key={day} className="p-3 text-center font-semibold text-gray-600 border-b">
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar Days */}
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`min-h-[120px] p-2 border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${day ? "cursor-pointer" : ""
                                            }`}
                                    >
                                        {day && (
                                            <>
                                                <div
                                                    className={`text-sm font-medium mb-1 ${isToday(day)
                                                        ? "bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
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
                                                            className="text-xs p-1 rounded truncate relative group cursor-pointer hover:shadow-md transition-shadow bg-green-100 text-green-800 border-l-2 border-green-500 hover:bg-green-200"
                                                            title={`${event.title}${event.location ? ` - ${event.location}` : ''}${!event.allDay ? ` at ${formatTime(event.startDateTime)}` : ''
                                                                }`}
                                                            onClick={() => handleEventClick(event)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="truncate flex-1">
                                                                    {!event.allDay && (
                                                                        <span className="inline-block w-3 h-3 mr-1">🕐</span>
                                                                    )}
                                                                    {event.title}
                                                                </span>
                                                            </div>
                                                            {event.location && (
                                                                <div className="flex items-center text-xs opacity-75 mt-1">
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
                canEdit={true}
                canDelete={true}
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
