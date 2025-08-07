"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Mail, Calendar, User } from "lucide-react"

interface TaskAssignmentDialogProps {
    isOpen: boolean
    onClose: () => void
    task: any
    teamMembers: any[]
    onAssign: (taskId: number, assignee: any, deadline: string) => void
}

export function TaskAssignmentDialog({ isOpen, onClose, task, teamMembers, onAssign }: TaskAssignmentDialogProps) {
    const [selectedAssignees, setSelectedAssignees] = useState<any[]>([])
    const [deadline, setDeadline] = useState("")

    const handleAssign = () => {
        if (selectedAssignees.length > 0 && deadline && task) {
            onAssign(task.id, selectedAssignees, deadline)
            onClose()
            setSelectedAssignees([])
            setDeadline("")
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

    if (!task) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Assign Task
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                        {task.description && (
                            <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Assign to (select multiple)</Label>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                            {teamMembers
                                .filter((member) => member.id != null)
                                .map((member, index) => {
                                    const displayName = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.primaryEmailAddress?.emailAddress || member.emailAddresses?.[0]?.emailAddress;
                                    const avatarInitial = member.firstName?.charAt(0) || member.primaryEmailAddress?.emailAddress?.charAt(0) || "?";
                                    const isSelected = selectedAssignees.some(a => a.id === member.id);
                                    
                                    return (
                                        <div key={`${member.id}-${index}`} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => toggleAssignee(member)}>
                                            <Checkbox 
                                                checked={isSelected}
                                                onChange={() => {}}
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
                        {selectedAssignees.length > 0 && (
                            <div className="text-xs text-gray-600">
                                Selected: {selectedAssignees.map(a => a.fullName || a.firstName || a.primaryEmailAddress?.emailAddress).join(', ')}
                            </div>
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
                            <p className="text-xs text-blue-700">An email will be sent to notify the assignee</p>
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
                            Assign Task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
