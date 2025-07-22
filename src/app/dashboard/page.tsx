'use client'
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"

import { Bell, User, Music, Guitar, Mic, Calendar, BarChart3, Heart, MessageSquare, LogOut } from "lucide-react"
import { CreatePollDialog } from "./community/_components/CreatePollDialog"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { useCallback, useState } from "react"
import { SpotlightDialog } from "./_components/spotlight/SpotlightDialog"
import { api } from "~/trpc/react"
import { CreateEventDialog, type EventFormData } from "./community/_components/CreateEventDialog"
import { useUser } from "@clerk/nextjs"

export default function Dashboard() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)

    const utils = api.useUtils();

    // API mutation for creating polls
    const createPoll = api.polls.create.useMutation({
        onSuccess: async () => {
            alert("Poll created successfully!");
            await utils.activity.getRecentActivity.invalidate();
        },
        onError: () => {
            alert("Failed to create poll. Please try again.");
        }
    });
    const createLocalEvent = api.events.create.useMutation({
        onSuccess: async () => {
            alert("Event created successfully!");
            await utils.activity.getRecentActivity.invalidate();
        },
        onError: () => {
            alert("Failed to create event. Please try again.");
        }
    });

    // Get current user info from Clerk
    const { user } = useUser();
    const currentUserId = user?.id;

    // Get recent activity from database (includes polls and events)
    const { data: activityData = [] } = api.activity.getRecentActivity.useQuery(
        { limit: 10 },
        {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        }
    );

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

            alert("Event created successfully!");
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Please try again.");
        }
    }, [createLocalEvent]);

    const handleCreatePoll = async (pollData: any) => {
        console.log("Creating poll with data:", pollData);
        await createPoll.mutateAsync({
            title: pollData.title,
            content: pollData.description,
            options: pollData.options,
            createdByClerkUserId: currentUserId,
        });

    }

    // Helper function to format activity text and get icon
    const getActivityDisplay = (activity: any) => {
        const userName = activity.user?.name || 'Someone';
        const createdAt = activity.createdAt ? new Date(activity.createdAt) : new Date();
        const timeAgo = getTimeAgo(createdAt);

        switch (activity.activityType) {
            case 'poll_created':
                return {
                    text: `${userName} created a poll`,
                    title: activity.poll?.title || 'Untitled Poll',
                    content: activity.poll?.content,
                    icon: <BarChart3 className="h-4 w-4 text-blue-500" />,
                    timeAgo,
                    type: 'poll'
                };
            case 'poll_voted':
                return {
                    text: `${userName} voted on a poll`,
                    title: activity.poll?.title || 'Untitled Poll',
                    content: activity.poll?.content,
                    icon: <BarChart3 className="h-4 w-4 text-green-500" />,
                    timeAgo,
                    type: 'poll'
                };
            case 'event_created':
                return {
                    text: `${userName} created an event`,
                    title: activity.event?.title || 'Untitled Event',
                    content: activity.event?.description,
                    icon: <Calendar className="h-4 w-4 text-orange-500" />,
                    timeAgo,
                    type: 'event'
                };
            case 'event_rsvp':
                return {
                    text: `${userName} RSVP'd to an event`,
                    title: activity.event?.title || 'Untitled Event',
                    content: activity.event?.description,
                    icon: <Calendar className="h-4 w-4 text-purple-500" />,
                    timeAgo,
                    type: 'event'
                };
            case 'post_liked':
                return {
                    text: `${userName} liked a ${activity.targetType || 'post'}`,
                    title: '',
                    content: activity.description,
                    icon: <Heart className="h-4 w-4 text-red-500" />,
                    timeAgo,
                    type: 'like'
                };
            case 'comment_created':
                return {
                    text: `${userName} commented on a ${activity.targetType || 'post'}`,
                    title: '',
                    content: activity.description,
                    icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
                    timeAgo,
                    type: 'comment'
                };
            default:
                return {
                    text: `${userName} performed an action`,
                    title: '',
                    content: '',
                    icon: <div className="h-4 w-4 rounded-full bg-gray-300" />,
                    timeAgo,
                    type: 'other'
                };
        }
    };

    // Helper function to format time ago
    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };
    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <SidebarTrigger />
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                        <span className="hidden sm:inline">Pack Music Australia</span>
                        <span className="sm:hidden">Pack Music</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                                <User className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="end">
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => window.location.href = '/sign-out'}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 bg-gray-50">
                <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
                    {/* Welcome Banner */}
                    <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1 pr-4">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 leading-tight">
                                        Welcome to the Focus Room!
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-600">Songwriters Showcase - Apr 30</p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 text-orange-400 flex-shrink-0">
                                    <Music className="h-6 w-6 sm:h-8 sm:w-8" />
                                    <Guitar className="h-8 w-8 sm:h-12 sm:w-12" />
                                    <Music className="h-4 w-4 sm:h-6 sm:w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group active:scale-95"
                            onClick={() => setIsCreateEventOpen(true)}>
                            <CardContent className="p-4 sm:p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                        <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">Create Event</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Schedule a new event or meeting</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group active:scale-95"
                            onClick={() => setIsCreatePollOpen(true)}
                        >
                            <CardContent className="p-4 sm:p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">Create Poll</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Get feedback from the community</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group active:scale-95 sm:col-span-2 lg:col-span-1"
                            onClick={() => setIsSpotlightOpen(true)}
                        >
                            <CardContent className="p-4 sm:p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-500 rounded-full flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                                        <Mic className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">Spotlight</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Share your music or story</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                            {activityData.length > 0 ? (
                                activityData.map((activity) => {
                                    const display = getActivityDisplay(activity);
                                    return (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100 cursor-pointer">
                                            <div className="flex-shrink-0 mt-1">
                                                {display.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 leading-snug">{display.text}</p>
                                                        {display.title && (
                                                            <p className="text-sm text-gray-600 mt-1 font-medium truncate">{display.title}</p>
                                                        )}
                                                        {display.content && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{display.content}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 flex-shrink-0 self-start">{display.timeAgo}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No recent activity</p>
                                </div>
                            )}

                            {activityData.length > 0 && (
                                <div className="text-center pt-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href="/dashboard/community">View All Activity</a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* Spotlight Dialog */}
                <SpotlightDialog isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} isAdmin={true} />
                <CreatePollDialog
                    isOpen={isCreatePollOpen}
                    onClose={() => setIsCreatePollOpen(false)}
                    onCreatePoll={handleCreatePoll}
                />
                <CreateEventDialog
                    isOpen={isCreateEventOpen}
                    onClose={() => setIsCreateEventOpen(false)}
                    onCreateEvent={handleCreateEvent}
                    showCommunityFeatures={false}
                />
            </main>
        </>
    )
}
