import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import {
  ExternalLink,
  Music,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Play,
  Users,
  Globe,
  Loader2
} from "lucide-react"
import { api } from "~/trpc/react"
import { useIsMobile } from "~/hooks/use-mobile"
import { useUser } from "@clerk/nextjs"
import type { SpotlightLink, SpotlightStats } from "~/db/types"

interface SpotlightViewDialogProps {
  isOpen: boolean
  onClose: () => void
  spotlightId: number | null
}

export function SpotlightViewDialog({
  isOpen,
  onClose,
  spotlightId,
}: SpotlightViewDialogProps) {
  const isMobile = useIsMobile();
  const [commentContent, setCommentContent] = useState("")
  const [isLiking, setIsLiking] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)

  // Get user info and tRPC utils
  const { user } = useUser();
  const currentUserId = user?.id || "";
  const utils = api.useUtils()

  // Fetch spotlight data
  const { data: spotlight, isLoading } = api.spotlight.getById.useQuery(
    { id: spotlightId || 0 },
    { enabled: !!spotlightId && isOpen }
  )

  // Comments - only fetch when we have a spotlight
  const { data: comments = [] } = api.comments.getComments.useQuery(
    {
      targetId: spotlight?.id || 0,
      targetType: "spotlight",
      limit: 10,
    },
    {
      enabled: !!spotlight?.id && isOpen,
      refetchOnWindowFocus: false,
    }
  )

  const createComment = api.comments.createComment.useMutation({
    onSuccess: async () => {
      // Invalidate queries to refetch data
      await utils.spotlight.getById.invalidate({ id: spotlightId || 0 })
      await utils.comments.getComments.invalidate({
        targetId: spotlightId || 0,
        targetType: "spotlight",
        limit: 10,
      })
      setCommentContent("")
    },
  })

  const toggleLike = api.likes.toggleLike.useMutation({
    onSuccess: async () => {
      // Invalidate queries to refetch updated data
      await utils.spotlight.getById.invalidate({ id: spotlightId || 0 })
      await utils.likes.checkUserLiked.invalidate({
        clerkUserId: currentUserId,
        spotlightId: spotlightId || 0,
      })
    },
  })

  // Check if current user has liked
  const { data: userHasLiked = false } = api.likes.checkUserLiked.useQuery(
    {
      clerkUserId: currentUserId,
      spotlightId: spotlight?.id || 0,
    },
    {
      enabled: !!spotlight?.id && isOpen && !!currentUserId,
      refetchOnWindowFocus: false,
    }
  )

  const handleLike = async () => {
    if (spotlight && currentUserId) {
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

  const getLinkIcon = (type: string) => {
    switch (type) {
      case "spotify":
        return <Music className="h-4 w-4" />
      case "youtube":
        return <Play className="h-4 w-4" />
      case "instagram":
        return <Users className="h-4 w-4" />
      case "thePack":
        return <Music className="h-4 w-4" />
      case "facebook":
        return <Users className="h-4 w-4" />
      case "bandcamp":
        return <Music className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
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
      case "thePack":
        return "bg-accent hover:bg-accent/90"
      case "facebook":
        return "bg-blue-500 hover:bg-blue-600"
      case "bandcamp":
        return "bg-blue-600 hover:bg-blue-700"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const DialogWrapper = isMobile ? Sheet : Dialog;
  const DialogContentWrapper = isMobile ? SheetContent : DialogContent;
  const DialogHeaderWrapper = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleWrapper = isMobile ? SheetTitle : DialogTitle;

  const dialogProps = isMobile ? {
    open: isOpen,
    onOpenChange: onClose,
  } : {
    open: isOpen,
    onOpenChange: onClose,
  };

  const contentProps = isMobile ? {
    side: "bottom" as const,
    className: "max-h-[95vh] overflow-hidden flex flex-col"
  } : {
    className: "sm:max-w-2xl max-h-[90vh] overflow-y-auto"
  };

  if (isLoading) {
    return (
      <DialogWrapper {...dialogProps}>
        <DialogContentWrapper {...contentProps}>
          <DialogHeaderWrapper>
            <DialogTitleWrapper>Loading Spotlight...</DialogTitleWrapper>
          </DialogHeaderWrapper>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </DialogContentWrapper>
      </DialogWrapper>
    )
  }

  if (!spotlight) {
    return (
      <DialogWrapper {...dialogProps}>
        <DialogContentWrapper {...contentProps}>
          <DialogHeaderWrapper>
            <DialogTitleWrapper>Spotlight Not Found</DialogTitleWrapper>
          </DialogHeaderWrapper>
          <div className="text-center py-12">
            <p className="text-gray-600">The requested spotlight could not be found.</p>
          </div>
        </DialogContentWrapper>
      </DialogWrapper>
    )
  }

  return (
    <DialogWrapper {...dialogProps}>
      <DialogContentWrapper {...contentProps}>
        <DialogHeaderWrapper className={isMobile ? "pb-2" : ""}>
          <DialogTitleWrapper className={`flex items-center gap-2 ${isMobile ? "text-lg" : ""}`}>
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            Featured {spotlight.type === "musician" ? "Musician" : "Venue"}
            <Badge variant="secondary">Previous Spotlight</Badge>
          </DialogTitleWrapper>
        </DialogHeaderWrapper>

        <div className={`space-y-6 ${isMobile ? "flex-1 overflow-y-auto px-4 pb-4" : ""}`}>
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
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{spotlight.name}</h3>
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
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{spotlight.description}</p>

              {/* Stats */}
              {spotlight.stats && (() => {
                const stats = typeof spotlight.stats === 'string' ? JSON.parse(spotlight.stats) : spotlight.stats;
                return (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-accent">
                        {stats.monthlyListeners || "N/A"}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Monthly Listeners</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-accent">
                        {stats.followers || "N/A"}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-accent">
                        {stats.upcomingShows || "N/A"}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Upcoming Shows</div>
                    </div>
                  </div>
                );
              })()}

              {/* External Links */}
              {Array.isArray(spotlight.links) && spotlight.links.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">External Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {spotlight.links.map((link: SpotlightLink, index: number) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${getLinkColor(link.type)}`}
                      >
                        {getLinkIcon(link.type)}
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Date */}
              <div className="text-sm text-gray-500">
                Featured: {spotlight.featuredSince ? new Date(spotlight.featuredSince).toLocaleDateString() : "Recently"}
              </div>
            </div>
          </div>

          {/* Engagement Section */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                <h4 className="font-semibold text-gray-800">Community Engagement</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {spotlight.likes} likes
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {spotlight.comments} comments
                  </div>
                </div>
              </div>

              {/* Like Button */}
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant={userHasLiked ? "packPrimary" : "packOutline"}
                  size="sm"
                  onClick={handleLike}
                  className={userHasLiked ? "bg-accent hover:bg-accent/90" : ""}
                  disabled={isLiking}
                >
                  {isLiking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-2 ${userHasLiked ? "fill-current" : ""}`} />
                  )}
                  {userHasLiked ? "Liked" : "Like"}
                </Button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-800">Comments</h5>

                {/* Add Comment */}
                <div className="space-y-2">
                  <textarea
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    rows={3}
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
                            setCommentContent("")
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
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-accent font-medium text-sm">
                              {comment.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-800">
                                {comment.user?.name || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.timestamp || new Date()).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContentWrapper>
    </DialogWrapper>
  )
}