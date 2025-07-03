"use client"

import type React from "react"

import { useState } from "react"

interface Link {
    type: string;
    url: string;
    label: string;
}

interface FormData {
    type: string;
    name: string;
    title: string;
    description: string;
    image: string;
    location: string;
    genre: string;
    established: string;
    links: Link[];
    stats: {
        monthlyListeners: string;
        followers: string;
        upcomingShows: string;
    };
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Plus, X, Upload, Music, MapPin } from "lucide-react"

interface SpotlightManagementDialogProps {
    isOpen: boolean
    onClose: () => void
    onUpdateSpotlight: (spotlight: any) => void
}

export function SpotlightManagementDialog({
    isOpen,
    onClose,
    onUpdateSpotlight,
}: SpotlightManagementDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        type: "musician",
        name: "",
        title: "",
        description: "",
        image: "/placeholder.svg?height=300&width=300",
        location: "",
        genre: "",
        established: "",
        links: [{ type: "spotify", url: "", label: "" }],
        stats: {
            monthlyListeners: "",
            followers: "",
            upcomingShows: "",
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.name && formData.title && formData.description) {
            onUpdateSpotlight(formData)
            onClose()
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleStatsChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            stats: { ...prev.stats, [field]: value },
        }))
    }

    const handleLinkChange = (index: number, field: string, value: string) => {
        const newLinks = [...formData.links]
        newLinks[index] = { ...newLinks[index], [field]: value } as Link;
        setFormData((prev) => ({ ...prev, links: newLinks }));
    }

    const addLink = () => {
        if (formData.links.length < 6) {
            setFormData((prev) => ({
                ...prev,
                links: [...prev.links, { type: "website", url: "", label: "" }],
            }))
        }
    }

    const removeLink = (index: number) => {
        if (formData.links.length > 1) {
            const newLinks = formData.links.filter((_, i) => i !== index)
            setFormData((prev) => ({ ...prev, links: newLinks }))
        }
    }

    const linkTypes = [
        { value: "spotify", label: "Spotify" },
        { value: "youtube", label: "YouTube" },
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
        { value: "website", label: "Website" },
        { value: "bandcamp", label: "Bandcamp" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Spotlight Feature</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div className="space-y-2">
                        <Label>Spotlight Type</Label>
                        <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="musician">Musician/Artist</SelectItem>
                                <SelectItem value="venue">Venue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder={formData.type === "musician" ? "Artist/Band Name" : "Venue Name"}
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title/Genre *</Label>
                            <Input
                                id="title"
                                placeholder={formData.type === "musician" ? "e.g., Indie Folk Singer" : "e.g., Live Music Venue"}
                                value={formData.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Featured Image</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                <img src={formData.image || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <Button type="button" variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">Recommended: Square image, at least 300x300px</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell the community about this featured artist or venue..."
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="min-h-[100px]"
                            required
                        />
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="location"
                                    placeholder="City, State"
                                    value={formData.location}
                                    onChange={(e) => handleChange("location", e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="genre">Genre/Type</Label>
                            <Input
                                id="genre"
                                placeholder={formData.type === "musician" ? "Music Genre" : "Venue Type"}
                                value={formData.genre}
                                onChange={(e) => handleChange("genre", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="established">Established</Label>
                            <Input
                                id="established"
                                placeholder="Year"
                                value={formData.established}
                                onChange={(e) => handleChange("established", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stats (for musicians) */}
                    {formData.type === "musician" && (
                        <div className="space-y-3">
                            <Label>Statistics (Optional)</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyListeners">Monthly Listeners</Label>
                                    <Input
                                        id="monthlyListeners"
                                        placeholder="e.g., 12.5K"
                                        value={formData.stats.monthlyListeners}
                                        onChange={(e) => handleStatsChange("monthlyListeners", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="followers">Followers</Label>
                                    <Input
                                        id="followers"
                                        placeholder="e.g., 8.2K"
                                        value={formData.stats.followers}
                                        onChange={(e) => handleStatsChange("followers", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="upcomingShows">Upcoming Shows</Label>
                                    <Input
                                        id="upcomingShows"
                                        placeholder="e.g., 3"
                                        value={formData.stats.upcomingShows}
                                        onChange={(e) => handleStatsChange("upcomingShows", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* External Links */}
                    <div className="space-y-3">
                        <Label>External Links</Label>
                        {formData.links.map((link, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2">
                                <div className="col-span-3">
                                    <Select value={link.type} onValueChange={(value) => handleLinkChange(index, "type", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {linkTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-4">
                                    <Input
                                        placeholder="URL"
                                        value={link.url}
                                        onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                                    />
                                </div>
                                <div className="col-span-4">
                                    <Input
                                        placeholder="Display Label"
                                        value={link.label}
                                        onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    {formData.links.length > 1 && (
                                        <Button type="button" variant="outline" size="icon" onClick={() => removeLink(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {formData.links.length < 6 && (
                            <Button type="button" variant="outline" onClick={addLink} className="w-full bg-transparent">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Link
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <Music className="h-4 w-4 text-orange-600" />
                        <p className="text-sm text-orange-800">
                            This spotlight will be featured on the dashboard and community feed to drive engagement.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600"
                            disabled={!formData.name || !formData.title || !formData.description}
                        >
                            Update Spotlight
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
