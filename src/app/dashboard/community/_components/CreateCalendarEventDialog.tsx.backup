import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Calendar, Clock, MapPin, Link, Mail, CalendarPlus } from "lucide-react"

interface CreateEventDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreateEvent: (eventData: any) => void
    isGoogleCalendarConnected: boolean;
    handleConnectGoogleCalendar: () => void;
    handleDisconnectGoogleCalendar: () => void;
}

export function CreateEventDialog({
    isOpen,
    onClose,
    onCreateEvent,
    isGoogleCalendarConnected,
    handleConnectGoogleCalendar,
    handleDisconnectGoogleCalendar,
}: CreateEventDialogProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        rsvpLink: "",
    });
    const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(false);

    // Auto-check Google Calendar sync if connected
    useEffect(() => {
        if (isGoogleCalendarConnected) {
            setAddToGoogleCalendar(true);
        }
    }, [isGoogleCalendarConnected]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title && formData.description && formData.date && formData.time) {
            onCreateEvent({
                ...formData,
                addToGoogleCalendar: addToGoogleCalendar && isGoogleCalendarConnected,
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
            setAddToGoogleCalendar(false);
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your event, agenda, or what participants can expect..."
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

                    {/* Google Calendar Integration */}
                    <div className={`space-y-3 p-4 rounded-lg border-2 ${
                        isGoogleCalendarConnected 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-orange-50 border-orange-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <CalendarPlus className={`h-5 w-5 ${
                                isGoogleCalendarConnected ? 'text-green-600' : 'text-orange-600'
                            }`} />
                            <h3 className={`font-medium ${
                                isGoogleCalendarConnected ? 'text-green-800' : 'text-orange-800'
                            }`}>Google Calendar Sync</h3>
                        </div>
                        
                        {!isGoogleCalendarConnected ? (
                            <div className="space-y-2">
                                <p className="text-sm text-orange-700 font-medium">
                                    ⚠️ Connect Google Calendar to sync your events automatically
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleConnectGoogleCalendar}
                                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                                >
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    Connect Google Calendar Now
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm text-green-700 font-medium">
                                            ✅ Google Calendar Connected
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDisconnectGoogleCalendar}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                                
                                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                                    <input
                                        type="checkbox"
                                        id="addToGoogleCalendar"
                                        checked={addToGoogleCalendar}
                                        onChange={(e) => setAddToGoogleCalendar(e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <Label htmlFor="addToGoogleCalendar" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                        📅 Also add to Google Calendar
                                    </Label>
                                    {addToGoogleCalendar && (
                                        <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded">
                                            Will sync!
                                        </span>
                                    )}
                                </div>
                                
                                {addToGoogleCalendar && (
                                    <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                                        ✨ This event will appear in both your FocusRoom calendar and Google Calendar
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                            Events will be saved to your local calendar and can be shared with team members.
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
                            Create Event
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
