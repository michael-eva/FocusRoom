import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Plus, X, BarChart3 } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"
import { useScrollLock } from "~/hooks/use-scroll-lock"

interface CreatePollDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreatePoll: (pollData: any) => void
}

export function CreatePollDialog({ isOpen, onClose, onCreatePoll }: CreatePollDialogProps) {
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        options: ["", ""],
    })

    // Lock scroll when dialog is open
    useScrollLock(isOpen)

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
                    <DialogTitleWrapper>Create Poll</DialogTitleWrapper>
                </DialogHeaderWrapper>

                <div className="flex-1 overflow-y-auto px-6">
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
                                className="min-h-[60px]"
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
                                        <Button type="button" variant="packOutline" size="icon" onClick={() => removeOption(index)} className="flex-shrink-0">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            {formData.options.length < 6 && (
                                <Button type="button" variant="packOutline" onClick={addOption} className="w-full bg-transparent">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                </Button>
                            )}
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                            <BarChart3 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-green-800">
                                Community members can vote once and see results immediately after voting.
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
                        disabled={!formData.title || validOptions.length < 2}
                        className="bg-accent hover:bg-accent/90 min-w-[120px]"
                    >
                        Create Poll
                    </Button>
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    )
}
