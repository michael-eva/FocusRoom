"use client"

import { useState } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Bell, User, Plus, Mail, Shield, Users, Settings, Trash2, Edit, MoreHorizontal } from "lucide-react"
import { api } from "~/trpc/react"
import { formatDistanceToNow } from "date-fns"
import { useUser } from "@clerk/nextjs"
import CommonNavbar from "~/app/_components/CommonNavbar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { useIsMobile } from "~/hooks/use-mobile"

export default function SettingsPage() {
  // All hooks at the top, unconditionally
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [editingMember, setEditingMember] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const currentProjectId = 1
  const user = useUser()
  const isMobile = useIsMobile();
  const { data: users, refetch: refetchUsers } = api.users.getAll.useQuery();
  const admins = users?.data.filter((user) => user.publicMetadata.role === "admin");
  const { data: pendingInvitations = [] } = api.users.getPendingInvitations.useQuery()
  const inviteMutation = api.users.inviteToProject.useMutation({
    onSuccess: () => {
      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("member")
      void refetchUsers()
    },
  })

  const updateRoleMutation = api.users.updateProjectRole.useMutation({
    onSuccess: () => {
      setIsEditDialogOpen(false)
      setEditingMember(null)
      void refetchUsers()
    },
  })

  const removeMemberMutation = api.users.removeFromProject.useMutation({
    onSuccess: () => {
      void refetchUsers()
    },
  })

  // Now you can do your early return
  if (!user.user?.id) {
    return <div>Loading...</div>
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        projectId: currentProjectId,
        role: inviteRole,
        invitedBy: user.user?.id,
      })
    } catch (error) {
      console.error("Failed to invite user:", error)
      // You could add toast notification here
    }
  }

  const handleUpdateRole = async (newRole: "admin" | "member") => {
    if (!editingMember) return

    try {
      await updateRoleMutation.mutateAsync({
        projectId: currentProjectId,
        clerkUserId: editingMember.clerkUserId,
        role: newRole,
      })
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }

  const handleRemoveMember = async (teamMemberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) return

    try {
      await removeMemberMutation.mutateAsync({
        projectId: currentProjectId,
        clerkUserId: teamMemberId,
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
      <main className="flex-1 space-y-6 p-6">
        <CommonNavbar
          title="Team Settings"
          rightContent={
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          }
          mobilePopoverContent={
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setIsInviteDialogOpen(true)} variant="ghost" className="justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          }
        />
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{users?.totalCount}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{admins?.length}</p>
                <p className="text-sm text-gray-600">Admins</p>
              </CardContent>
            </Card>
            {/* <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-gray-600">Members</p>
              </CardContent>
            </Card> */}
            <Card>
              <CardContent className="p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{pendingInvitations?.length}</p>
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
                {users?.data.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-orange-500 text-white">
                          {member.firstName?.split(' ').map(n => n[0]).join('') || member?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {member.firstName || member.emailAddresses?.[0]?.emailAddress || 'Unknown'}
                          </h3>
                          <Badge className={getRoleColor((member.publicMetadata?.role as string) || 'member')}>
                            {getRoleIcon((member.publicMetadata?.role as string) || 'member')}
                            <span className="ml-1 capitalize">{(member.publicMetadata?.role as string) || 'member'}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{member.emailAddresses?.[0]?.emailAddress || 'No email'}</p>
                        {member.createdAt && (
                          <p className="text-xs text-gray-500">
                            Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
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
                {users?.data.length === 0 && (
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
      {(() => {
        const DialogWrapper = isMobile ? Sheet : Dialog;
        const DialogContentWrapper = isMobile ? SheetContent : DialogContent;
        const DialogHeaderWrapper = isMobile ? SheetHeader : DialogHeader;
        const DialogTitleWrapper = isMobile ? SheetTitle : DialogTitle;
        const dialogProps = isMobile
          ? { open: isEditDialogOpen, onOpenChange: setIsEditDialogOpen }
          : { open: isEditDialogOpen, onOpenChange: setIsEditDialogOpen };
        const contentProps = isMobile
          ? { side: "bottom" as const, className: "max-h-[95vh] overflow-hidden flex flex-col" }
          : { className: "sm:max-w-md p-0 overflow-hidden" };
        return (
          <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
              <DialogHeaderWrapper className="px-6 pt-6 pb-2">
                <DialogTitleWrapper className="text-2xl font-bold text-gray-900">Edit Member Role</DialogTitleWrapper>
              </DialogHeaderWrapper>
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
                    // {
                    //   value: "moderator" as const,
                    //   label: "Moderator",
                    //   description: "Can manage events and moderate content",
                    //   icon: <Users className="h-5 w-5 text-blue-600" />, 
                    //   color: "border-blue-400 bg-blue-50 hover:bg-blue-100",
                    //   selected: "ring-2 ring-blue-400 border-blue-400 bg-blue-100",
                    // },
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
            </DialogContentWrapper>
          </DialogWrapper>
        );
      })()}
      {/* Invite Member Dialog */}
      {(() => {
        const DialogWrapper = isMobile ? Sheet : Dialog;
        const DialogContentWrapper = isMobile ? SheetContent : DialogContent;
        const DialogHeaderWrapper = isMobile ? SheetHeader : DialogHeader;
        const DialogTitleWrapper = isMobile ? SheetTitle : DialogTitle;
        const dialogProps = isMobile
          ? { open: isInviteDialogOpen, onOpenChange: setIsInviteDialogOpen }
          : { open: isInviteDialogOpen, onOpenChange: setIsInviteDialogOpen };
        const contentProps = isMobile
          ? { side: "bottom" as const, className: "max-h-[95vh] overflow-hidden flex flex-col" }
          : { className: "sm:max-w-md p-0 overflow-hidden" };
        return (
          <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
              <DialogHeaderWrapper className="px-6 pt-6 pb-2">
                <DialogTitleWrapper className="text-2xl font-bold text-gray-900">Invite New Member</DialogTitleWrapper>
              </DialogHeaderWrapper>
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
                      // {
                      //   value: "moderator" as const,
                      //   label: "Moderator",
                      //   description: "Can manage events and moderate content",
                      //   icon: <Users className="h-5 w-5 text-blue-600" />, 
                      //   color: "border-blue-400 bg-blue-50 hover:bg-blue-100",
                      //   selected: "ring-2 ring-blue-400 border-blue-400 bg-blue-100",
                      // },
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
            </DialogContentWrapper>
          </DialogWrapper>
        );
      })()}
    </>
  )
} 