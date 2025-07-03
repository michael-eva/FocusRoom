"use client"

import { useState } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Textarea } from "~/components/ui/textarea"
import { Bell, User, Plus, Calendar, MessageSquare, ThumbsUp, Share2, BarChart3, Users, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CreatePollDialog } from "./_components/CreatePollDialog"
import { useCreatePoll } from "~/hooks/useCreatePoll";
import { CreateEventDialog } from "./_components/CreateEventDialog"

// Sample community feed data
const feedPosts = [
    {
        id: 1,
        type: "event",
        author: {
            name: "Pack Music Admin",
            avatar: "PA",
            role: "admin",
        },
        title: "Songwriters Showcase - February Edition",
        content:
            "Join us for our monthly songwriters showcase! This is a great opportunity to share your original music and connect with fellow musicians.",
        eventDetails: {
            date: "2025-02-15",
            time: "7:00 PM",
            location: "The Music Room, Melbourne",
            rsvpLink: "https://example.com/rsvp",
        },
        createdAt: new Date("2025-01-10T10:00:00"),
        likes: 24,
        comments: 8,
        rsvps: 45,
        userHasLiked: false,
        userHasRSVPd: false,
    },
    {
        id: 2,
        type: "poll",
        author: {
            name: "Sarah Johnson",
            avatar: "SJ",
            role: "member",
        },
        title: "Best venue for our next open mic night?",
        content:
            "Help us choose the perfect venue for our upcoming open mic night. We're looking for a place with good acoustics and a welcoming atmosphere.",
        pollOptions: [
            { id: 1, text: "The Corner Hotel", votes: 12 },
            { id: 2, text: "Northcote Social Club", votes: 8 },
            { id: 3, text: "The Tote", votes: 15 },
            { id: 4, text: "Cherry Bar", votes: 6 },
        ],
        createdAt: new Date("2025-01-12T14:30:00"),
        likes: 18,
        comments: 12,
        totalVotes: 41,
        userHasVoted: false,
    },
    {
        id: 3,
        type: "announcement",
        author: {
            name: "Mike Chen",
            avatar: "MC",
            role: "moderator",
        },
        title: "New collaboration space available!",
        content:
            "We've secured a new rehearsal space in Fitzroy that's available for member bookings. It's equipped with a full PA system, drums, and amps. Contact us to book your session!",
        createdAt: new Date("2025-01-14T09:15:00"),
        likes: 31,
        comments: 15,
    },
]

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
    const [posts, setPosts] = useState(feedPosts)
    const [comments, setComments] = useState(sampleComments)
    const [newComment, setNewComment] = useState("")
    const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null)
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)

    const handleLike = (postId: number) => {
        setPosts(
            posts.map((post: any) =>
                post.id === postId
                    ? { ...post, likes: post.userHasLiked ? post.likes - 1 : post.likes + 1, userHasLiked: !post.userHasLiked }
                    : post,
            ),
        )
    }

    const handleRSVP = (postId: number) => {
        setPosts(
            posts.map((post: any) =>
                post.id === postId && post.type === "event"
                    ? { ...post, rsvps: post.userHasRSVPd ? post.rsvps - 1 : post.rsvps + 1, userHasRSVPd: !post.userHasRSVPd }
                    : post,
            ),
        )

        // Simulate email confirmation
        const post = posts.find((p) => p.id === postId)
        if (post && post.type === "event") {
            alert(
                `RSVP confirmation email sent! You're ${post.userHasRSVPd ? "no longer registered" : "registered"} for "${post.title}"`,
            )
        }
    }

    const handleVote = (postId: number, optionId: number) => {
        setPosts(
            posts.map((post: any) => {
                if (post.id === postId && post.type === "poll" && !post.userHasVoted) {
                    const updatedOptions = post.pollOptions.map((option: any) =>
                        option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
                    )
                    return {
                        ...post,
                        pollOptions: updatedOptions,
                        totalVotes: post.totalVotes + 1,
                        userHasVoted: true,
                    }
                }
                return post
            }),
        )
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
            setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post)))
            setNewComment("")
            setActiveCommentPost(null)
        }
    }

    const handleCreateEvent = (eventData: any) => {
        const newPost = {
            id: posts.length + 1,
            type: "event" as const,
            author: {
                name: "Pack Music Admin",
                avatar: "PA",
                role: "admin" as const,
            },
            title: eventData.title,
            content: eventData.description,
            eventDetails: {
                date: eventData.date,
                time: eventData.time,
                location: eventData.location,
                rsvpLink: eventData.rsvpLink || "#",
            },
            createdAt: new Date(),
            likes: 0,
            comments: 0,
            rsvps: 0,
            userHasLiked: false,
            userHasRSVPd: false,
        }
        setPosts([newPost, ...posts])

        // Simulate email notification to community
        alert("Event announcement published! Email notifications sent to all community members.")
    }

    const { createPoll } = useCreatePoll();

    const handleCreatePoll = (pollData: any) => {
        const newPost = createPoll(pollData);
        setPosts([newPost, ...posts]);
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
                                <p className="text-2xl font-bold">12</p>
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
                        {posts.map((post) => (
                            <Card key={post.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-orange-500 text-white">{post.author.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-800">{post.author.name}</h3>
                                                <Badge variant={post.author.role === "admin" ? "default" : "secondary"}>
                                                    {post.author.role}
                                                </Badge>
                                                <span className="text-sm text-gray-500">
                                                    {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-800 mt-1">{post.title}</h2>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{post.content}</p>

                                    {/* Event Details */}
                                    {post.type === "event" && post.eventDetails && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">Date & Time</p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(post.eventDetails.date).toLocaleDateString()} at {post.eventDetails.time}
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
                                                        <p className="text-sm text-gray-600">{post.rsvps} attending</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Poll Options */}
                                    {post.type === "poll" && post.pollOptions && (
                                        <div className="space-y-3">
                                            {post.pollOptions.map((option) => {
                                                const percentage = post.totalVotes > 0 ? (option.votes / post.totalVotes) * 100 : 0
                                                return (
                                                    <div key={option.id} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <Button
                                                                variant={post.userHasVoted ? "secondary" : "outline"}
                                                                className="flex-1 justify-start"
                                                                onClick={() => !post.userHasVoted && handleVote(post.id, option.id)}
                                                                disabled={post.userHasVoted}
                                                            >
                                                                {option.text}
                                                            </Button>
                                                            <span className="text-sm text-gray-600 ml-2">{option.votes} votes</span>
                                                        </div>
                                                        {post.userHasVoted && (
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
                                            <p className="text-sm text-gray-600 text-center">Total votes: {post.totalVotes}</p>
                                        </div>
                                    )}

                                    {/* Post Actions */}
                                    <div className="flex items-center gap-4 pt-4 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleLike(post.id)}
                                            className={post.userHasLiked ? "text-orange-600" : ""}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            {post.likes}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-1" />
                                            {post.comments}
                                        </Button>

                                        {post.type === "event" && (
                                            <Button
                                                variant={post.userHasRSVPd ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleRSVP(post.id)}
                                                className={post.userHasRSVPd ? "bg-green-600 hover:bg-green-700" : ""}
                                            >
                                                <Users className="h-4 w-4 mr-1" />
                                                {post.userHasRSVPd ? "RSVP'd" : "RSVP"}
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
            />

            <CreatePollDialog
                isOpen={isCreatePollOpen}
                onClose={() => setIsCreatePollOpen(false)}
                onCreatePoll={handleCreatePoll}
            />
        </>
    )
}
