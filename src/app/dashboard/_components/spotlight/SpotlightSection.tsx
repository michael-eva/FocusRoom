"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Heart, MessageSquare, ExternalLink, Music, MapPin, Calendar, Users, Play } from "lucide-react"
import { SpotlightManagementDialog } from "./SpotlightManagementDialog"
import { api } from "~/trpc/react"

interface SpotlightSectionProps {
    isAdmin?: boolean
}

export function SpotlightSection({ isAdmin = false }: SpotlightSectionProps) {
    const [isManagementOpen, setIsManagementOpen] = useState(false)

    const { data: spotlight, refetch: refetchCurrent } = api.spotlight.getCurrent.useQuery()
    const { data: previousSpotlights, refetch: refetchPrevious } = api.spotlight.getPrevious.useQuery()

    const handleLike = () => {
        // This would be a mutation in a real app
        console.log("Liking spotlight")
    }

    const handleUpdateSpotlight = (newSpotlight: any) => {
        // This would be a mutation in a real app
        console.log("Updating spotlight with:", newSpotlight)
        setIsManagementOpen(false)
        void refetchCurrent()
        void refetchPrevious()
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

    if (!spotlight || !previousSpotlights) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* Current Spotlight */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <CardTitle className="text-lg">Featured {spotlight.type === "musician" ? "Musician" : "Venue"}</CardTitle>
                            <Badge variant="secondary">Spotlight</Badge>
                        </div>
                        {isAdmin && (
                            <Button variant="outline" size="sm" onClick={() => setIsManagementOpen(true)}>
                                Manage Spotlight
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
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
                                        <p className="text-2xl font-bold text-orange-600">{spotlight.stats.monthlyListeners}</p>
                                        <p className="text-sm text-gray-600">Monthly Listeners</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-600">{spotlight.stats.followers}</p>
                                        <p className="text-sm text-gray-600">Followers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-600">{spotlight.stats.upcomingShows}</p>
                                        <p className="text-sm text-gray-600">Upcoming Shows</p>
                                    </div>
                                </div>
                            )}

                            {/* External Links */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-800">Connect & Listen</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {spotlight.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            className={`justify-start text-white border-0 ${getLinkColor(link.type)}`}
                                            onClick={() => window.open(link.url, "_blank")}
                                        >
                                            {getLinkIcon(link.type)}
                                            <span className="ml-2">{link.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Engagement */}
                            <div className="flex items-center gap-4 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLike}
                                    className={spotlight.userHasLiked ? "text-red-600" : ""}
                                >
                                    <Heart className={`h-4 w-4 mr-1 ${spotlight.userHasLiked ? "fill-current" : ""}`} />
                                    {spotlight.likes}
                                </Button>

                                <Button variant="ghost" size="sm">
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    {spotlight.comments}
                                </Button>

                                <div className="ml-auto text-sm text-gray-500">
                                    Featured since {new Date(spotlight.featuredSince).toLocaleDateString()}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {previousSpotlights.map((item) => (
                            <div key={item.id} className="group cursor-pointer">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                                    <img
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                </div>
                                <h4 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                                    {item.name}
                                </h4>
                                <p className="text-sm text-gray-600">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Featured {new Date(item.featuredDate).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <SpotlightManagementDialog
                isOpen={isManagementOpen}
                onClose={() => setIsManagementOpen(false)}
                onUpdateSpotlight={handleUpdateSpotlight}
                
            />
        </div>
    )
}
