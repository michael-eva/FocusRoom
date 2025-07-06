"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
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
    const [selectedAssignee, setSelectedAssignee] = useState<any>(null)
    const [deadline, setDeadline] = useState("")

    const handleAssign = () => {
        if (selectedAssignee && deadline && task) {
            onAssign(task.id, selectedAssignee, deadline)
            onClose()
            setSelectedAssignee(null)
            setDeadline("")
        }
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
                        <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">Assign to</Label>
                        <Select
                            onValueChange={(value) => {
                                const member = teamMembers.find((m) => m.id?.toString() === value)
                                setSelectedAssignee(member)
                            }}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id?.toString() || ""}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                                <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">
                                                    {member.avatar || (member.name?.charAt(0) || "?")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{member.name || member.email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            disabled={!selectedAssignee || !deadline}
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
