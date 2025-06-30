"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Mail } from "lucide-react"

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
                    <DialogTitle>Assign Task</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-gray-800 mb-1">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignee">Assign to</Label>
                        <Select
                            onValueChange={(value) => {
                                const member = teamMembers.find((m) => m.id.toString() === value)
                                setSelectedAssignee(member)
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                                <AvatarFallback className="bg-orange-500 text-white text-xs">{member.avatar}</AvatarFallback>
                                            </Avatar>
                                            {member.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-800">An email notification will be sent to the assignee</p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedAssignee || !deadline}
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            Assign Task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
