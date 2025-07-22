'use client'
import { Button } from "~/components/ui/button"

import { Music, Guitar, Mic, Calendar, BarChart3, Heart, MessageSquare } from "lucide-react"
import { CreatePollDialog } from "./community/_components/CreatePollDialog"
import { Card, CardContent } from "~/components/ui/card"
import { useCallback, useState } from "react"
import { SpotlightDialog } from "./_components/spotlight/SpotlightDialog"
import { api } from "~/trpc/react"
import { CreateEventDialog, type EventFormData } from "./community/_components/CreateEventDialog"
import { RSVPDialog } from "./community/_components/RSVPDialog"
import { useUser } from "@clerk/nextjs"
import CommonNavbar from "../_components/CommonNavbar"
import ChatAndAI from "./_components/ChatAndAI"
import React from "react"

export default function Dashboard() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
    const [isRSVPDialogOpen, setIsRSVPDialogOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
    const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")
    const [chatMessage, setChatMessage] = useState("")

    // Pagination state - only for "load more" data
    const [chatOffset, setChatOffset] = useState(0)
    const [activityOffset, setActivityOffset] = useState(0)
    const [olderChatMessages, setOlderChatMessages] = useState<any[]>([])
    const [olderActivityData, setOlderActivityData] = useState<any[]>([])

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

    // Chat mutations
    const sendMessage = api.chat.sendMessage.useMutation({
        onSuccess: async () => {
            await utils.chat.getMessages.invalidate();
        },
        onError: (error) => {
            alert("Failed to send message: " + error.message);
        }
    });

    // RSVP mutations
    const createRSVP = api.rsvp.create.useMutation({
        onSuccess: async () => {
            alert("RSVP submitted successfully!");
            await utils.activity.getRecentActivity.invalidate();
        },
        onError: () => {
            alert("Failed to RSVP. Please try again.");
        }
    });

    // Get current user info from Clerk
    const { user } = useUser();
    const currentUserId = user?.id;

    // Get initial recent activity from database (includes polls and events)
    const { data: activityData = [], isLoading: isActivityLoading } = api.activity.getRecentActivity.useQuery(
        { limit: 10, offset: 0 },
        {
            staleTime: 2 * 60 * 1000, // 2 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        }
    );

    // Get initial chat messages
    const { data: chatMessagesData = [], isLoading: isChatLoading } = api.chat.getMessages.useQuery(
        { limit: 20, offset: 0 },
        {
            staleTime: 30 * 1000, // 30 seconds (more frequent updates for chat)
            gcTime: 2 * 60 * 1000, // 2 minutes
        }
    );

    // Set initial offset based on data length
    React.useEffect(() => {
        if (chatMessagesData.length > 0 && chatOffset === 0) {
            setChatOffset(chatMessagesData.length);
        }
    }, [chatMessagesData, chatOffset]);

    React.useEffect(() => {
        if (activityData.length > 0 && activityOffset === 0) {
            setActivityOffset(activityData.length);
        }
    }, [activityData, activityOffset]);

    // Load more data queries (disabled by default)
    const { data: moreChatMessages, isLoading: isLoadingMoreChat, refetch: refetchMoreChat } = api.chat.getMessages.useQuery(
        { limit: 20, offset: chatOffset },
        {
            enabled: false, // Only fetch when explicitly requested
        }
    );

    const { data: moreActivityData, isLoading: isLoadingMoreActivity, refetch: refetchMoreActivity } = api.activity.getRecentActivity.useQuery(
        { limit: 10, offset: activityOffset },
        {
            enabled: false, // Only fetch when explicitly requested
        }
    );

    // Handle new data from load more with deduplication
    React.useEffect(() => {
        if (moreChatMessages && moreChatMessages.length > 0) {
            setOlderChatMessages(prev => {
                // Get all existing IDs to avoid duplicates
                const existingIds = new Set([...prev, ...chatMessagesData].map(msg => msg.id));
                const newMessages = moreChatMessages.filter(msg => !existingIds.has(msg.id));
                return [...newMessages, ...prev]; // Prepend only new messages
            });
        }
    }, [moreChatMessages, chatMessagesData]);

    React.useEffect(() => {
        if (moreActivityData && moreActivityData.length > 0) {
            setOlderActivityData(prev => {
                // Get all existing IDs to avoid duplicates
                const existingIds = new Set([...prev, ...activityData].map(activity => activity.id));
                const newActivities = moreActivityData.filter(activity => !existingIds.has(activity.id));
                return [...newActivities, ...prev]; // Prepend only new activities
            });
        }
    }, [moreActivityData, activityData]);

    // Handle load more functionality
    const handleLoadMore = async () => {
        setChatOffset(prev => prev + 20);
        setActivityOffset(prev => prev + 10);

        // Trigger refetch for both
        await refetchMoreChat();
        await refetchMoreActivity();
    };

    const isLoadingMore = isLoadingMoreChat || isLoadingMoreActivity;
    const hasMore = chatMessagesData.length >= 20 || activityData.length >= 10;

    const handleSendMessage = async () => {
        if (chatMessage.trim() && currentUserId) {
            try {
                await sendMessage.mutateAsync({
                    content: chatMessage.trim(),
                    clerkUserId: currentUserId,
                });
                setChatMessage("");
                // Refresh current messages to include the new one
                await utils.chat.getMessages.invalidate();
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        }
    };

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

    const handleRSVP = async (eventId: number, eventTitle: string) => {
        setSelectedEventId(eventId);
        setSelectedEventTitle(eventTitle);
        setIsRSVPDialogOpen(true);
    }

    const handleRSVPSubmit = async (status: "attending" | "maybe" | "declined") => {
        if (!selectedEventId || !currentUserId) return;

        try {
            await createRSVP.mutateAsync({
                eventId: selectedEventId,
                clerkUserId: currentUserId,
                status,
            });
        } catch (error) {
            console.error("Failed to RSVP:", error);
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
                id: `activity-${activity.id}`,
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
            case 'chat_message_sent':
                // Skip chat messages since we show them separately as real chat messages
                return null;
            case 'poll_created':
                return {
                    id: `activity-${activity.id}`,
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
                    id: `activity-${activity.id}`,
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
                    id: `activity-${activity.id}`,
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
                    id: `activity-${activity.id}`,
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
                    id: `activity-${activity.id}`,
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
                    id: `activity-${activity.id}`,
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
                    id: `activity-${activity.id}`,
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

    // Convert chat messages to display format
    const getChatMessage = (chatMsg: any) => {
        const userName = chatMsg.user?.firstName || 'Unknown User';
        const createdAt = new Date(chatMsg.createdAt);
        const timeAgo = getTimeAgo(createdAt);

        return {
            id: `chat-${chatMsg.id}`,
            user: userName,
            avatar: userName.charAt(0).toUpperCase(),
            avatarColor: 'bg-indigo-500', // Different color for chat messages
            message: chatMsg.content,
            timeAgo,
            type: 'chat',
            isEdited: chatMsg.isEdited,
            chatData: chatMsg
        };
    };

    // Combine current data with older data from "load more" with deduplication
    const allChatDataSet = new Map();
    [...olderChatMessages, ...chatMessagesData].forEach(msg => {
        allChatDataSet.set(msg.id, msg);
    });
    const allChatData = Array.from(allChatDataSet.values());

    const allActivityDataSet = new Map();
    [...olderActivityData, ...activityData].forEach(activity => {
        allActivityDataSet.set(activity.id, activity);
    });
    const allActivityDataCombined = Array.from(allActivityDataSet.values());

    // Combine and sort chat messages and activity data by timestamp
    const activityMessages = allActivityDataCombined.map(activity => getActivityChatMessage(activity)).filter(msg => msg !== null);
    const realChatMessages = allChatData.map(chatMsg => getChatMessage(chatMsg));

    // Combine both arrays and sort by creation time (oldest first for chat-like experience)
    const allMessages = [...activityMessages, ...realChatMessages];

    // Final deduplication by message ID to ensure no duplicates
    const uniqueMessagesMap = new Map();
    allMessages.forEach(msg => {
        uniqueMessagesMap.set(msg.id, msg);
    });
    const uniqueMessages = Array.from(uniqueMessagesMap.values());

    uniqueMessages.sort((a, b) => {
        const timeA = a.type === 'chat' ?
            new Date(a.chatData?.createdAt || 0).getTime() :
            new Date(a.activityData?.timestamp || 0).getTime();
        const timeB = b.type === 'chat' ?
            new Date(b.chatData?.createdAt || 0).getTime() :
            new Date(b.activityData?.timestamp || 0).getTime();
        return timeA - timeB; // Oldest first (chronological order)
    });

    // Take the most recent 20 messages for display (will show oldest to newest)
    const chatMessages = uniqueMessages.slice(-20); // Take last 20 messages

    // Debug: Log the first few activities to see the structure
    console.log("Activity data sample:", activityData.slice(0, 3));
    console.log("Real chat messages sample:", chatMessagesData.slice(0, 3));
    console.log("Combined messages sample:", chatMessages.slice(0, 3));

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
                    <ChatAndAI
                        chatMessages={chatMessages}
                        chatMessage={chatMessage}
                        setChatMessage={setChatMessage}
                        handleSendMessage={handleSendMessage}
                        currentUserId={currentUserId}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                        isLoadingMore={isLoadingMore}
                        onRSVP={handleRSVP}
                    />

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
                <RSVPDialog
                    isOpen={isRSVPDialogOpen}
                    onClose={() => setIsRSVPDialogOpen(false)}
                    onRSVP={handleRSVPSubmit}
                    eventTitle={selectedEventTitle}
                />
            </main>
        </>
    )
}
