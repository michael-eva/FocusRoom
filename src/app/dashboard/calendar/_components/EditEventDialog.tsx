import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Calendar, Clock, MapPin, Link, Mail, CalendarPlus, Edit } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"

interface LocalEvent {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    startDateTime: string;
    endDateTime: string;
    allDay: boolean | null;
    rsvpLink: string | null;
    createdById: number | null;
    createdAt: string | null;
    updatedAt: string | null;
    userRSVP?: {
        id: number;
        eventId: number;
        userId: number;
        status: "attending" | "maybe" | "declined";
        createdAt: string;
        updatedAt: string;
    } | null;
}

interface EditEventDialogProps {
    event: LocalEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateEvent: (eventData: any) => void;
}

export function EditEventDialog({
    event,
    isOpen,
    onClose,
    onUpdateEvent,
}: EditEventDialogProps) {
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        rsvpLink: "",
    });

    // Populate form data when event changes
    useEffect(() => {
        if (event) {
            // Format date for HTML input (YYYY-MM-DD)
            const eventDate = new Date(event.startDateTime).toISOString().split('T')[0] || '';

            // Format time for HTML input (HH:mm)
            const eventTime = new Date(event.startDateTime).toTimeString().split(' ')[0]?.slice(0, 5) || '00:00';

            setFormData({
                title: event.title,
                description: event.description || "",
                date: eventDate,
                time: eventTime,
                location: event.location || "",
                rsvpLink: event.rsvpLink || "",
            });
        }
    }, [event]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title && formData.date && formData.time && event) {
            onUpdateEvent({
                id: event.id,
                ...formData,
            });
            onClose();
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

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
        className: "sm:max-w-lg"
    };

    if (!event) return null;

    return (
        <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
                <DialogHeaderWrapper>
                    <DialogTitleWrapper className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Event
                    </DialogTitleWrapper>
                </DialogHeaderWrapper>

                <form id="edit-event-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Team Meeting, Workshop, Conference"
                                value={formData.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your event, agenda, or what participants can expect..."
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                className="min-h-[100px]"
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
                                        value={formData.date}
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
                                        value={formData.time}
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
                                    placeholder="e.g., Conference Room A, Zoom, Melbourne CBD"
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

                        {/* Event Status Info */}
                        <div className="space-y-3 p-4 rounded-lg border-2 bg-gray-50 border-gray-200">
                            <div className="flex items-center gap-2">
                                <CalendarPlus className="h-5 w-5 text-gray-600" />
                                <h3 className="font-medium text-gray-800">Event Status</h3>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                                    📋 This is a local FocusRoom event.
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <p className="text-sm text-blue-800">
                                Changes will be saved immediately to your local calendar.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 p-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="edit-event-form"
                        className="flex-1"
                    >
                        Save Changes
                    </Button>
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    );
}
