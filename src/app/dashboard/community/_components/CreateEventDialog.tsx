"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Calendar, Clock, MapPin, Link, Mail } from "lucide-react"

interface CreateEventDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreateEvent: (eventData: any) => void
}

export function CreateEventDialog({ isOpen, onClose, onCreateEvent }: CreateEventDialogProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        rsvpLink: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.title && formData.description && formData.date && formData.time) {
            onCreateEvent(formData)
            setFormData({
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                rsvpLink: "",
            })
            onClose()
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Event Announcement</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Monthly Songwriters Showcase"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell the community about your event..."
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
                                placeholder="e.g., The Music Room, Melbourne"
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

                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                            This event will be posted to the community feed and email notifications will be sent to all members.
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
                            Publish Event
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
