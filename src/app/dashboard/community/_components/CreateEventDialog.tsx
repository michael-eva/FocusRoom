import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Calendar, Clock, MapPin, Link, Mail, Users } from "lucide-react"

interface CreateEventDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreateEvent: (eventData: any) => void
    showCommunityFeatures?: boolean; // New prop to show community-specific features
}

export function CreateEventDialog({
    isOpen,
    onClose,
    onCreateEvent,
    showCommunityFeatures = false,
}: CreateEventDialogProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        rsvpLink: "",
    });
    const [publishToCommunity, setPublishToCommunity] = useState(showCommunityFeatures);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title && formData.description && formData.date && formData.time) {
            onCreateEvent({
                ...formData,
                publishToCommunity: publishToCommunity,
            });

            // Reset form
            setFormData({
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                rsvpLink: "",
            });
            setPublishToCommunity(showCommunityFeatures);
            onClose();
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const defaultTime = "09:00";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {showCommunityFeatures ? "Create Community Event" : "Create New Event"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title *</Label>
                        <Input
                            id="title"
                            placeholder={showCommunityFeatures ? "e.g., Monthly Songwriters Showcase" : "e.g., Team Meeting, Workshop, Conference"}
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder={showCommunityFeatures ? "Tell the community about your event..." : "Describe your event, agenda, or what participants can expect..."}
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="min-h-[100px]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date || today}
                                    onChange={(e) => handleChange("date", e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time">Time *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time || defaultTime}
                                    onChange={(e) => handleChange("time", e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="location"
                                placeholder={showCommunityFeatures ? "e.g., The Music Room, Melbourne" : "e.g., Conference Room A, Zoom, Melbourne CBD"}
                                value={formData.location}
                                onChange={(e) => handleChange("location", e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rsvpLink">RSVP Link (optional)</Label>
                        <div className="relative">
                            <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="rsvpLink"
                                type="url"
                                placeholder="https://example.com/rsvp"
                                value={formData.rsvpLink}
                                onChange={(e) => handleChange("rsvpLink", e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Community Publishing Option */}
                    {showCommunityFeatures && (
                        <div className="space-y-3 p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h3 className="font-medium text-blue-800">Community Sharing</h3>
                            </div>

                            <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                <input
                                    type="checkbox"
                                    id="publishToCommunity"
                                    checked={publishToCommunity}
                                    onChange={(e) => setPublishToCommunity(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <Label htmlFor="publishToCommunity" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                    📢 Publish to community feed
                                </Label>
                                {publishToCommunity && (
                                    <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-100 rounded">
                                        Will notify!
                                    </span>
                                )}
                            </div>

                            {publishToCommunity && (
                                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                    ✨ Event will be posted to the community feed and email notifications sent to all members
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <p className="text-sm text-gray-700">
                            {showCommunityFeatures && publishToCommunity
                                ? "Event will be posted to the community feed and saved to your calendar."
                                : "Event will be saved to your local calendar and can be shared with team members."
                            }
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600"
                            disabled={!formData.title || !formData.description || !formData.date || !formData.time}
                        >
                            {showCommunityFeatures ? "Create Event" : "Create Event"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
