"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Mail, Calendar, User, X } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"
import { useScrollLock } from "~/hooks/use-scroll-lock"

interface TaskAssignmentDialogProps {
    isOpen: boolean
    onClose: () => void
    task: any
    teamMembers: any[]
    onAssign: (taskId: number, assignees: any[], deadline: string) => void
}

export function TaskAssignmentDialog({ isOpen, onClose, task, teamMembers, onAssign }: TaskAssignmentDialogProps) {
    const [selectedAssignees, setSelectedAssignees] = useState<any[]>([])
    const [deadline, setDeadline] = useState("")
    const isMobile = useIsMobile()

    // Lock scroll when dialog is open
    useScrollLock(isOpen)

    // Initialize with currently assigned users when dialog opens
    useEffect(() => {
        if (isOpen && task) {
            // Get currently assigned users
            const assigneeIds = (task.assigneeClerkUserIds as string[]) || [];
            const currentAssignees = assigneeIds
                .map(id => teamMembers.find(member => member.id === id))
                .filter(Boolean);

            setSelectedAssignees(currentAssignees);

            // Set current deadline if it exists
            setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] || "" : "");
        }
    }, [isOpen, task, teamMembers]);

    const handleAssign = () => {
        if (selectedAssignees.length > 0 && deadline && task) {
            onAssign(task.id, selectedAssignees, deadline)
            onClose()
        }
    }

    const toggleAssignee = (member: any) => {
        setSelectedAssignees(prev => {
            const isSelected = prev.some(a => a.id === member.id)
            if (isSelected) {
                return prev.filter(a => a.id !== member.id)
            } else {
                return [...prev, member]
            }
        })
    }

    const removeAssignee = (memberId: string) => {
        setSelectedAssignees(prev => prev.filter(a => a.id !== memberId))
    }

    if (!task) return null

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
        className: "max-h-[95vh] overflow-hidden flex flex-col"
    } : {
        className: "sm:max-w-md"
    };

    return (
        <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
                <DialogHeaderWrapper className={`${isMobile ? "px-4 pt-4 pb-2" : "px-6 pt-6 pb-2"}`}>
                    <DialogTitleWrapper className={`${isMobile ? "text-xl" : "text-2xl"} font-semibold flex items-center gap-2`}>
                        <User className="h-5 w-5" />
                        Assign Task
                    </DialogTitleWrapper>
                </DialogHeaderWrapper>

                <div className={`${isMobile ? "flex-1 overflow-y-auto px-4 pb-4" : "px-6 pb-6"} space-y-6`}>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                        {task.description && (
                            <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                    </div>

                    {/* Currently Assigned Users */}
                    {selectedAssignees.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Currently Assigned</Label>
                            <div className="space-y-2">
                                {selectedAssignees.map((assignee) => {
                                    const displayName = assignee.fullName || `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.primaryEmailAddress?.emailAddress || assignee.emailAddresses?.[0]?.emailAddress;
                                    const avatarInitial = assignee.firstName?.charAt(0) || assignee.primaryEmailAddress?.emailAddress?.charAt(0) || "?";

                                    return (
                                        <div key={assignee.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6">
                                                    <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">
                                                        {avatarInitial}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{displayName}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAssignee(assignee.id)}
                                                className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Available Team Members */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            {selectedAssignees.length > 0 ? "Add More Team Members" : "Assign to (select multiple)"}
                        </Label>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                            {teamMembers
                                .filter((member) => member.id != null && !selectedAssignees.some(a => a.id === member.id))
                                .map((member, index) => {
                                    const displayName = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.primaryEmailAddress?.emailAddress || member.emailAddresses?.[0]?.emailAddress;
                                    const avatarInitial = member.firstName?.charAt(0) || member.primaryEmailAddress?.emailAddress?.charAt(0) || "?";

                                    return (
                                        <div key={`${member.id}-${index}`} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => toggleAssignee(member)}>
                                            <Checkbox
                                                checked={false}
                                                onChange={() => undefined}
                                            />
                                            <Avatar className="w-6 h-6">
                                                <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">
                                                    {avatarInitial}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{displayName}</span>
                                        </div>
                                    );
                                })}
                        </div>
                        {teamMembers.filter((member) => member.id != null && !selectedAssignees.some(a => a.id === member.id)).length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-2">All team members are already assigned</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">Deadline</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="h-10 pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Email notification</p>
                            <p className="text-xs text-blue-700">An email will be sent to notify the assignees</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={onClose} className="h-10 px-4">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={selectedAssignees.length === 0 || !deadline}
                            className="bg-orange-500 hover:bg-orange-600 h-10 px-6"
                        >
                            {selectedAssignees.length > 0 ? "Update Assignment" : "Assign Task"}
                        </Button>
                    </div>
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    )
}
