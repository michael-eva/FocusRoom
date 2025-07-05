'use client'
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"

import { Bell, User, Music, Guitar, Mic, Calendar, BarChart3, Heart, MessageSquare } from "lucide-react"
import { CreatePollDialog } from "./community/_components/CreatePollDialog"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { useCallback, useState } from "react"
import { SpotlightDialog } from "./_components/spotlight/SpotlightDialog"
import { api } from "~/trpc/react"
import { CreateEventDialog } from "./community/_components/CreateEventDialog"

export default function Dashboard() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)

    // API mutation for creating polls
    const createPoll = api.polls.create.useMutation();
    const createLocalEvent = api.events.create.useMutation();

    // Get recent activity from database (includes polls and events)
    const { data: activityData = [] } = api.activity.getRecentActivity.useQuery(
        { limit: 10 },
        {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        }
    );

    const handleCreateEvent = useCallback(async (eventData: any) => {
        console.log("Creating event with data:", eventData);
        try {
            const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
            const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour later by default

            // Create the event in the database
            await createLocalEvent.mutateAsync({
                title: eventData.title,
                description: eventData.description,
                location: eventData.location,
                startDateTime,
                endDateTime,
                allDay: false,
                rsvpLink: eventData.rsvpLink,
                createdById: 1, // Default user ID - replace with actual user ID from auth
            });

            // Show success message
            if (eventData.publishToCommunity) {
                alert("Event created and published to community! Email notifications sent to all members.");
            } else {
                alert("Event created successfully!");
            }
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Please try again.");
        }
    }, [createLocalEvent]);

    const handleCreatePoll = async (pollData: any) => {
        console.log("Creating poll with data:", pollData);
        try {
            await createPoll.mutateAsync({
                title: pollData.title,
                content: pollData.description,
                options: pollData.options,
                createdById: 1, // Default user ID - replace with actual user ID from auth
            });

            alert("Poll created successfully!");
        } catch (error) {
            console.error("Failed to create poll:", error);
            alert("Failed to create poll. Please try again.");
        }
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
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold text-gray-800">Pack Music Australia</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 bg-gray-50">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Welcome Banner */}
                    <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to the Focus Room!</h2>
                                    <p className="text-gray-600">Songwriters Showcase - Apr 30</p>
                                </div>
                                <div className="flex items-center gap-4 text-orange-400">
                                    <Music className="h-8 w-8" />
                                    <Guitar className="h-12 w-12" />
                                    <Music className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                            onClick={() => setIsCreateEventOpen(true)}>
                            <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                        <Calendar className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg mb-1">Create Event</h3>
                                        <p className="text-sm text-gray-600">Schedule a new event or meeting</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                            onClick={() => setIsCreatePollOpen(true)}
                        >
                            <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg mb-1">Create Poll</h3>
                                        <p className="text-sm text-gray-600">Get feedback from the community</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                            onClick={() => setIsSpotlightOpen(true)}
                        >
                            <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                                        <Mic className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg mb-1">Spotlight</h3>
                                        <p className="text-sm text-gray-600">Share your music or story</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activityData.length > 0 ? (
                                activityData.map((activity) => {
                                    const display = getActivityDisplay(activity);
                                    return (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex-shrink-0 mt-1">
                                                {display.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-800">{display.text}</p>
                                                        {display.title && (
                                                            <p className="text-sm text-gray-600 mt-1 font-medium">{display.title}</p>
                                                        )}
                                                        {display.content && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{display.content}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{display.timeAgo}</span>
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
