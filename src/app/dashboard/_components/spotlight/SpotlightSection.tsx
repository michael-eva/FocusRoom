"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Heart, MessageSquare, ExternalLink, Music, MapPin, Calendar, Users, Play, Loader2 } from "lucide-react"
import { SpotlightManagementDialog, type SpotlightFormData } from "./SpotlightManagementDialog"
import { SpotlightViewDialog } from "./SpotlightViewDialog"
import { api } from "~/trpc/react"
import { useUser } from "@clerk/nextjs"

interface SpotlightSectionProps {
    isAdmin?: boolean
}

export function SpotlightSection({ isAdmin = false }: SpotlightSectionProps) {
    const [isManagementOpen, setIsManagementOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [selectedSpotlightId, setSelectedSpotlightId] = useState<number | null>(null)
    const [commentContent, setCommentContent] = useState("")
    const [isLiking, setIsLiking] = useState(false)
    const [isCommenting, setIsCommenting] = useState(false)

    const { data: spotlight, refetch: refetchCurrent } = api.spotlight.getCurrent.useQuery(undefined, {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 30000, // 30 seconds
    })
    const { data: previousSpotlights, refetch: refetchPrevious } = api.spotlight.getPrevious.useQuery(undefined, {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 60000, // 1 minute
    })
    const { user } = useUser();
    const currentUserId = user?.id || "";

    // Get tRPC utils for invalidation
    const utils = api.useUtils()

    // Mutations
    const createSpotlight = api.spotlight.create.useMutation({
        onSuccess: () => {
            // When creating a new spotlight, we need to refetch everything
            // because the current spotlight will be moved to previous

            void refetchPrevious()
        },
    })



    const toggleLike = api.likes.toggleLike.useMutation({
        onSuccess: async () => {
            // Invalidate queries to refetch updated data
            await utils.spotlight.getCurrent.invalidate()
            await utils.likes.checkUserLiked.invalidate({
                clerkUserId: currentUserId,
                spotlightId: spotlight?.id || 0,
            })
        },
    })

    // Comments - only fetch when we have a spotlight
    const { data: comments = [] } = api.comments.getComments.useQuery(
        {
            targetId: spotlight?.id || 0,
            targetType: "spotlight",
            limit: 10,
        },
        {
            enabled: !!spotlight?.id,
            refetchOnWindowFocus: false,
        }
    )

    const createComment = api.comments.createComment.useMutation({
        onSuccess: async () => {
            // Invalidate queries to refetch updated data
            await utils.spotlight.getCurrent.invalidate()
            await utils.comments.getComments.invalidate({
                targetId: spotlight?.id || 0,
                targetType: "spotlight",
                limit: 10,
            })
        },
    })

    // Check if current user has liked - only fetch when we have a spotlight
    const { data: userHasLiked = false } = api.likes.checkUserLiked.useQuery(
        {
            clerkUserId: currentUserId,
            spotlightId: spotlight?.id || 0,
        },
        {
            enabled: !!spotlight?.id,
            refetchOnWindowFocus: false,
        }
    )

    const handleLike = async () => {
        if (spotlight) {
            setIsLiking(true)
            try {
                // Use the new API directly with spotlightId
                await toggleLike.mutateAsync({
                    clerkUserId: currentUserId,
                    spotlightId: spotlight.id,
                })
            } catch (error) {
                console.error("Failed to toggle like:", error);
            } finally {
                setIsLiking(false)
            }
        }
    }

    const handleUpdateSpotlight = (newSpotlight: SpotlightFormData) => {
        createSpotlight.mutate({
            ...newSpotlight,
            createdByClerkUserId: currentUserId,
        })
        setIsManagementOpen(false)
    }

    const handleViewSpotlight = (spotlightId: number) => {
        setSelectedSpotlightId(spotlightId)
        setIsViewOpen(true)
    }

    const handleCloseView = () => {
        setIsViewOpen(false)
        setSelectedSpotlightId(null)
    }

    const getLinkIcon = (type: string) => {
        switch (type) {
            case "spotify":
                return <Music className="h-4 w-4" />
            case "youtube":
                return <Play className="h-4 w-4" />
            case "instagram":
                return <Users className="h-4 w-4" />
            default:
                return <ExternalLink className="h-4 w-4" />
        }
    }

    const getLinkColor = (type: string) => {
        switch (type) {
            case "spotify":
                return "bg-green-500 hover:bg-green-600"
            case "youtube":
                return "bg-red-500 hover:bg-red-600"
            case "instagram":
                return "bg-pink-500 hover:bg-pink-600"
            default:
                return "bg-blue-500 hover:bg-blue-600"
        }
    }

    if (!spotlight && !previousSpotlights) {
        return <div>Loading...</div>
    }

    if (!spotlight) {
        return (
            <div className="space-y-6">
                <Card className="overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                                <CardTitle className="text-lg">Featured Spotlight</CardTitle>
                                <Badge variant="secondary">Spotlight</Badge>
                            </div>
                            {isAdmin && (
                                <Button variant="packOutline" size="sm" onClick={() => setIsManagementOpen(true)}>
                                    Create Spotlight
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="text-center py-8 sm:py-12">
                        <div className="space-y-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Music className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Current Spotlight</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4">
                                    There&apos;s no featured artist or venue at the moment.
                                </p>
                                {isAdmin && (
                                    <Button
                                        onClick={() => setIsManagementOpen(true)}
                                        variant="packPrimary"
                                        className="text-sm sm:text-base"
                                    >
                                        Create New Spotlight
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {previousSpotlights && previousSpotlights.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Previous Spotlights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {previousSpotlights?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group cursor-pointer"
                                        onClick={() => handleViewSpotlight(item.id)}
                                    >
                                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                                            <img
                                                src={item.image || "/placeholder.svg"}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        </div>
                                        <h4 className="font-semibold text-gray-800 group-hover:text-accent transition-colors">
                                            {item.name}
                                        </h4>
                                        <p className="text-sm text-gray-600">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Featured {item.featuredDate ? new Date(item.featuredDate).toLocaleDateString() : "Recently"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <SpotlightManagementDialog
                    isOpen={isManagementOpen}
                    onClose={() => setIsManagementOpen(false)}
                    onUpdateSpotlight={handleUpdateSpotlight}
                />

                <SpotlightViewDialog
                    isOpen={isViewOpen}
                    onClose={handleCloseView}
                    spotlightId={selectedSpotlightId}
                />
            </div>
        )
    }

    return (
        <div key={spotlight?.id || 'no-spotlight'} className="space-y-6">
            {/* Current Spotlight */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                            <CardTitle className="text-lg">Featured {spotlight.type === "musician" ? "Musician" : "Venue"}</CardTitle>
                            <Badge variant="secondary">Spotlight</Badge>
                        </div>
                        {isAdmin && (
                            <Button variant="packOutline" size="sm" onClick={() => setIsManagementOpen(true)}>
                                Edit Spotlight
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        {/* Image and Basic Info */}
                        <div className="space-y-4">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={spotlight.image || "/placeholder.svg"}
                                    alt={spotlight.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-800">{spotlight.name}</h3>
                                <p className="text-accent font-medium">{spotlight.title}</p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-600">
                                    {spotlight.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {spotlight.location}
                                        </div>
                                    )}
                                    {spotlight.established && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Since {spotlight.established}
                                        </div>
                                    )}
                                </div>

                                {spotlight.genre && <Badge variant="outline">{spotlight.genre}</Badge>}
                            </div>
                        </div>

                        {/* Description and Details */}
                        <div className="lg:col-span-2 space-y-4">
                            <p className="text-gray-700 leading-relaxed">{spotlight.description}</p>
                            {Boolean(spotlight.stats && typeof spotlight.stats === 'object' && spotlight.stats !== null && 'monthlyListeners' in (spotlight.stats as any)) && (
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <p className="text-lg sm:text-2xl font-bold text-accent">{(spotlight.stats as any).monthlyListeners}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">Monthly Listeners</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg sm:text-2xl font-bold text-accent">{(spotlight.stats as any).followers}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">Followers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg sm:text-2xl font-bold text-accent">{(spotlight.stats as any).upcomingShows}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">Upcoming Shows</p>
                                    </div>
                                </div>
                            )}

                            {/* External Links */}
                            {Array.isArray(spotlight.links) && spotlight.links.filter(link => !!link.url).length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-800">Connect & Listen</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                        {spotlight.links
                                            .filter(link => !!link.url)
                                            .map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    className={`justify-start text-white border-0 ${getLinkColor(link.type)} text-sm sm:text-base`}
                                                    onClick={() => window.open(link.url, "_blank")}
                                                >
                                                    {getLinkIcon(link.type)}
                                                    <span className="ml-2">{link.label}</span>
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Engagement */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-4 border-t">
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLike}
                                        className={userHasLiked ? "text-red-600" : ""}
                                        disabled={isLiking}
                                    >
                                        {isLiking ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : (
                                            <Heart className={`h-4 w-4 mr-1 ${userHasLiked ? "fill-current" : ""}`} />
                                        )}
                                        {spotlight.likes}
                                    </Button>

                                    <Button variant="ghost" size="sm">
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        {comments?.length || 0}
                                    </Button>
                                </div>

                                <div className="text-sm text-gray-500 sm:ml-auto">
                                    Featured since {spotlight.featuredSince ? new Date(spotlight.featuredSince).toLocaleDateString() : "Recently"}
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-semibold text-gray-800">Comments</h4>

                                {/* Comment Form */}
                                <div className="space-y-2">
                                    <textarea
                                        placeholder="Share your thoughts..."
                                        className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                                        rows={3}
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                if (commentContent.trim() && spotlight && currentUserId) {
                                                    setIsCommenting(true)
                                                    try {
                                                        await createComment.mutateAsync({
                                                            clerkUserId: currentUserId,
                                                            spotlightId: spotlight.id,
                                                            content: commentContent.trim(),
                                                        })
                                                        setCommentContent('')
                                                    } catch (error) {
                                                        console.error("Failed to create comment:", error);
                                                    } finally {
                                                        setIsCommenting(false)
                                                    }
                                                }
                                            }}
                                            disabled={!commentContent.trim() || isCommenting}
                                            className="bg-accent hover:bg-accent/90 text-sm sm:text-base"
                                        >
                                            {isCommenting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Posting...
                                                </>
                                            ) : (
                                                "Post Comment"
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3">
                                    {comments?.map((comment) => (
                                        <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground text-sm font-medium flex-shrink-0">
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                                        <span className="font-medium text-gray-800 text-sm">
                                                            {comment.user?.name || 'Anonymous'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : "Recently"}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(!comments || comments.length === 0) && (
                                        <p className="text-gray-500 text-center py-4 text-sm">
                                            No comments yet. Be the first to share your thoughts!
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Previous Spotlights */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Previous Spotlights</CardTitle>
                </CardHeader>
                <CardContent>
                    {previousSpotlights && previousSpotlights.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {previousSpotlights.map((item) => (
                                <div
                                    key={item.id}
                                    className="group cursor-pointer"
                                    onClick={() => handleViewSpotlight(item.id)}
                                >
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2 sm:mb-3">
                                        <img
                                            src={item.image || "/placeholder.svg"}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                    <h4 className="font-semibold text-gray-800 group-hover:text-accent transition-colors text-sm sm:text-base">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600">{item.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Featured {item.featuredDate ? new Date(item.featuredDate).toLocaleDateString() : "Recently"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 sm:py-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                <Music className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm sm:text-base">No previous spotlights yet.</p>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">Previous featured artists and venues will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <SpotlightManagementDialog
                isOpen={isManagementOpen}
                onClose={() => setIsManagementOpen(false)}
                onUpdateSpotlight={handleUpdateSpotlight}
            />

            <SpotlightViewDialog
                isOpen={isViewOpen}
                onClose={handleCloseView}
                spotlightId={selectedSpotlightId}
            />
        </div>
    )
}
