"use client"

import { useState, useCallback } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Textarea } from "~/components/ui/textarea"
import { Bell, User, Plus, Calendar, MessageSquare, ThumbsUp, Share2, BarChart3, Users, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CreatePollDialog } from "./_components/CreatePollDialog"
import { CreateEventDialog } from "./_components/CreateEventDialog"
import { RSVPDialog } from "./_components/RSVPDialog"
import { api } from "~/trpc/react"

// Sample comments data (keeping this for now)

const sampleComments = [
    {
        id: 1,
        postId: 1,
        author: { name: "Emma Wilson", avatar: "EW" },
        content: "Can't wait for this! Will there be an open mic portion?",
        createdAt: new Date("2025-01-10T11:30:00"),
    },
    {
        id: 2,
        postId: 1,
        author: { name: "David Lee", avatar: "DL" },
        content: "Already RSVP'd! See you all there 🎵",
        createdAt: new Date("2025-01-10T15:45:00"),
    },
]

export default function CommunityPage() {
    const [comments, setComments] = useState(sampleComments)
    const [newComment, setNewComment] = useState("")
    const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
    const [isRSVPDialogOpen, setIsRSVPDialogOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
    const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")

    // Get feed data from database
    const { data: feedPosts = [], refetch: refetchFeed } = api.feed.getFeed.useQuery(
        {
            limit: 20,
            userId: 1, // TODO: Replace with actual user ID from auth
        },
        {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000, // 15 minutes
        }
    );

    // API mutations
    const createLocalEvent = api.events.create.useMutation();
    const createPoll = api.polls.create.useMutation();
    const votePoll = api.polls.vote.useMutation();
    const createRSVP = api.rsvp.create.useMutation();

    const handleLike = (postId: number) => {
        // TODO: Implement like system
        console.log("Like functionality to be implemented");
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
                userId: 1, // TODO: Replace with actual user ID from auth
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
        try {
            await votePoll.mutateAsync({
                pollId: postId,
                optionId: optionId,
                userId: 1, // TODO: Replace with actual user ID from auth
            });

            // Refresh the feed to show updated vote counts
            await refetchFeed();
        } catch (error) {
            console.error("Failed to vote:", error);
            alert("You have already voted on this poll or there was an error.");
        }
    }

    const handleComment = (postId: number) => {
        if (newComment.trim()) {
            const comment = {
                id: comments.length + 1,
                postId,
                author: { name: "You", avatar: "YU" },
                content: newComment,
                createdAt: new Date(),
            }
            setComments([...comments, comment])
            setNewComment("")
            setActiveCommentPost(null)
        }
    }

    const handleCreateEvent = useCallback(async (eventData: any) => {
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

            // Refresh the feed
            await refetchFeed();

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
    }, [createLocalEvent, refetchFeed]);

    const handleCreatePoll = async (pollData: any) => {
        try {
            await createPoll.mutateAsync({
                title: pollData.title,
                content: pollData.description,
                options: pollData.options,
                createdById: 1, // Default user ID - replace with actual user ID from auth
            });

            // Refresh the feed
            await refetchFeed();

            alert("Poll created successfully!");
        } catch (error) {
            console.error("Failed to create poll:", error);
            alert("Failed to create poll. Please try again.");
        }
    }

    const getPostComments = (postId: number) => {
        return comments.filter((comment) => comment.postId === postId)
    }

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold text-gray-800">Community Feed</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setIsCreatePollOpen(true)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Create Poll
                    </Button>
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

            {/* Main Content */}
            <main className="flex-1 p-6 bg-gray-50">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Community Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                                <p className="text-2xl font-bold">247</p>
                                <p className="text-sm text-gray-600">Members</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Calendar className="h-6 w-6 mx-auto mb-2 text-green-500" />
                                <p className="text-2xl font-bold">{feedPosts.filter(post => post.type === 'event').length}</p>
                                <p className="text-sm text-gray-600">Events This Month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                                <p className="text-2xl font-bold">89</p>
                                <p className="text-sm text-gray-600">Active Discussions</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <Mail className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                                <p className="text-2xl font-bold">156</p>
                                <p className="text-sm text-gray-600">Email Subscribers</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Feed Posts */}
                    <div className="space-y-6">
                        {feedPosts.map((post) => (
                            <Card key={post.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-orange-500 text-white">
                                                {post.author?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-800">{post.author?.name || 'Unknown User'}</h3>
                                                <Badge variant="secondary">
                                                    {post.author?.name === 'Pack Music Admin' ? 'admin' : 'member'}
                                                </Badge>
                                                <span className="text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-800 mt-1">{post.title}</h2>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{post.content}</p>

                                    {/* Event Details */}
                                    {post.type === "event" && 'eventDetails' in post && post.eventDetails && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">Date & Time</p>
                                                        <p className="text-sm text-gray-600">
                                                            {post.eventDetails.date ? new Date(post.eventDetails.date).toLocaleDateString() : 'TBD'} at {post.eventDetails.time || 'TBD'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Location</p>
                                                    <p className="text-sm text-gray-600">{post.eventDetails.location}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">RSVPs</p>
                                                        <p className="text-sm text-gray-600">{'rsvps' in post ? post.rsvps : 0} attending</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RSVP Status Indicator */}
                                            {'userHasRSVPd' in post && post.userHasRSVPd && (
                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700">Your RSVP:</span>
                                                        <Badge
                                                            variant={
                                                                (post as any).userRSVPStatus === "attending"
                                                                    ? "default"
                                                                    : (post as any).userRSVPStatus === "maybe"
                                                                        ? "secondary"
                                                                        : "destructive"
                                                            }
                                                            className={
                                                                (post as any).userRSVPStatus === "attending"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : (post as any).userRSVPStatus === "maybe"
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-red-100 text-red-800"
                                                            }
                                                        >
                                                            {(post as any).userRSVPStatus === "attending"
                                                                ? "Attending"
                                                                : (post as any).userRSVPStatus === "maybe"
                                                                    ? "Maybe"
                                                                    : "Not Attending"
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Poll Options */}
                                    {post.type === "poll" && 'pollOptions' in post && post.pollOptions && (
                                        <div className="space-y-3">
                                            {post.pollOptions.map((option) => {
                                                const totalVotes = 'totalVotes' in post ? post.totalVotes : 0;
                                                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                                                const userVotedForThis = 'userVotedOptionId' in post && post.userVotedOptionId === option.id;
                                                return (
                                                    <div key={option.id} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <Button
                                                                variant={
                                                                    'userHasVoted' in post && post.userHasVoted
                                                                        ? userVotedForThis
                                                                            ? "default"
                                                                            : "secondary"
                                                                        : "outline"
                                                                }
                                                                className={`flex-1 justify-start ${userVotedForThis ? "bg-orange-500 hover:bg-orange-600" : ""
                                                                    }`}
                                                                onClick={() => !('userHasVoted' in post && post.userHasVoted) && handleVote(post.id, option.id)}
                                                                disabled={'userHasVoted' in post && post.userHasVoted}
                                                            >
                                                                {option.text}
                                                                {userVotedForThis && (
                                                                    <Badge className="ml-2 bg-white text-orange-600 text-xs">
                                                                        Your Vote
                                                                    </Badge>
                                                                )}
                                                            </Button>
                                                            <span className="text-sm text-gray-600 ml-2">{option.votes} votes</span>
                                                        </div>
                                                        {'userHasVoted' in post && post.userHasVoted && (
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                            <p className="text-sm text-gray-600 text-center">Total votes: {'totalVotes' in post ? post.totalVotes : 0}</p>
                                        </div>
                                    )}

                                    {/* Post Actions */}
                                    <div className="flex items-center gap-4 pt-4 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleLike(post.id)}
                                            className={'userHasLiked' in post && post.userHasLiked ? "text-orange-600" : ""}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            {'likes' in post ? post.likes : 0}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-1" />
                                            {'comments' in post ? post.comments : 0}
                                        </Button>

                                        {post.type === "event" && (
                                            <Button
                                                variant={'userHasRSVPd' in post && post.userHasRSVPd ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleRSVP(post.id)}
                                                className={
                                                    'userHasRSVPd' in post && post.userHasRSVPd
                                                        ? post.userRSVPStatus === "attending"
                                                            ? "bg-green-600 hover:bg-green-700"
                                                            : post.userRSVPStatus === "maybe"
                                                                ? "bg-yellow-600 hover:bg-yellow-700"
                                                                : "bg-red-600 hover:bg-red-700"
                                                        : ""
                                                }
                                            >
                                                <Users className="h-4 w-4 mr-1" />
                                                {'userHasRSVPd' in post && post.userHasRSVPd
                                                    ? post.userRSVPStatus === "attending"
                                                        ? "Attending"
                                                        : post.userRSVPStatus === "maybe"
                                                            ? "Maybe"
                                                            : "Not Attending"
                                                    : "RSVP"
                                                }
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
                                            {getPostComments(post.id).map((comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                                                            {comment.author.avatar}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="bg-gray-100 rounded-lg p-3">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-sm">{comment.author.name}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
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
                                                    <AvatarFallback className="bg-orange-500 text-white text-xs">YU</AvatarFallback>
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
                                                            onClick={() => handleComment(post.id)}
                                                            disabled={!newComment.trim()}
                                                            className="bg-orange-500 hover:bg-orange-600"
                                                        >
                                                            Comment
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
                        ? (feedPosts.find(post => post.id === selectedEventId && post.type === "event") as any)?.userRSVPStatus || null
                        : null
                }
            />
        </>
    )
}
