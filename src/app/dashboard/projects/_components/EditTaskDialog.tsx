"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/use-mobile"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Edit, Calendar, User, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

interface EditTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  task: any
  teamMembers: any[]
  onUpdate: (taskId: number, data: any) => void
  isLoading?: boolean
}

export function EditTaskDialog({ isOpen, onClose, task, teamMembers, onUpdate, isLoading = false }: EditTaskDialogProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as "pending" | "in-progress" | "completed" | "overdue",
    priority: "medium" as "low" | "medium" | "high",
    deadline: "",
    assigneeId: "none",
  })

  // Prevent hydration errors by only mounting on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title ?? "",
        description: task.description ?? "",
        status: (task.status as "pending" | "in-progress" | "completed" | "overdue") ?? "pending",
        priority: (task.priority as "low" | "medium" | "high") ?? "medium",
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] || "" : "",
        assigneeId: task.assigneeId ? task.assigneeId.toString() : "none",
      })
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onUpdate(task.id, formData)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "low":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

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
    className: "max-h-[95vh] overflow-y-auto flex flex-col"
  } : {
    className: "max-h-[90vh] overflow-y-auto flex flex-col sm:max-w-md"
  };

  if (!task || !mounted) return null

  return (
    <DialogWrapper {...dialogProps}>
      <DialogContentWrapper {...contentProps}>
        <DialogHeaderWrapper>
          <DialogTitleWrapper className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit className="h-5 w-5" />
            Edit Task
          </DialogTitleWrapper>
        </DialogHeaderWrapper>

        <div className="flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be done"
                rows={3}
                className="resize-none text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "pending" | "in-progress" | "completed" | "overdue") =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" sideOffset={4} position="popper">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" sideOffset={4} position="popper">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="h-10 sm:h-11 pl-10 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">Assignee</Label>
              <Select
                value={formData.assigneeId || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="none">No assignee</SelectItem>
                  {teamMembers?.map((member, index) => {
                    // Use stable ID - try member ID first, then clerki ID as fallback
                    const memberId = member.id?.toString() || member.clerkUserId || `member-${index}`;
                    const memberName = member.user?.firstName && member.user?.lastName 
                      ? `${member.user.firstName} ${member.user.lastName}`
                      : member.user?.emailAddresses?.[0]?.emailAddress 
                      || member.name 
                      || member.email 
                      || 'Unknown User';
                    
                    // Skip if no valid ID (prevents empty string values)
                    if (!memberId || memberId === '' || memberId === 'undefined') return null;
                    
                    return (
                      <SelectItem key={`member-${member.id || member.clerkUserId || index}`} value={memberId}>
                        <div className="flex items-center gap-2">
                          <span>{memberName}</span>
                        </div>
                      </SelectItem>
                    );
                  }) || []}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t px-6 pb-4">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 sm:h-11 px-4 text-sm sm:text-base">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!formData.title || isLoading}
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 h-10 sm:h-11 px-6 text-sm sm:text-base"
          >
            {isLoading ? "Updating..." : "Update Task"}
          </Button>
        </div>
      </DialogContentWrapper>
    </DialogWrapper>
  )
} 