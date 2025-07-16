"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Separator } from "~/components/ui/separator"
import { ArrowLeft, Save, Plus, X, Trash2, FileText, Link as LinkIcon, Calendar, Users, Target } from "lucide-react"
import Link from "next/link"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { api } from "~/trpc/react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
  deadline: string
  assigneeId?: number
}

interface Resource {
  id: string
  title: string
  type: string
  url: string
  description: string
}

interface ProjectFormData {
  name: string
  description: string
  status: "planning" | "active" | "completed" | "on-hold"
  priority: "low" | "medium" | "high"
  deadline: string
  teamMemberIds: number[]
  tasks: Task[]
  resources: Resource[]
}

export default function NewProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    deadline: "",
    teamMemberIds: [],
    tasks: [],
    resources: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draftProjectId, setDraftProjectId] = useState<number | null>(null)

  // Get team members for selection
  const { data: teamMembers } = api.users.getAll.useQuery()

  // Get current user for project creation
  const { data: currentUser } = api.users.getAll.useQuery()
  const currentUserId = currentUser?.[0]?.id || 1

  // Track form changes
  useEffect(() => {
    const hasContent = Boolean(formData.name || formData.description || formData.tasks.length > 0 || formData.resources.length > 0)
    setHasUnsavedChanges(hasContent && !draftProjectId)
  }, [formData, draftProjectId])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const createProjectMutation = api.project.createProject.useMutation({
    onSuccess: (project) => {
      if (project) {
        toast.success("Project created successfully!")
        setHasUnsavedChanges(false)
        setDraftProjectId(null)
        router.push(`/dashboard/projects/${project.id}`)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project")
      setIsSubmitting(false)
    },
  })

  const saveDraftMutation = api.project.saveDraft.useMutation({
    onSuccess: (project) => {
      if (project) {
        toast.success("Draft saved to database!")
        setDraftProjectId(project.id)
        setHasUnsavedChanges(false)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save draft")
    },
  })

  const updateProjectMutation = api.project.updateProject.useMutation({
    onSuccess: (project) => {
      if (project) {
        toast.success("Draft updated!")
        setHasUnsavedChanges(false)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update draft")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (draftProjectId) {
        // Update existing draft to final project
        await updateProjectMutation.mutateAsync({
          projectId: draftProjectId,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          deadline: formData.deadline ? new Date(formData.deadline) : undefined,
          teamMemberIds: formData.teamMemberIds,
          tasks: formData.tasks.map(task => ({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
            assigneeId: task.assigneeId,
          })),
          resources: formData.resources.map(resource => ({
            title: resource.title,
            type: resource.type,
            url: resource.url,
            description: resource.description,
          })),
        })

        toast.success("Project created successfully!")
        setHasUnsavedChanges(false)
        setDraftProjectId(null)
        router.push(`/dashboard/projects/${draftProjectId}`)
      } else {
        // Create new project
        await createProjectMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          deadline: formData.deadline ? new Date(formData.deadline) : undefined,
          createdBy: currentUserId,
          teamMemberIds: formData.teamMemberIds,
          tasks: formData.tasks.map(task => ({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            deadline: task.deadline ? new Date(task.deadline) : undefined,
            assigneeId: task.assigneeId,
          })),
          resources: formData.resources.map(resource => ({
            title: resource.title,
            type: resource.type,
            url: resource.url,
            description: resource.description,
          })),
        })
      }
    } catch (error) {
      // Error is handled in onError callback
    }
  }

  const handleSaveDraft = () => {
    if (draftProjectId) {
      // Update existing draft
      updateProjectMutation.mutate({
        projectId: draftProjectId,
        name: formData.name || undefined,
        description: formData.description,
        status: "draft",
        priority: formData.priority,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        teamMemberIds: formData.teamMemberIds,
        tasks: formData.tasks.map(task => ({
          title: task.title || "Untitled Task",
          description: task.description,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
          assigneeId: task.assigneeId,
        })),
        resources: formData.resources.map(resource => ({
          title: resource.title || "Untitled Resource",
          type: resource.type,
          url: resource.url,
          description: resource.description,
        })),
      })
    } else {
      // Create new draft
      saveDraftMutation.mutate({
        name: formData.name || undefined,
        description: formData.description,
        status: "draft",
        priority: formData.priority,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        createdBy: currentUserId,
        teamMemberIds: formData.teamMemberIds,
        tasks: formData.tasks.map(task => ({
          title: task.title || "Untitled Task",
          description: task.description,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
          assigneeId: task.assigneeId,
        })),
        resources: formData.resources.map(resource => ({
          title: resource.title || "Untitled Resource",
          type: resource.type,
          url: resource.url,
          description: resource.description,
        })),
      })
    }
  }

  const handleClearDraft = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      deadline: "",
      teamMemberIds: [],
      tasks: [],
      resources: [],
    })
    setHasUnsavedChanges(false)
    setDraftProjectId(null)
    toast.success("Form cleared!")
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

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      deadline: "",
    }
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }))
  }

  const updateTask = (taskId: string, field: keyof Task, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }))
  }

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }))
  }

  const addResource = () => {
    const newResource: Resource = {
      id: Date.now().toString(),
      title: "",
      type: "",
      url: "",
      description: "",
    }
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, newResource]
    }))
  }

  const updateResource = (resourceId: string, field: keyof Resource, value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map(resource =>
        resource.id === resourceId ? { ...resource, [field]: value } : resource
      )
    }))
  }

  const removeResource = (resourceId: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter(resource => resource.id !== resourceId)
    }))
  }

  const selectedTeamMembers = teamMembers?.filter(member =>
    formData.teamMemberIds.includes(member.id)
  ) || []

  return (
    <>
      <header className="flex items-center justify-between p-6 border-b bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {draftProjectId ? "Edit Draft Project" : "Create New Project"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {draftProjectId ? "Continue editing your draft project" : "Set up your project with tasks, resources, and team members"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          )}
          {draftProjectId && (
            <Link href={`/dashboard/projects/${draftProjectId}`}>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Draft
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={handleClearDraft} className="text-gray-600 hover:text-gray-800">
            Clear Form
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Tabs defaultValue="basic" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 h-12 bg-white shadow-sm">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team ({formData.teamMemberIds.length})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tasks ({formData.tasks.length})
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Resources ({formData.resources.length})
                </TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900">Project Details</CardTitle>
                    <p className="text-sm text-gray-600">Define the core information for your project</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Project Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter a descriptive project name"
                        className="h-11 text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your project goals, scope, and objectives"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: "planning" | "active" | "completed" | "on-hold") =>
                            setFormData(prev => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Members */}
              <TabsContent value="team" className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-900">Team Members</CardTitle>
                    <p className="text-sm text-gray-600">Add team members who will work on this project</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Available Team Members</Label>
                      <div className="flex flex-wrap gap-2">
                        {teamMembers?.map((member) => (
                          <Button
                            key={member.id}
                            type="button"
                            variant={formData.teamMemberIds.includes(member.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => addTeamMember(member.id)}
                            disabled={formData.teamMemberIds.includes(member.id)}
                            className="h-8 px-3"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {member.name || member.email}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {selectedTeamMembers.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Selected Team Members</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedTeamMembers.map((member) => (
                              <Badge key={member.id} variant="secondary" className="flex items-center gap-1 h-8 px-3">
                                <Users className="h-3 w-3" />
                                {member.name || member.email}
                                <button
                                  type="button"
                                  onClick={() => removeTeamMember(member.id)}
                                  className="ml-1 hover:text-red-500 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks */}
              <TabsContent value="tasks" className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">Project Tasks</CardTitle>
                      <p className="text-sm text-gray-600">Define the tasks needed to complete this project</p>
                    </div>
                    <Button type="button" onClick={addTask} variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.tasks.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No tasks added yet. Create your first task to get started!</p>
                        <Button onClick={addTask} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add First Task
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.tasks.map((task, index) => (
                          <Card key={task.id} className="border border-gray-200 bg-white">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-orange-600">{index + 1}</span>
                                  </div>
                                  <h4 className="font-medium text-gray-900">Task {index + 1}</h4>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTask(task.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Title *</Label>
                                  <Input
                                    value={task.title}
                                    onChange={(e) => updateTask(task.id, "title", e.target.value)}
                                    placeholder="Enter task title"
                                    className="h-10"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                                  <Textarea
                                    value={task.description}
                                    onChange={(e) => updateTask(task.id, "description", e.target.value)}
                                    placeholder="Describe what needs to be done"
                                    rows={2}
                                    className="resize-none"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                                    <Select
                                      value={task.status}
                                      onValueChange={(value: "pending" | "in-progress" | "completed" | "overdue") =>
                                        updateTask(task.id, "status", value)
                                      }
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Priority</Label>
                                    <Select
                                      value={task.priority}
                                      onValueChange={(value: "low" | "medium" | "high") =>
                                        updateTask(task.id, "priority", value)
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
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Deadline</Label>
                                    <Input
                                      type="date"
                                      value={task.deadline}
                                      onChange={(e) => updateTask(task.id, "deadline", e.target.value)}
                                      className="h-10"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Assignee</Label>
                                  <Select
                                    value={task.assigneeId?.toString() || "none"}
                                    onValueChange={(value) => updateTask(task.id, "assigneeId", value === "none" ? undefined : parseInt(value))}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Select assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No assignee</SelectItem>
                                      {selectedTeamMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                          {member.name || member.email}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resources */}
              <TabsContent value="resources" className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">Project Resources</CardTitle>
                      <p className="text-sm text-gray-600">Add documents, links, and other resources for this project</p>
                    </div>
                    <Button type="button" onClick={addResource} variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Resource
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.resources.length === 0 ? (
                      <div className="text-center py-12">
                        <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No resources added yet. Add documents, links, or files to get started!</p>
                        <Button onClick={addResource} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add First Resource
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.resources.map((resource, index) => (
                          <Card key={resource.id} className="border border-gray-200 bg-white">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                                  </div>
                                  <h4 className="font-medium text-gray-900">Resource {index + 1}</h4>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeResource(resource.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Title *</Label>
                                  <Input
                                    value={resource.title}
                                    onChange={(e) => updateResource(resource.id, "title", e.target.value)}
                                    placeholder="Enter resource title"
                                    className="h-10"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                                  <Input
                                    value={resource.type}
                                    onChange={(e) => updateResource(resource.id, "type", e.target.value)}
                                    placeholder="e.g., Document, Link, File, Spreadsheet"
                                    className="h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">URL</Label>
                                  <Input
                                    value={resource.url}
                                    onChange={(e) => updateResource(resource.id, "url", e.target.value)}
                                    placeholder="https://..."
                                    type="url"
                                    className="h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                                  <Textarea
                                    value={resource.description}
                                    onChange={(e) => updateResource(resource.id, "description", e.target.value)}
                                    placeholder="Describe what this resource contains"
                                    rows={2}
                                    className="resize-none"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t bg-white p-6 rounded-lg shadow-sm">
              <Link href="/dashboard/projects">
                <Button type="button" variant="outline" className="h-11 px-6">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !formData.name} className="h-11 px-8">
                {isSubmitting ? (draftProjectId ? "Finalizing Project..." : "Creating Project...") : (draftProjectId ? "Finalize Project" : "Create Project")}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
} 