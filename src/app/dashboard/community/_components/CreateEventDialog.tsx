import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Calendar, Clock, MapPin, Link, Mail, Users } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"
import { useScrollLock } from "~/hooks/use-scroll-lock"

interface CreateEventDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreateEvent: (eventData: EventFormData) => void
    showCommunityFeatures?: boolean;
}

export interface EventFormData {
    title: string;
    description: string;
    date: string | undefined;
    startTime: string;
    endTime: string;
    location: string;
    rsvpLink: string;
}

export function CreateEventDialog({
    isOpen,
    onClose,
    onCreateEvent,
    showCommunityFeatures = false,
}: CreateEventDialogProps) {
    const isMobile = useIsMobile();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const defaultStartTime = new Date().toTimeString().split(' ')[0]?.slice(0, 5) || '00:00';
    const defaultEndTime = new Date(now.getTime() + (60 * 60 * 1000)).toTimeString().split(' ')[0]?.slice(0, 5) || '01:00';
    const [formData, setFormData] = useState<EventFormData>({
        title: "",
        description: "",
        date: today,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        location: "",
        rsvpLink: "",
    });
    const [publishToCommunity, setPublishToCommunity] = useState(showCommunityFeatures);

    // Lock scroll when dialog is open
    useScrollLock(isOpen)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title && formData.description && formData.date && formData.startTime && formData.endTime) {
            onCreateEvent({
                ...formData
            });

            // Reset form
            setFormData({
                title: "",
                description: "",
                date: "",
                startTime: "",
                endTime: "",
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

    // Use consistent component selection to prevent layout shifts
    const DialogWrapper = isMobile ? Sheet : Dialog;
    const DialogContentWrapper = isMobile ? SheetContent : DialogContent;
    const DialogHeaderWrapper = isMobile ? SheetHeader : DialogHeader;
    const DialogTitleWrapper = isMobile ? SheetTitle : DialogTitle;

    const dialogProps = {
        open: isOpen,
        onOpenChange: onClose,
    };

    const contentProps = isMobile ? {
        side: "bottom" as const,
        className: "max-h-[95vh] overflow-hidden flex flex-col w-full"
    } : {
        className: "overflow-hidden flex flex-col max-w-lg w-full"
    };

    return (
        <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
                <DialogHeaderWrapper>
                    <DialogTitleWrapper>
                        {showCommunityFeatures ? "Create Community Event" : "Create New Event"}
                    </DialogTitleWrapper>
                </DialogHeaderWrapper>

                <div className="flex-1 overflow-y-auto px-6">
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
                                className="min-h-[60px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time *</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={formData.startTime || defaultStartTime}
                                        onChange={(e) => handleChange("startTime", e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time *</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={formData.endTime || defaultEndTime}
                                        onChange={(e) => handleChange("endTime", e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
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
                            <div className="space-y-3 p-3 rounded-lg border-2 bg-blue-50 border-blue-200">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <h3 className="font-medium text-blue-800 text-sm">Community Sharing</h3>
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
                            <Mail className="h-4 w-4 text-gray-600 flex-shrink-0" />
                            <p className="text-xs text-gray-700">
                                {showCommunityFeatures && publishToCommunity
                                    ? "Event will be posted to the community feed and saved to your calendar."
                                    : "Event will be saved to your local calendar and can be shared with team members."
                                }
                            </p>
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-2 py-4 border-t px-6 bg-white">
                    <Button type="button" variant="packOutline" onClick={onClose} className="min-w-[80px]">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="packPrimary"
                        disabled={!formData.title}
                        className="min-w-[120px]"
                    >
                        {/* {isSubmitting ? "Creating..." : "Create Event"} */}
                        Create Event
                    </Button>
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    )
}
