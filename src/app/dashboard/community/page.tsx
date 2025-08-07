"use client"

import { useState, useCallback } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Textarea } from "~/components/ui/textarea"
import { Bell, User, Calendar, MessageSquare, ThumbsUp, Share2, Users, Mail, Trash2, Loader2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CreatePollDialog } from "./_components/CreatePollDialog"
import { CreateEventDialog, type EventFormData } from "./_components/CreateEventDialog"
import { RSVPDialog } from "./_components/RSVPDialog"
import { api } from "~/trpc/react"
import { useUser } from "@clerk/nextjs"
import { useCreatePoll } from "~/hooks/useCreatePoll"
import { DateTime } from "luxon";
import CommonNavbar from "~/app/_components/CommonNavbar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { MoreHorizontal, Plus, BarChart3 } from "lucide-react";

// Add a helper to format date/time in the event's timezone
function formatInTimeZone(dateString: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // or 'Invalid date'
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(date);
}

export default function CommunityPage() {
    const [newComment, setNewComment] = useState("")
    const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
    const [isRSVPDialogOpen, setIsRSVPDialogOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
    const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")
    const [votingOption, setVotingOption] = useState<{ pollId: number, optionId: number } | null>(null)
    const [likingPost, setLikingPost] = useState<{ postId: number, targetType: "event" | "poll" } | null>(null)
    const [commentingPost, setCommentingPost] = useState<{ postId: number, targetType: "event" | "poll" } | null>(null)

    const { user, isLoaded: isUserLoaded } = useUser();
    const currentUserId = user?.id || "";
    const isAdmin = user?.publicMetadata?.role === "admin";

    // Get dynamic stats for community
    const { data: userCount = 0 } = api.users.getCount.useQuery();
    const { data: pollCount = 0 } = api.polls.getCount.useQuery();
    const { data: commentCount = 0 } = api.comments.getCount.useQuery();

    // Get feed data from database
    const { data: feedPosts = [], refetch: refetchFeed } = api.feed.getFeed.useQuery(
        {
            limit: 20,
            userId: currentUserId,
        },
        {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
        }
    );
    console.log("feed", feedPosts);

    // Get comments for the active post
    const activePost = feedPosts.find(p => p.id === activeCommentPost);
    const { data: postComments = [] } = api.comments.getComments.useQuery(
        {
            eventId: activePost?.type === "event" ? activeCommentPost! : undefined,
            pollId: activePost?.type === "poll" ? activeCommentPost! : undefined,
            limit: 50,
        },
        {
            enabled: !!activeCommentPost && !!activePost,
            staleTime: 2 * 60 * 1000, // 2 minutes
        }
    );


    // API mutations
    const createLocalEvent = api.events.create.useMutation();
    const deletePoll = api.polls.delete.useMutation();
    const deleteEvent = api.events.delete.useMutation();
    const votePoll = api.polls.vote.useMutation();
    const createRSVP = api.rsvp.create.useMutation();
    const toggleLike = api.likes.toggleLike.useMutation();
    const createComment = api.comments.createComment.useMutation();

    // Use the custom hook for poll creation
    const { createPoll } = useCreatePoll({
        onSuccess: () => {
            void refetchFeed();
            alert("Poll created successfully!");
        },
        onError: (error) => {
            console.error("Failed to create poll:", error);
            alert("Failed to create poll. Please try again.");
        }
    });

    const handleLike = async (postId: number, targetType: "event" | "poll") => {
        // Set loading state for this specific post
        setLikingPost({ postId, targetType });

        try {
            await toggleLike.mutateAsync({
                clerkUserId: currentUserId,
                postId: targetType === "event" ? postId : undefined,
                pollId: targetType === "poll" ? postId : undefined,
                spotlightId: undefined,
            });

            // Invalidate and refetch the feed to show updated like status
            await refetchFeed();
        } catch (error) {
            console.error("Failed to toggle like:", error);
            alert("Failed to update like. Please try again.");
        } finally {
            // Clear loading state
            setLikingPost(null);
        }
    }

    const handleRSVP = async (postId: number) => {
        // Find the event in the feed to get its title and current RSVP status
        const event = feedPosts.find(post => post.id === postId && post.type === "event")
        if (event) {
            setSelectedEventId(postId)
            setSelectedEventTitle(event.title)
            setIsRSVPDialogOpen(true)
        }
    }

    const handleRSVPSubmit = async (status: "attending" | "maybe" | "declined") => {
        if (!selectedEventId) return

        try {
            await createRSVP.mutateAsync({
                eventId: selectedEventId,
                clerkUserId: currentUserId,
                status,
            });

            // Refresh the feed to show updated RSVP status
            await refetchFeed();
        } catch (error) {
            console.error("Failed to RSVP:", error);
            alert("Failed to RSVP. Please try again.");
        }
    }

    const handleVote = async (postId: number, optionId: number) => {
        // Set loading state for this specific option
        setVotingOption({ pollId: postId, optionId });

        try {
            const result = await votePoll.mutateAsync({
                pollId: postId,
                optionId: optionId,
                clerkUserId: currentUserId,
            });

            // Refresh the feed to show updated vote counts
            await refetchFeed();

            // Show success message if available
            if (result?.message && result.message !== "You have already voted for this option") {
                // Only show toast for successful actions, not for clicking the same option
                console.log(result.message);
            }
        } catch (error) {
            console.error("Failed to vote:", error);
            alert("Failed to vote. Please try again.");
        } finally {
            // Clear loading state
            setVotingOption(null);
        }
    }

    const handleComment = async (postId: number, targetType: "event" | "poll") => {
        if (newComment.trim()) {
            // Set loading state for this specific post
            setCommentingPost({ postId, targetType });

            try {
                await createComment.mutateAsync({
                    clerkUserId: currentUserId,
                    eventId: targetType === "event" ? postId : undefined,
                    pollId: targetType === "poll" ? postId : undefined,
                    content: newComment,
                });

                // Refresh the feed to show updated comment count
                await refetchFeed();
                setNewComment("")
                setActiveCommentPost(null)
            } catch (error) {
                console.error("Failed to create comment:", error);
                alert("Failed to create comment. Please try again.");
            } finally {
                // Clear loading state
                setCommentingPost(null);
            }
        }
    }

    const handleCreateEvent = useCallback(async (eventData: EventFormData) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // or let user pick
        const eventDate = DateTime.fromFormat(
            `${eventData.date} ${eventData.startTime}`,
            "yyyy-MM-dd HH:mm",
            { zone: timezone }
        ).toUTC().toISO();

        const endDate = DateTime.fromFormat(
            `${eventData.date} ${eventData.endTime}`,
            "yyyy-MM-dd HH:mm",
            { zone: timezone }
        ).toUTC().toISO();
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
            await refetchFeed()
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Please try again.");
        }
    }, [createLocalEvent]);

    const handleCreatePoll = async (pollData: any) => {
        await createPoll(pollData);
    }

    const handleDeletePoll = async (pollId: number) => {
        if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
            return;
        }

        try {
            await deletePoll.mutateAsync({
                id: pollId
            });

            // Refresh the feed to show updated data
            await refetchFeed();

            alert("Poll deleted successfully!");
        } catch (error) {
            console.error("Failed to delete poll:", error);
            alert("Failed to delete poll. Please try again.");
        }
    }

    const handleDeleteEvent = async (eventId: number) => {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteEvent.mutateAsync({
                id: eventId
            });

            // Refresh the feed to show updated data
            await refetchFeed();

            alert("Event deleted successfully!");
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert("Failed to delete event. Please try again.");
        }
    }

    // Show loading state while user is loading
    if (!isUserLoaded) {
        return (
            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title="Community"
                    rightContent={
                        <>
                            <Button variant="packPrimary" disabled>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                            <Button variant="packSecondary" disabled>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Create Poll
                            </Button>
                        </>
                    }
                    mobilePopoverContent={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="packOutline" disabled>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                    <Button disabled variant="ghost" className="justify-start">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Event
                                    </Button>
                                    <Button disabled variant="ghost" className="justify-start">
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Create Poll
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                        <span className="text-muted-foreground">Loading community...</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
            <main className="flex-1 space-y-6 p-6">
                {/* Header */}
                {/* <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
                        <p className="text-muted-foreground">
                            Connect with your team, share updates, and stay engaged
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <Button onClick={() => setIsCreateEventOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Event
                        </Button>
                        <Button onClick={() => setIsCreatePollOpen(true)} variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Create Poll
                        </Button>
                    </div>
                </div> */}
                <CommonNavbar
                    title="Community"
                    rightContent={
                        <>
                            <Button variant="packPrimary" onClick={() => setIsCreateEventOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                            <Button variant="packSecondary" onClick={() => setIsCreatePollOpen(true)}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Create Poll
                            </Button>
                        </>
                    }
                    mobilePopoverContent={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="packOutline">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                    <Button onClick={() => setIsCreateEventOpen(true)} variant="ghost" className="justify-start">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Event
                                    </Button>
                                    <Button onClick={() => setIsCreatePollOpen(true)} variant="ghost" className="justify-start">
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Create Poll
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                />

                {/* Stats Cards */}
                <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-3 sm:p-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium">Total Members</CardTitle>
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="text-lg sm:text-2xl font-bold">{userCount}</div>
                            <p className="text-xs text-muted-foreground">
                                Active community members
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="p-3 sm:p-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium">Active Polls</CardTitle>
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="text-lg sm:text-2xl font-bold">{pollCount}</div>
                            <p className="text-xs text-muted-foreground">
                                Ongoing discussions
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="p-3 sm:p-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium">Comments</CardTitle>
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="text-lg sm:text-2xl font-bold">{commentCount}</div>
                            <p className="text-xs text-muted-foreground">
                                Community engagement
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="p-3 sm:p-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Events</CardTitle>
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="text-lg sm:text-2xl font-bold">
                                {feedPosts.filter(post => post.type === "event").length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Scheduled activities
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Feed */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Recent Activity</h2>
                        <Button variant="packOutline" size="sm" onClick={() => refetchFeed()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {feedPosts.map((post) => (
                            <Card key={post.id} className="overflow-hidden">
                                <CardContent className="p-6">
                                    {/* Post Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback className="bg-accent text-accent-foreground">
                                                    {post.author?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{post.author?.name || 'Unknown User'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'just now'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={post.type === "event" ? "default" : "secondary"}>
                                            {post.type === "event" ? "Event" : "Poll"}
                                        </Badge>
                                    </div>

                                    {/* Post Content */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                                        <p className="text-muted-foreground">{post.content}</p>

                                        {/* Event-specific details */}
                                        {post.type === "event" && 'eventDetails' in post && post.eventDetails && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-medium">Date:</span> {post.eventDetails.date
                                                            ? formatInTimeZone(post.eventDetails.date, (post.eventDetails.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone), { year: 'numeric', month: '2-digit', day: '2-digit' })
                                                            : ''}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Time:</span>{" "}
                                                        {post.eventDetails.time
                                                            ? post.eventDetails.time
                                                            : "–"}
                                                        {post.eventDetails.endTime && (
                                                            <>
                                                                {" "}–{" "}
                                                                {post.eventDetails.endTime}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Location:</span> {post.eventDetails.location}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">RSVPs:</span> {'rsvps' in post ? post.rsvps || 0 : 0}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="font-medium">Timezone:</span> {post.eventDetails.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Poll-specific details */}
                                        {post.type === "poll" && 'options' in post && post.options && Array.isArray(post.options) && (
                                            <div className="mt-3 space-y-2">
                                                {/* Poll end time display */}
                                                {'endsAt' in post && post.endsAt && (
                                                    <div className="p-2 bg-blue-50 rounded-lg text-sm">
                                                        <span className="font-medium">Poll ends:</span> {formatDistanceToNow(new Date(post.endsAt), { addSuffix: true })}
                                                        {new Date(post.endsAt) < new Date() && (
                                                            <span className="ml-2 text-red-600 font-medium">(Closed)</span>
                                                        )}
                                                    </div>
                                                )}
                                                {post.options.map((option: any) => {
                                                    const totalVotes = post.options?.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0) || 0;
                                                    const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
                                                    const hasVoted = 'userVote' in post && post.userVote?.optionId === option.id;
                                                    const userHasVotedOnPoll = 'userVote' in post && post.userVote !== null;
                                                    const isThisOptionLoading = votingOption?.pollId === post.id && votingOption?.optionId === option.id;
                                                    const isAnyOptionLoading = votingOption?.pollId === post.id;
                                                    const isPollExpired = 'endsAt' in post && post.endsAt && new Date(post.endsAt) < new Date();

                                                    return (
                                                        <div key={option.id} className="relative">
                                                            <button
                                                                onClick={() => handleVote(post.id, option.id)}
                                                                disabled={isAnyOptionLoading || isPollExpired}
                                                                title={
                                                                    isPollExpired
                                                                        ? "This poll has ended"
                                                                        : hasVoted
                                                                            ? "Your current choice (click to change)"
                                                                            : userHasVotedOnPoll
                                                                                ? "Click to change your vote to this option"
                                                                                : "Click to vote for this option"
                                                                }
                                                                className={`group w-full p-3 text-left rounded-lg border transition-all duration-200 ${isPollExpired
                                                                    ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                                                                    : hasVoted
                                                                        ? 'bg-accent/20 border-accent/30 ring-2 ring-accent/20'
                                                                        : isAnyOptionLoading && !isThisOptionLoading
                                                                            ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                                                                            : isThisOptionLoading
                                                                                ? 'bg-accent/10 border-accent/20 animate-pulse'
                                                                                : userHasVotedOnPoll
                                                                                    ? 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                                                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{option.optionText}</span>
                                                                        {hasVoted && (
                                                                            <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                                                                                Your Vote
                                                                            </span>
                                                                        )}
                                                                        {isThisOptionLoading && (
                                                                            <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {option.votes || 0} votes ({percentage}%)
                                                                        </span>
                                                                        {userHasVotedOnPoll && !hasVoted && !isAnyOptionLoading && !isPollExpired && (
                                                                            <span className="text-xs text-blue-600 hidden group-hover:inline">
                                                                                Click to change
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full transition-all duration-300 ${isThisOptionLoading ? 'bg-gradient-to-r from-accent/80 to-accent' : 'bg-accent'
                                                                            }`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleLike(post.id, post.type as "event" | "poll")}
                                            className={post.userHasLiked ? "text-accent" : ""}
                                            disabled={likingPost?.postId === post.id}
                                        >
                                            {likingPost?.postId === post.id ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <ThumbsUp className="h-4 w-4 mr-1" />
                                            )}
                                            {post.likes || 0}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-1" />
                                            {post.comments || 0}
                                        </Button>

                                        {post.type === "event" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRSVP(post.id)}
                                                className={'userHasRSVPd' in post && post.userHasRSVPd ? "text-green-600" : ""}
                                            >
                                                <Calendar className="h-4 w-4 mr-1" />
                                                RSVP
                                            </Button>
                                        )}

                                        {/* Delete button for admins or post creators */}
                                        {(isAdmin || post.createdByClerkUserId === currentUserId) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => post.type === "poll" ? handleDeletePoll(post.id) : handleDeleteEvent(post.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        )}

                                        <Button variant="ghost" size="sm">
                                            <Share2 className="h-4 w-4 mr-1" />
                                            Share
                                        </Button>
                                    </div>

                                    {/* Comments Section */}
                                    {activeCommentPost === post.id && (
                                        <div className="space-y-4 pt-4 border-t">
                                            {postComments.map((comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">YU</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="bg-gray-100 rounded-lg p-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-sm">{comment.user?.name || 'Unknown User'}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }) : 'just now'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-700">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Comment */}
                                            <div className="flex gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">YU</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-2">
                                                    <Textarea
                                                        placeholder="Write a comment..."
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        className="min-h-[60px]"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="packPrimary"
                                                            onClick={() => handleComment(post.id, post.type as "event" | "poll")}
                                                            disabled={!newComment.trim() || commentingPost?.postId === post.id}
                                                        >
                                                            {commentingPost?.postId === post.id ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Posting...
                                                                </>
                                                            ) : (
                                                                "Comment"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            <CreateEventDialog
                isOpen={isCreateEventOpen}
                onClose={() => setIsCreateEventOpen(false)}
                onCreateEvent={handleCreateEvent}
                showCommunityFeatures={false}
            />

            <CreatePollDialog
                isOpen={isCreatePollOpen}
                onClose={() => setIsCreatePollOpen(false)}
                onCreatePoll={handleCreatePoll}
            />

            <RSVPDialog
                isOpen={isRSVPDialogOpen}
                onClose={() => setIsRSVPDialogOpen(false)}
                onRSVP={handleRSVPSubmit}
                eventTitle={selectedEventTitle}
                currentStatus={
                    selectedEventId
                        ? (feedPosts.find(post => post.id === selectedEventId && post.type === "event"))?.userRSVPStatus || null
                        : null
                }
            />
        </>
    )
}
