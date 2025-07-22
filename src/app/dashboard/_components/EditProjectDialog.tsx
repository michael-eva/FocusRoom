"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { X, Plus, Users } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"

interface EditProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: any
  teamMembers: any[]
  onUpdate: (projectId: number, formData: any) => void
  isLoading?: boolean
}

export function EditProjectDialog({
  isOpen,
  onClose,
  project,
  teamMembers,
  onUpdate,
  isLoading = false,
}: EditProjectDialogProps) {
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning" as "draft" | "planning" | "active" | "completed" | "on-hold",
    priority: "medium" as "low" | "medium" | "high",
    deadline: "",
    teamMemberIds: [] as number[],
  })

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: (project.status as "draft" | "planning" | "active" | "completed" | "on-hold") || "planning",
        priority: (project.priority as "low" | "medium" | "high") || "medium",
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] || "" : "",
        teamMemberIds: project.teamMembers?.map((member: any) => member.id) || [],
      })
    }
  }, [project])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (project) {
      onUpdate(project.id, {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      })
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      deadline: "",
      teamMemberIds: [],
    })
    onClose()
  }

  const addTeamMember = (teamMemberId: number) => {
    if (!formData.teamMemberIds.includes(teamMemberId)) {
      setFormData(prev => ({
        ...prev,
        teamMemberIds: [...prev.teamMemberIds, teamMemberId]
      }))
    }
  }

  const removeTeamMember = (teamMemberId: number) => {
    setFormData(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.filter(id => id !== teamMemberId)
    }))
  }

  const selectedTeamMembers = teamMembers.filter(member =>
    formData.teamMemberIds.includes(member.id)
  )

  const availableTeamMembers = teamMembers.filter(member =>
    !formData.teamMemberIds.includes(member.id)
  )

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
    className: "max-w-2xl max-h-[90vh] overflow-y-auto"
  };

  return (
    <DialogWrapper {...dialogProps}>
      <DialogContentWrapper {...contentProps}>
        <DialogHeaderWrapper>
          <DialogTitleWrapper>Edit Project</DialogTitleWrapper>
        </DialogHeaderWrapper>

        <div className={isMobile ? "flex-1 overflow-y-auto px-4 pb-4" : ""}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project"
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "planning" | "active" | "completed" | "on-hold") =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
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
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="h-10"
              />
            </div>

            {/* Team Members Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Team Members</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{selectedTeamMembers.length} members</span>
                </div>
              </div>

              {/* Selected Team Members */}
              {selectedTeamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Current Members</Label>
                  <div className="space-y-2">
                    {selectedTeamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                              {member.avatar || member.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Team Members */}
              {availableTeamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Add Members</Label>
                  <div className="space-y-2">
                    {availableTeamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gray-500 text-white text-xs">
                              {member.avatar || member.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addTeamMember(member.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-green-500"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableTeamMembers.length === 0 && selectedTeamMembers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No team members available</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name || isLoading}>
                {isLoading ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContentWrapper>
    </DialogWrapper>
  )
} 