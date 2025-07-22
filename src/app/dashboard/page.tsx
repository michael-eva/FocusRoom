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
import CommonNavbar from "../_components/CommonNavbar"

export default function Dashboard() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
    const [chatMessage, setChatMessage] = useState("")

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

    // Helper function to convert activity to chat message
    const getActivityChatMessage = (activity: any) => {
        console.log("Processing activity:", activity); // Debug log

        const userName = activity.user?.name || activity.user?.firstName || 'Someone';
        const createdAt = activity.timestamp ? new Date(activity.timestamp) : new Date();
        const timeAgo = getTimeAgo(createdAt);

        // Check if we have the actual activity data
        if (!activity.action) {
            console.log("No action found, using fallback");
            return {
                id: activity.id,
                user: userName,
                avatar: userName.charAt(0).toUpperCase(),
                avatarColor: 'bg-gray-500',
                message: `performed an action`,
                timeAgo,
                type: 'activity',
                activityData: activity
            };
        }

        switch (activity.action) {
            case 'poll_created':
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-blue-500',
                    message: `created a poll: "${activity.details?.replace('Created poll: ', '') || 'Untitled Poll'}"`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
            case 'poll_voted':
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-green-500',
                    message: `voted on "${activity.details?.replace('Voted on poll: ', '') || 'Untitled Poll'}"`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
            case 'event_created':
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-orange-500',
                    message: `created an event: "${activity.details?.replace('Created event: ', '') || 'Untitled Event'}"`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
            case 'event_rsvp':
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-purple-500',
                    message: `RSVP'd to "${activity.details?.replace('RSVP\'d to event: ', '') || 'Untitled Event'}"`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
            case 'post_liked':
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-red-500',
                    message: `liked a ${activity.targetType || 'post'}`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
            case 'comment_created':
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-blue-500',
                    message: `commented on a ${activity.targetType || 'post'}`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
            default:
                return {
                    id: activity.id,
                    user: userName,
                    avatar: userName.charAt(0).toUpperCase(),
                    avatarColor: 'bg-gray-500',
                    message: activity.details || `performed an action (${activity.action || 'unknown'})`,
                    timeAgo,
                    type: 'activity',
                    activityData: activity
                };
        }
    };

    // Convert activity data to chat messages
    const chatMessages = activityData.map(activity => getActivityChatMessage(activity));

    // Debug: Log the first few activities to see the structure
    console.log("Activity data sample:", activityData.slice(0, 3));
    console.log("Chat messages sample:", chatMessages.slice(0, 3));

    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            // TODO: Implement sending message to backend
            console.log("Sending message:", chatMessage);
            setChatMessage("");
        }
    };
    return (
        <>

            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title="Dashboard"
                />
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

                    {/* Quick Action Buttons - Mobile Header Style */}
                    <div className="flex gap-2 sm:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-10 bg-orange-50 border-orange-200 hover:bg-orange-100"
                            onClick={() => setIsCreateEventOpen(true)}
                        >
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            Event
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-10 bg-blue-50 border-blue-200 hover:bg-blue-100"
                            onClick={() => setIsCreatePollOpen(true)}
                        >
                            <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                            Poll
                        </Button>
                    </div>

                    {/* Spotlight Card - Standalone */}
                    <Card
                        className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group active:scale-95"
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

                    {/* Group Chat and AI Assistant Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Group Chat - Takes up 2/3 on desktop, full width on mobile */}
                        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                    Group Chat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="space-y-3">
                                    {/* Chat Messages */}
                                    {chatMessages.length > 0 ? (
                                        chatMessages.map((msg) => (
                                            <div key={msg.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border-l-4 border-blue-400 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${msg.avatarColor} shadow-sm`}>
                                                        {msg.avatar}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-semibold text-gray-800">{msg.user}</span>
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{msg.timeAgo}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 font-medium">{msg.message}</p>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No recent activity</p>
                                        </div>
                                    )}

                                    {/* Message Input */}
                                    <div className="flex gap-2 mt-4">
                                        <input
                                            type="text"
                                            placeholder="Type your message..."
                                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={chatMessage}
                                            onChange={(e) => setChatMessage(e.target.value)}
                                        />
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSendMessage}>
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Assistant - Takes up 1/3 on desktop, full width on mobile */}
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">AI</span>
                                    </div>
                                    AI Assistant
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="space-y-3">
                                    {/* AI Response */}
                                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                AI
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700">I can help you with songwriting tips, chord progressions, or finding inspiration for your next piece!</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                AI
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700">Need help with lyrics or want to explore new musical genres?</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Input */}
                                    <div className="flex gap-2 mt-4">
                                        <input
                                            type="text"
                                            placeholder="Ask AI..."
                                            className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                            Ask
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Desktop Action Cards - Hidden on Mobile */}
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
