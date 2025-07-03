"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { ChevronLeft, ChevronRight, Plus, Bell, User, Calendar, Clock, MapPin, ExternalLink, RefreshCw } from "lucide-react"
import { CreateEventDialog } from "~/app/dashboard/community/_components/CreateCalendarEventDialog"
import { EventDetailsDialog } from "~/app/dashboard/calendar/_components/EventDetailsDialog"
import { EditEventDialog } from "~/app/dashboard/calendar/_components/EditEventDialog"
import { GoogleCalendarConnectPrompt } from "~/app/dashboard/_components/GoogleCalendarConnectPrompt"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

interface GoogleCalendarEvent {
    id?: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: {
        dateTime?: string;
        date?: string;
    };
    end?: {
        dateTime?: string;
        date?: string;
    };
    htmlLink?: string;
}

interface LocalEvent {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startDateTime: Date;
    endDateTime: Date;
    allDay: boolean;
    rsvpLink?: string;
    createdById?: number;
    googleEventId?: string;
}

interface CombinedEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startDateTime: Date;
    endDateTime: Date;
    allDay: boolean;
    rsvpLink?: string;
    googleEventId?: string;
    isGoogleEvent: boolean;
    htmlLink?: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CombinedEvent | null>(null);
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
    const [isEditEventOpen, setIsEditEventOpen] = useState(false);
    const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
    const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(null);
    const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

    const router = useRouter();
    const utils = api.useUtils(); // Add this for cache invalidation

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // API calls
    const getAuthUrl = api.googleCalendar.getAuthUrl.useQuery(undefined, { enabled: false });
    const createGoogleEvent = api.googleCalendar.createEvent.useMutation();
    const revokeGoogleToken = api.googleCalendar.revokeToken.useMutation();
    const createLocalEvent = api.events.create.useMutation();
    const updateLocalEvent = api.events.update.useMutation();
    const deleteLocalEvent = api.events.delete.useMutation();

    // Get local events for the current month
    const { data: localEvents = [], refetch: refetchLocalEvents, isLoading: localEventsLoading, isFetching: localEventsFetching } = api.events.getByMonth.useQuery({
        year,
        month,
    }, {
        staleTime: 10 * 60 * 1000, // 10 minutes - events don't change that often
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    });

    // Google Calendar handlers (defined early to avoid circular dependencies)
    const handleDisconnectGoogleCalendar = useCallback(async () => {
        const refreshToken = localStorage.getItem("google_refresh_token");
        if (refreshToken) {
            try {
                await revokeGoogleToken.mutateAsync({ token: refreshToken });
            } catch (error) {
                console.error("Error revoking token:", error);
            }
        }

        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_refresh_token");
        setIsGoogleCalendarConnected(false);
        setGoogleAccessToken(null);
        setGoogleRefreshToken(null);
        setGoogleEvents([]);
    }, [revokeGoogleToken]);

    // Get Google Calendar events
    const { data: googleEventsData, refetch: refetchGoogleEvents, isLoading: googleEventsLoading, isFetching: googleEventsFetching } = api.googleCalendar.getEvents.useQuery({
        accessToken: googleAccessToken || "",
        refreshToken: googleRefreshToken || "",
        timeMin: new Date(year, month, 1).toISOString(),
        timeMax: new Date(year, month + 1, 0, 23, 59, 59).toISOString(),
    }, {
        enabled: !!googleAccessToken && isGoogleCalendarConnected,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes - Google Calendar events can change more frequently
        gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache
        onError: (error) => {
            console.error("Google Calendar error:", error);
            if (error.message.includes("reconnect")) {
                handleDisconnectGoogleCalendar();
                alert("Google Calendar connection expired. Please reconnect.");
            }
        },
    });

    // Initialize Google Calendar connection state
    useEffect(() => {
        const accessToken = localStorage.getItem("google_access_token");
        const refreshToken = localStorage.getItem("google_refresh_token");

        if (accessToken && refreshToken) {
            setGoogleAccessToken(accessToken);
            setGoogleRefreshToken(refreshToken);
            setIsGoogleCalendarConnected(true);
        }

        // Handle OAuth callback
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get("google_auth_success")) {
            const newAccessToken = urlParams.get("access_token");
            const newRefreshToken = urlParams.get("refresh_token");

            if (newAccessToken && newRefreshToken) {
                localStorage.setItem("google_access_token", newAccessToken);
                localStorage.setItem("google_refresh_token", newRefreshToken);
                setGoogleAccessToken(newAccessToken);
                setGoogleRefreshToken(newRefreshToken);
                setIsGoogleCalendarConnected(true);

                // Clean up URL immediately
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } else {
                console.error("OAuth callback missing tokens");
            }
        } else if (urlParams.get("google_auth_failed")) {
            alert("Google Calendar connection failed. Please try again.");
            // Clean up URL
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }, []);

    // Update Google events when data changes
    useEffect(() => {
        if (googleEventsData) {
            if (Array.isArray(googleEventsData)) {
                setGoogleEvents(googleEventsData);
            } else if (googleEventsData.events) {
                setGoogleEvents(googleEventsData.events);
                
                // Update access token if refreshed
                if (googleEventsData.newAccessToken) {
                    const currentToken = localStorage.getItem("google_access_token");
                    if (currentToken !== googleEventsData.newAccessToken) {
                        localStorage.setItem("google_access_token", googleEventsData.newAccessToken);
                        setGoogleAccessToken(googleEventsData.newAccessToken);
                    }
                }
            }
        }
    }, [googleEventsData]);

    // Combine local and Google events using useMemo to prevent unnecessary recalculations
    const combinedEvents = useMemo(() => {
        const combined: CombinedEvent[] = [];

        // Add local events
        localEvents.forEach(event => {
            combined.push({
                id: `local-${event.id}`,
                title: event.title,
                description: event.description || undefined,
                location: event.location || undefined,
                startDateTime: event.startDateTime,
                endDateTime: event.endDateTime,
                allDay: event.allDay,
                rsvpLink: event.rsvpLink || undefined,
                googleEventId: event.googleEventId || undefined,
                isGoogleEvent: false,
            });
        });

        // Add Google events, but only if they're not already represented by a local event
        googleEvents.forEach(event => {
            if (event.id && event.summary) {
                // Check if this Google event is already linked to a local event
                const isAlreadyLinked = localEvents.some(localEvent => 
                    localEvent.googleEventId === event.id
                );
                
                // Only add if not already linked to a local event
                if (!isAlreadyLinked) {
                    const startDateTime = event.start?.dateTime 
                        ? new Date(event.start.dateTime)
                        : event.start?.date 
                        ? new Date(event.start.date)
                        : new Date();
                    
                    const endDateTime = event.end?.dateTime 
                        ? new Date(event.end.dateTime)
                        : event.end?.date 
                        ? new Date(event.end.date)
                        : new Date();

                    combined.push({
                        id: `google-${event.id}`,
                        title: event.summary,
                        description: event.description,
                        location: event.location,
                        startDateTime,
                        endDateTime,
                        allDay: !event.start?.dateTime, // If no dateTime, it's an all-day event
                        isGoogleEvent: true,
                        htmlLink: event.htmlLink,
                    });
                }
            }
        });

        return combined;
    }, [localEvents, googleEvents]);

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

    const handleConnectGoogleCalendar = async () => {
        const { data } = await getAuthUrl.refetch();
        if (data?.authorizationUrl) {
            window.location.href = data.authorizationUrl;
        }
    };

    // Event creation handler
    const handleCreateEvent = useCallback(async (eventData: any) => {
        const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
        const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour later by default

        try {
            let googleEventId = null;
            
            // Create Google Calendar event first if requested
            if (eventData.addToGoogleCalendar && isGoogleCalendarConnected && googleAccessToken) {
                try {
                    const googleEvent = await createGoogleEvent.mutateAsync({
                        summary: eventData.title,
                        description: eventData.description,
                        location: eventData.location,
                        startDateTime: startDateTime.toISOString(),
                        endDateTime: endDateTime.toISOString(),
                        accessToken: googleAccessToken,
                        refreshToken: googleRefreshToken || undefined,
                    });
                    
                    googleEventId = googleEvent.eventId;
                    console.log("Google event created with ID:", googleEventId);
                } catch (error) {
                    console.error("Failed to create Google Calendar event:", error);
                    // Continue to create local event even if Google fails
                }
            }

            // Create local event with Google event ID if available
            const localEvent = await createLocalEvent.mutateAsync({
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                startDateTime,
                endDateTime,
                allDay: false,
                rsvpLink: eventData.rsvpLink,
                createdById: 1, // Default user ID - replace with actual user ID from auth
                googleEventId: googleEventId, // Link to Google event
            });

            // Refresh local events
            await refetchLocalEvents();
            
            // Only refetch Google events if we didn't create one (to avoid seeing our own event twice)
            if (!googleEventId && isGoogleCalendarConnected) {
                await refetchGoogleEvents();
            }

            alert("Event created successfully!");
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Please try again.");
        }
    }, [createLocalEvent, createGoogleEvent, isGoogleCalendarConnected, googleAccessToken, googleRefreshToken, refetchLocalEvents, refetchGoogleEvents]);

    // Calendar grid generation
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDayWeekday; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const getEventsForDate = useCallback((day: number): CombinedEvent[] => {
        const targetDate = new Date(year, month, day);
        return combinedEvents.filter(event => {
            const eventDate = new Date(event.startDateTime);
            return eventDate.toDateString() === targetDate.toDateString();
        });
    }, [combinedEvents, year, month]);

    const isToday = (day: number): boolean => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Event interaction handlers
    const handleEventClick = (event: CombinedEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsOpen(true);
    };

    const handleEventEdit = (event: CombinedEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsOpen(false);
        setIsEditEventOpen(true);
    };

    const handleEventUpdate = useCallback(async (eventData: any) => {
        if (!selectedEvent) return;

        try {
            if (selectedEvent.isGoogleEvent) {
                alert('Cannot edit Google Calendar events from this app. Please edit in Google Calendar.');
                return;
            }

            // Extract the numeric ID from the combined event ID
            const numericId = parseInt(selectedEvent.id.replace('local-', ''));
            
            // Create new date/time objects
            const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
            const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour later by default

            await updateLocalEvent.mutateAsync({
                id: numericId,
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

    const handleEventDelete = async (eventId: string) => {
        if (!selectedEvent) return;

        try {
            if (selectedEvent.isGoogleEvent) {
                alert('Cannot delete Google Calendar events from this app. Please delete from Google Calendar.');
                return;
            }

            // Extract the numeric ID from the combined event ID
            const numericId = parseInt(eventId.replace('local-', ''));
            
            await deleteLocalEvent.mutateAsync({ id: numericId });
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
                    {isGoogleCalendarConnected && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Google Calendar Connected</span>
                        </div>
                    )}
                    {(localEventsFetching || googleEventsFetching) && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span>Loading events...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {isGoogleCalendarConnected && (
                        <Button
                            variant="outline"
                            onClick={handleDisconnectGoogleCalendar}
                            className="text-red-500 hover:text-red-600"
                        >
                            Disconnect Google Calendar
                        </Button>
                    )}
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => setIsCreateEventOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                    </Button>
                    {isGoogleCalendarConnected && (
                        <Button
                            variant="outline"
                            onClick={async () => {
                                // Sync all local events to Google Calendar
                                const eventsToSync = localEvents.filter(event => !event.googleEventId);
                                if (eventsToSync.length === 0) {
                                    alert('All events are already synced to Google Calendar!');
                                    return;
                                }

                                if (confirm(`Sync ${eventsToSync.length} local events to Google Calendar?`)) {
                                    let synced = 0;
                                    for (const event of eventsToSync) {
                                        try {
                                            await createGoogleEvent.mutateAsync({
                                                summary: event.title,
                                                description: event.description || '',
                                                location: event.location || '',
                                                startDateTime: event.startDateTime.toISOString(),
                                                endDateTime: event.endDateTime.toISOString(),
                                                accessToken: googleAccessToken!,
                                                refreshToken: googleRefreshToken || undefined,
                                            });
                                            synced++;
                                        } catch (error) {
                                            console.error('Failed to sync event:', event.title, error);
                                        }
                                    }
                                    alert(`Successfully synced ${synced} events to Google Calendar!`);
                                    await refetchGoogleEvents();
                                }
                            }}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Sync to Google
                        </Button>
                    )}
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {!isGoogleCalendarConnected ? (
                <GoogleCalendarConnectPrompt onConnect={handleConnectGoogleCalendar} />
            ) : (
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
                                                if (isGoogleCalendarConnected) {
                                                    await refetchGoogleEvents();
                                                }
                                            }}
                                            disabled={localEventsFetching || googleEventsFetching}
                                            title="Refresh events"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${(localEventsFetching || googleEventsFetching) ? 'animate-spin' : ''}`} />
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
                                                                className={`text-xs p-1 rounded truncate relative group cursor-pointer hover:shadow-md transition-shadow ${event.isGoogleEvent
                                                                        ? "bg-blue-100 text-blue-800 border-l-2 border-blue-500 hover:bg-blue-200"
                                                                        : "bg-green-100 text-green-800 border-l-2 border-green-500 hover:bg-green-200"
                                                                    }`}
                                                                title={`${event.title}${event.location ? ` - ${event.location}` : ''}${!event.allDay ? ` at ${formatTime(event.startDateTime)}` : ''
                                                                    }`}
                                                                onClick={() => handleEventClick(event)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="truncate flex-1">
                                                                        {!event.allDay && (
                                                                            <Clock className="inline h-3 w-3 mr-1" />
                                                                        )}
                                                                        {event.title}
                                                                    </span>
                                                                    {event.isGoogleEvent && event.htmlLink && (
                                                                        <a
                                                                            href={event.htmlLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {event.location && (
                                                                    <div className="flex items-center text-xs opacity-75 mt-1">
                                                                        <MapPin className="h-3 w-3 mr-1" />
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
            )}

            <CreateEventDialog
                isOpen={isCreateEventOpen}
                onClose={() => setIsCreateEventOpen(false)}
                onCreateEvent={handleCreateEvent}
                isGoogleCalendarConnected={isGoogleCalendarConnected}
                handleConnectGoogleCalendar={handleConnectGoogleCalendar}
                handleDisconnectGoogleCalendar={handleDisconnectGoogleCalendar}
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
                canEdit={selectedEvent ? !selectedEvent.isGoogleEvent : false}
                canDelete={selectedEvent ? !selectedEvent.isGoogleEvent : false}
            />

            <EditEventDialog
                event={selectedEvent}
                isOpen={isEditEventOpen}
                onClose={() => {
                    setIsEditEventOpen(false);
                    setSelectedEvent(null);
                }}
                onUpdateEvent={handleEventUpdate}
                isGoogleCalendarConnected={isGoogleCalendarConnected}
            />
        </>
    );
}
