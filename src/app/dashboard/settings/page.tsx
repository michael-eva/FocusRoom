"use client"

import { useState } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Bell, User, Plus, Mail, Shield, Users, Settings, Trash2, Edit } from "lucide-react"
import { api } from "~/trpc/react"
import { formatDistanceToNow } from "date-fns"

export default function SettingsPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "moderator">("member")
  const [editingMember, setEditingMember] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // For now, we'll use project ID 1 as the default focus room
  // In the future, this would come from the current user's context or URL params
  const currentProjectId = 1

  // Get team members for the current project
  const { data: teamMembers = [], refetch: refetchTeamMembers } = api.users.getTeamMembers.useQuery(
    { projectId: currentProjectId },
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  )

  // Get admins for the current project
  const { data: admins = [] } = api.users.getByRole.useQuery(
    { projectId: currentProjectId, role: "admin" },
    {
      staleTime: 30 * 1000,
    }
  )

  // Get members for the current project
  const { data: members = [] } = api.users.getByRole.useQuery(
    { projectId: currentProjectId, role: "member" },
    {
      staleTime: 30 * 1000,
    }
  )

  // Mutations
  const inviteMutation = api.users.inviteToProject.useMutation({
    onSuccess: () => {
      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("member")
      void refetchTeamMembers()
    },
  })

  const updateRoleMutation = api.users.updateProjectRole.useMutation({
    onSuccess: () => {
      setIsEditDialogOpen(false)
      setEditingMember(null)
      void refetchTeamMembers()
    },
  })

  const removeMemberMutation = api.users.removeFromProject.useMutation({
    onSuccess: () => {
      void refetchTeamMembers()
    },
  })

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        projectId: currentProjectId,
        role: inviteRole,
        invitedBy: 1, // TODO: Get current user's team member ID
      })
    } catch (error) {
      console.error("Failed to invite user:", error)
      // You could add toast notification here
    }
  }

  const handleUpdateRole = async (newRole: "admin" | "member" | "moderator") => {
    if (!editingMember) return

    try {
      await updateRoleMutation.mutateAsync({
        projectId: currentProjectId,
        teamMemberId: editingMember.id,
        role: newRole,
      })
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }

  const handleRemoveMember = async (teamMemberId: number) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) return

    try {
      await removeMemberMutation.mutateAsync({
        projectId: currentProjectId,
        teamMemberId,
      })
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "moderator":
        return "bg-blue-100 text-blue-800"
      case "member":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "moderator":
        return <Users className="h-4 w-4" />
      case "member":
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold text-gray-800">Team Settings</h1>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-2xl font-bold text-gray-900">Invite New Member</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-2">
                <div className="mb-6">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Assign Role
                  </Label>
                  <div className="space-y-3">
                    {[
                      {
                        value: "member" as const,
                        label: "Member",
                        description: "Can view and participate in events",
                        icon: <User className="h-5 w-5 text-green-600" />,
                        color: "border-green-500 bg-green-50 hover:bg-green-100",
                        selected: "ring-2 ring-green-500 border-green-500 bg-green-100",
                      },
                      {
                        value: "moderator" as const,
                        label: "Moderator",
                        description: "Can manage events and moderate content",
                        icon: <Users className="h-5 w-5 text-blue-600" />,
                        color: "border-blue-400 bg-blue-50 hover:bg-blue-100",
                        selected: "ring-2 ring-blue-400 border-blue-400 bg-blue-100",
                      },
                      {
                        value: "admin" as const,
                        label: "Admin",
                        description: "Full access to manage team and settings",
                        icon: <Shield className="h-5 w-5 text-red-600" />,
                        color: "border-red-400 bg-red-50 hover:bg-red-100",
                        selected: "ring-2 ring-red-400 border-red-400 bg-red-100",
                      },
                    ].map(option => {
                      const isSelected = inviteRole === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`w-full flex items-center gap-3 rounded-xl border transition-all px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSelected ? option.selected : option.color}`}
                          onClick={() => setInviteRole(option.value)}
                        >
                          <span className="flex-shrink-0">{option.icon}</span>
                          <span className="flex flex-col flex-1">
                            <span className={`font-semibold text-base ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{option.label}</span>
                            <span className="text-sm text-gray-500">{option.description}</span>
                          </span>
                          {isSelected && (
                            <Badge className="ml-2 bg-white text-green-600 border border-green-500">Selected</Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="px-6 pt-4 pb-6 flex flex-col sm:flex-row gap-3 border-t bg-gray-50 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                  className="flex-1 py-2 text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  className="flex-1 py-2 text-base font-semibold shadow-md bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {inviteMutation.isPending ? "Inviting..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{admins.length}</p>
                <p className="text-sm text-gray-600">Admins</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-gray-600">Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Pending Invites</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-orange-500 text-white">
                          {member.name?.split(' ').map(n => n[0]).join('') || member.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {member.name || member.email || 'Unknown'}
                          </h3>
                          <Badge className={getRoleColor(member.projectRole || 'member')}>
                            {getRoleIcon(member.projectRole || 'member')}
                            <span className="ml-1 capitalize">{member.projectRole || 'member'}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{member.email || 'No email'}</p>
                        {member.joinedAt && (
                          <p className="text-xs text-gray-500">
                            Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMember(member)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => member.id && handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No team members yet</p>
                    <p className="text-sm">Invite your first member to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Member Role</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            {editingMember && (
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  {editingMember.name || editingMember.email || 'Unknown Member'}
                </h3>
              </div>
            )}
            <div className="space-y-3">
              {[
                {
                  value: "member" as const,
                  label: "Member",
                  description: "Can view and participate in events",
                  icon: <User className="h-5 w-5 text-green-600" />,
                  color: "border-green-500 bg-green-50 hover:bg-green-100",
                  selected: "ring-2 ring-green-500 border-green-500 bg-green-100",
                },
                {
                  value: "moderator" as const,
                  label: "Moderator",
                  description: "Can manage events and moderate content",
                  icon: <Users className="h-5 w-5 text-blue-600" />,
                  color: "border-blue-400 bg-blue-50 hover:bg-blue-100",
                  selected: "ring-2 ring-blue-400 border-blue-400 bg-blue-100",
                },
                {
                  value: "admin" as const,
                  label: "Admin",
                  description: "Full access to manage team and settings",
                  icon: <Shield className="h-5 w-5 text-red-600" />,
                  color: "border-red-400 bg-red-50 hover:bg-red-100",
                  selected: "ring-2 ring-red-400 border-red-400 bg-red-100",
                },
              ].map(option => {
                const isSelected = editingMember?.projectRole === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full flex items-center gap-3 rounded-xl border transition-all px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSelected ? option.selected : option.color}`}
                    onClick={() => handleUpdateRole(option.value)}
                    disabled={updateRoleMutation.isPending}
                  >
                    <span className="flex-shrink-0">{option.icon}</span>
                    <span className="flex flex-col flex-1">
                      <span className={`font-semibold text-base ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{option.label}</span>
                      <span className="text-sm text-gray-500">{option.description}</span>
                    </span>
                    {isSelected && (
                      <Badge className="ml-2 bg-white text-green-600 border border-green-500">Current</Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 flex flex-col sm:flex-row gap-3 border-t bg-gray-50 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1 py-2 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1 py-2 text-base font-semibold shadow-md bg-orange-500 hover:bg-orange-600 text-white"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 