import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
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
  Globe
} from "lucide-react"
import { api } from "~/trpc/react"

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
  const [commentContent, setCommentContent] = useState("")

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
    onSuccess: () => {
      // Refetch comments
      setCommentContent("")
    },
  })

  const toggleLike = api.likes.toggleLike.useMutation({
    onSuccess: () => {
      // Refetch spotlight to get updated like count
    },
  })

  // Check if current user has liked
  const { data: userHasLiked = false } = api.likes.checkUserLiked.useQuery(
    {
      userId: 1, // TODO: Get actual user ID from auth context
      targetId: spotlight?.id || 0,
      targetType: "spotlight",
    },
    {
      enabled: !!spotlight?.id && isOpen,
      refetchOnWindowFocus: false,
    }
  )

  const handleLike = () => {
    if (spotlight) {
      // TODO: Get actual user ID from auth context
      const userId = 1 // Placeholder
      toggleLike.mutate({
        userId,
        targetId: spotlight.id,
        targetType: "spotlight",
      })
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
        return "bg-orange-500 hover:bg-orange-600"
      case "facebook":
        return "bg-blue-500 hover:bg-blue-600"
      case "bandcamp":
        return "bg-blue-600 hover:bg-blue-700"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Spotlight...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!spotlight) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Spotlight Not Found</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-gray-600">The requested spotlight could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Featured {spotlight.type === "musician" ? "Musician" : "Venue"}
            <Badge variant="secondary">Previous Spotlight</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <p className="text-orange-600 font-medium">{spotlight.title}</p>

                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
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

              {/* Stats */}
              {spotlight.stats && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {spotlight.stats.monthlyListeners || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">Monthly Listeners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {spotlight.stats.followers || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {spotlight.stats.upcomingShows || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">Upcoming Shows</div>
                  </div>
                </div>
              )}

              {/* External Links */}
              {spotlight.links && spotlight.links.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">External Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {spotlight.links.map((link: any, index: number) => (
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
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
                  variant={userHasLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className={userHasLiked ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Heart className={`h-4 w-4 mr-2 ${userHasLiked ? "fill-current" : ""}`} />
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
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (commentContent.trim() && spotlight) {
                          createComment.mutate({
                            userId: 1, // TODO: Get actual user ID from auth context
                            targetId: spotlight.id,
                            targetType: "spotlight",
                            content: commentContent.trim(),
                          })
                        }
                      }}
                      disabled={!commentContent.trim()}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-medium text-sm">
                              {comment.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-800">
                                {comment.user?.name || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt || new Date()).toLocaleDateString()}
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
      </DialogContent>
    </Dialog>
  )
} 