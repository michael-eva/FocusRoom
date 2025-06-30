"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Plus, X, BarChart3 } from "lucide-react"

interface CreatePollDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreatePoll: (pollData: any) => void
}

export function CreatePollDialog({ isOpen, onClose, onCreatePoll }: CreatePollDialogProps) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        options: ["", ""],
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const validOptions = formData.options.filter((option) => option.trim() !== "")
        if (formData.title && formData.description && validOptions.length >= 2) {
            onCreatePoll({
                ...formData,
                options: validOptions,
            })
            setFormData({
                title: "",
                description: "",
                options: ["", ""],
            })
            onClose()
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options]
        newOptions[index] = value
        setFormData((prev) => ({ ...prev, options: newOptions }))
    }

    const addOption = () => {
        if (formData.options.length < 6) {
            setFormData((prev) => ({ ...prev, options: [...prev.options, ""] }))
        }
    }

    const removeOption = (index: number) => {
        if (formData.options.length > 2) {
            const newOptions = formData.options.filter((_, i) => i !== index)
            setFormData((prev) => ({ ...prev, options: newOptions }))
        }
    }

    const validOptions = formData.options.filter((option) => option.trim() !== "")

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Poll</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Poll Question *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., What's the best venue for our next event?"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide more context for your poll..."
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Poll Options *</Label>
                        {formData.options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    className="flex-1"
                                />
                                {formData.options.length > 2 && (
                                    <Button type="button" variant="outline" size="icon" onClick={() => removeOption(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        {formData.options.length < 6 && (
                            <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-green-800">
                            Community members can vote once and see results immediately after voting.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600"
                            disabled={!formData.title || validOptions.length < 2}
                        >
                            Create Poll
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
