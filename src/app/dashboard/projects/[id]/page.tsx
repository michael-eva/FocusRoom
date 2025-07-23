"use client"

import { use, useState } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Checkbox } from "~/components/ui/checkbox"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/use-mobile"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Bell, User, Plus, ArrowLeft, Calendar, Users, Mail, CheckCircle2, Clock, AlertCircle, ExternalLink, FileText, LinkIcon, Edit, Trash2, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { ResourcesSection } from "../_components/ResourceSection"
import { TaskAssignmentDialog } from "../_components/TaskAssignmentDialog"
import { EditTaskDialog } from "../_components/EditTaskDialog"
import { ActivitySection } from "../_components/ActivitySection"
import { DeleteConfirmationDialog } from "../_components/DeleteConfirmationDialog"
import { ProjectSettingsDropdown } from "../_components/ProjectSettingsDropdown"

import { EditProjectDialog } from "../../_components/EditProjectDialog"
import { api } from "~/trpc/react"
import { toast } from "sonner"
import CommonNavbar from "~/app/_components/CommonNavbar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"

const getStatusColor = (status: string | null) => {
    switch (status) {
        case "completed":
            return "bg-green-100 text-green-800"
        case "in-progress":
            return "bg-blue-100 text-blue-800"
        case "pending":
            return "bg-yellow-100 text-yellow-800"
        case "overdue":
            return "bg-red-100 text-red-800"
        default:
            return "bg-gray-100 text-gray-800"
    }
}

const getPriorityIcon = (priority: string | null) => {
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

const getPriorityColor = (priority: string | null) => {
    switch (priority) {
        case "high":
            return "bg-red-100 text-red-800 border-red-200"
        case "medium":
            return "bg-orange-100 text-orange-800 border-orange-200"
        case "low":
            return "bg-green-100 text-green-800 border-green-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

type PageProps = {
    params: Promise<{
        id: string;
    }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
    const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false)
    const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<any>(null)
    const [isDeleteTaskDialogOpen, setIsDeleteTaskDialogOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState<any>(null)
    const [isDeleteResourceDialogOpen, setIsDeleteResourceDialogOpen] = useState(false)
    const [resourceToDelete, setResourceToDelete] = useState<any>(null)
    const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false)
    const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)

    const { data: project, isLoading, refetch } = api.project.getProjectById.useQuery({ id });
    const { data: allUsers } = api.users.getAll.useQuery();
    const { data: allTeamMembers } = api.users.getAllTeamMembers.useQuery({ projectId: parseInt(id) });
    const { data: currentUser } = api.users.getAll.useQuery();
    const utils = api.useUtils()

    const createTaskMutation = api.project.createTask.useMutation({
        onSuccess: async () => {
            toast.success("Task created successfully!")
            setIsAddTaskDialogOpen(false)
            await refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create task")
        },
    })

    const createResourceMutation = api.project.createResource.useMutation({
        onSuccess: async () => {
            toast.success("Resource created successfully!")
            setIsAddResourceDialogOpen(false)
            await refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create resource")
        },
    })

    const updateTaskAssignmentMutation = api.project.updateTaskAssignment.useMutation({
        onSuccess: async () => {
            toast.success("Task assigned successfully!")
            setIsAssignDialogOpen(false)
            await refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to assign task")
        },
    })

    const updateTaskStatusMutation = api.project.updateTaskStatus.useMutation({
        onSuccess: async () => {
            toast.success("Task status updated successfully!")
            await refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update task status")
        },
    })

    const updateTaskMutation = api.project.updateTask.useMutation({
        onSuccess: async () => {
            toast.success("Task updated successfully!")
            setIsEditTaskDialogOpen(false)
            setTaskToEdit(null)
            await refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update task")
        },
    })

    const logActivityMutation = api.project.logActivity.useMutation()

    const deleteTaskMutation = api.project.deleteTask.useMutation({
        onSuccess: async (result) => {
            toast.success("Task deleted successfully!")
            setIsDeleteTaskDialogOpen(false)
            setTaskToDelete(null)
            await refetch()

            // Log activity
            if (result.deletedTask) {
                logActivityMutation.mutate({
                    projectId: parseInt(id),
                    type: "task_status_changed",
                    description: `Task "${result.deletedTask.title}" was deleted`,
                })
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete task")
        },
    })

    const deleteResourceMutation = api.project.deleteResource.useMutation({
        onSuccess: async (result) => {
            toast.success("Resource deleted successfully!")
            setIsDeleteResourceDialogOpen(false)
            setResourceToDelete(null)
            await refetch()

            // Invalidate the resources query to refresh the ResourceSection
            await utils.project.getResources.invalidate()

            // Log activity
            if (result.deletedResource) {
                logActivityMutation.mutate({
                    projectId: parseInt(id),
                    type: "resource_added",
                    description: `Resource "${result.deletedResource.title}" was deleted`,
                })
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete resource")
        },
    })

    const deleteProjectMutation = api.project.deleteProject.useMutation({
        onSuccess: () => {
            toast.success("Project deleted successfully!")
            // Redirect to projects list
            window.location.href = "/dashboard/projects"
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete project")
        },
    })

    const updateProjectMutation = api.project.updateProject.useMutation({
        onSuccess: async () => {
            toast.success("Project updated successfully!")
            setIsEditProjectDialogOpen(false)
            await refetch()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update project")
        },
    })

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!project) {
        return <div>Project not found</div>
    }

    const completedTasks = project.tasks.filter((task) => task.status === "completed").length
    const totalTasks = project.tasks.length

    // Check if current user can edit the project (admin or project creator)
    const currentUserId = currentUser?.[0]?.id || 1
    const isAdmin = currentUser?.[0]?.role === "admin"
    const isProjectCreator = project.createdBy === currentUserId
    const canEditProject = isAdmin || isProjectCreator

    const handleTaskAssign = (taskId: number, assignee: any, deadline: string) => {
        const task = project.tasks.find(t => t.id === taskId)

        updateTaskAssignmentMutation.mutate({
            taskId,
            assigneeId: assignee.id,
            deadline: deadline ? new Date(deadline) : undefined,
        }, {
            onSuccess: () => {
                // Log activity
                if (task) {
                    logActivityMutation.mutate({
                        projectId: parseInt(id),
                        type: "task_assigned",
                        description: `Task "${task.title}" was assigned to ${assignee.name}`,
                        taskId: taskId,
                    })
                }
            }
        })
    }

    const handleTaskStatusChange = (taskId: number, isCompleted: boolean) => {
        const newStatus = isCompleted ? "completed" : "pending"
        const task = project.tasks.find(t => t.id === taskId)

        updateTaskStatusMutation.mutate({
            taskId,
            status: newStatus,
        }, {
            onSuccess: () => {
                // Log activity
                if (task) {
                    const activityType = isCompleted ? "task_completed" : "task_status_changed"
                    const description = isCompleted
                        ? `Task "${task.title}" was completed`
                        : `Task "${task.title}" status changed to ${newStatus}`

                    logActivityMutation.mutate({
                        projectId: parseInt(id),
                        type: activityType,
                        description,
                        taskId: taskId,
                    })
                }
            }
        })
    }

    const handleCreateTask = (formData: any) => {
        createTaskMutation.mutate({
            projectId: parseInt(id),
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            deadline: formData.deadline ? new Date(formData.deadline) : undefined,
            assigneeId: formData.assigneeId,
        }, {
            onSuccess: (task) => {
                // Log activity
                if (task) {
                    logActivityMutation.mutate({
                        projectId: parseInt(id),
                        type: "task_created",
                        description: `Task "${formData.title}" was created`,
                        taskId: task.id,
                    })
                }
            }
        })
    }

    const handleCreateResource = (formData: any) => {
        createResourceMutation.mutate({
            projectId: parseInt(id),
            title: formData.title,
            type: formData.type,
            url: formData.url,
            description: formData.description,
        }, {
            onSuccess: (resource) => {
                // Log activity
                if (resource) {
                    logActivityMutation.mutate({
                        projectId: parseInt(id),
                        type: "resource_added",
                        description: `Resource "${formData.title}" was added`,
                        resourceId: resource.id,
                    })
                }
            }
        })
    }

    const handleUpdateTask = (taskId: number, formData: any) => {
        updateTaskMutation.mutate({
            taskId,
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            deadline: formData.deadline ? new Date(formData.deadline) : undefined,
            assigneeId: formData.assigneeId,
        })
    }

    const handleDeleteTask = () => {
        if (taskToDelete) {
            deleteTaskMutation.mutate({ taskId: taskToDelete.id })
        }
    }

    const handleDeleteResource = () => {
        if (resourceToDelete) {
            deleteResourceMutation.mutate({ resourceId: resourceToDelete.id })
        }
    }

    const handleDeleteProject = () => {
        deleteProjectMutation.mutate({ projectId: parseInt(id) })
    }

    const handleUpdateProject = (projectId: number, formData: any) => {
        updateProjectMutation.mutate({
            projectId,
            name: formData.name,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            deadline: formData.deadline,
            teamMemberIds: formData.teamMemberIds,
        }, {
            onSuccess: () => {
                // Log activity
                logActivityMutation.mutate({
                    projectId: parseInt(id),
                    type: "project_updated",
                    description: `Project "${formData.name}" was updated`,
                })
            }
        })
    }

    return (
        <>
            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title={project.name ?? "Project"}
                    rightContent={
                        <Button onClick={() => setIsEditProjectDialogOpen(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
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
                                    <Button onClick={() => setIsEditProjectDialogOpen(true)} variant="ghost" className="justify-start">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Project
                                    </Button>
                                    <Button onClick={() => setIsDeleteProjectDialogOpen(true)} variant="ghost" className="justify-start">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Project
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                    showBackButton={true}
                />
                <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
                    {/* Project Overview */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 sm:p-8">
                            {/* Mobile: Show project description here since it's hidden in header */}
                            <div className="sm:hidden mb-4">
                                <p className="text-sm text-gray-600">{project.description}</p>
                            </div>

                            {/* Mobile: Stack vertically, Desktop: 4 columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Progress</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3">
                                                <div
                                                    className="bg-orange-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-lg sm:text-lg font-bold text-gray-900">{project.progress}%</span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {completedTasks} of {totalTasks} tasks completed
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Deadline</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{new Date(project.deadline!).toLocaleDateString()}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">Project deadline</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Team</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-1 sm:-space-x-2">
                                            {project.teamMembers.slice(0, 4).map((member) => (
                                                <Avatar key={member?.clerkUserId} className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white shadow-sm">
                                                    <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">
                                                        {(member?.clerkUserId?.charAt(0) || "?")}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                            {project.teamMembers.length > 4 && (
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                                                    +{project.teamMembers.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-600">{project.teamMembers.length} members</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Status</h3>
                                    <Badge className={`${getStatusColor(project.status ?? null)} px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium`}>
                                        {project.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="tasks" className="space-y-4 sm:space-y-6">
                        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-white shadow-sm">
                            <TabsTrigger value="tasks" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Tasks ({totalTasks})</span>
                                <span className="sm:hidden">Tasks</span>
                            </TabsTrigger>
                            <TabsTrigger value="resources" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Resources ({project.resources?.length || 0})</span>
                                <span className="sm:hidden">Resources</span>
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Activity</span>
                                <span className="sm:hidden">Activity</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="tasks" className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Project Tasks</h3>
                                <Button
                                    onClick={() => setIsAddTaskDialogOpen(true)}
                                    variant="packPrimary"
                                    className="gap-2 self-start sm:self-auto"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Task
                                </Button>
                            </div>

                            {project.tasks.length === 0 ? (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-6 sm:p-12 text-center">
                                        <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
                                        <p className="text-sm text-gray-500 mb-4 sm:mb-6">Create your first task to get started with this project!</p>
                                        <Button onClick={() => setIsAddTaskDialogOpen(true)} variant="packPrimary" className="gap-2" size="sm">
                                            <Plus className="h-4 w-4" />
                                            Add First Task
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {project.tasks.map((task) => (
                                        <Card key={task.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <Checkbox
                                                        checked={task.status === "completed"}
                                                        onCheckedChange={(checked) => handleTaskStatusChange(task.id, checked as boolean)}
                                                        className="mt-1 flex-shrink-0"
                                                    />
                                                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                                                        {/* Title and controls row */}
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <h4
                                                                    className={`text-base sm:text-lg font-medium leading-tight ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                                                                        }`}
                                                                >
                                                                    {task.title}
                                                                </h4>
                                                            </div>
                                                            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                                                                {task.priority && (
                                                                    <Badge className={`${getPriorityColor(task.priority)} px-2 py-1 text-xs font-medium flex items-center gap-1`}>
                                                                        {getPriorityIcon(task.priority)}
                                                                        <span className="truncate">
                                                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                                        </span>
                                                                    </Badge>
                                                                )}
                                                                <Select
                                                                    value={task.status ?? undefined}
                                                                    onValueChange={(value: "pending" | "in-progress" | "completed" | "overdue") =>
                                                                        updateTaskStatusMutation.mutate({
                                                                            taskId: task.id,
                                                                            status: value,
                                                                        })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-28 sm:w-32 h-8 text-xs">
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
                                                        </div>

                                                        {/* Description spans full width */}
                                                        {task.description && (
                                                            <div className="w-full">
                                                                <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-100 gap-3 sm:gap-6">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                                                {task.assigneeClerkUserId ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                                                                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                                                                                {task.assigneeClerkUserId?.charAt(0)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-xs sm:text-sm text-gray-600 truncate">{task.assigneeClerkUserId}</span>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedTask(task)
                                                                            setIsAssignDialogOpen(true)
                                                                        }}
                                                                        className="gap-2 h-8 px-2 sm:px-3 text-xs"
                                                                    >
                                                                        <Users className="h-3 w-3" />
                                                                        Assign
                                                                    </Button>
                                                                )}

                                                                {task.deadline && (
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                        <span className="truncate">Due {new Date(task.deadline).toLocaleDateString()}</span>
                                                                    </div>
                                                                )}
                                                                {task.completedAt && (
                                                                    <div className="flex items-center gap-2 text-xs text-green-600">
                                                                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                        <span className="truncate">Completed {new Date(task.completedAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setTaskToEdit(task)
                                                                        setIsEditTaskDialogOpen(true)
                                                                    }}
                                                                    className="gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs"
                                                                >
                                                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    <span className="hidden sm:inline">Edit</span>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setTaskToDelete(task)
                                                                        setIsDeleteTaskDialogOpen(true)
                                                                    }}
                                                                    className="gap-1 sm:gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2 sm:px-3 text-xs"
                                                                >
                                                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    <span className="hidden sm:inline">Delete</span>
                                                                </Button>
                                                                <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs hidden sm:flex">
                                                                    <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    <span className="hidden sm:inline">Notify</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="resources">
                            <ResourcesSection
                                projectId={parseInt(id)}
                                onDeleteResource={(resource) => {
                                    setResourceToDelete(resource)
                                    setIsDeleteResourceDialogOpen(true)
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="activity">
                            <ActivitySection projectId={parseInt(id)} />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <TaskAssignmentDialog
                isOpen={isAssignDialogOpen}
                onClose={() => setIsAssignDialogOpen(false)}
                task={selectedTask}
                teamMembers={project.teamMembers}
                onAssign={handleTaskAssign}
            />

            <EditTaskDialog
                isOpen={isEditTaskDialogOpen}
                onClose={() => {
                    setIsEditTaskDialogOpen(false)
                    setTaskToEdit(null)
                }}
                task={taskToEdit}
                teamMembers={project.teamMembers}
                onUpdate={handleUpdateTask}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteTaskDialogOpen}
                onClose={() => {
                    setIsDeleteTaskDialogOpen(false)
                    setTaskToDelete(null)
                }}
                onConfirm={handleDeleteTask}
                title="Delete Task"
                message="This action cannot be undone. The task will be permanently removed from the project."
                itemName={taskToDelete?.title || ""}
                isLoading={deleteTaskMutation.isPending}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteResourceDialogOpen}
                onClose={() => {
                    setIsDeleteResourceDialogOpen(false)
                    setResourceToDelete(null)
                }}
                onConfirm={handleDeleteResource}
                title="Delete Resource"
                message="This action cannot be undone. The resource will be permanently removed from the project."
                itemName={resourceToDelete?.title || ""}
                isLoading={deleteResourceMutation.isPending}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteProjectDialogOpen}
                onClose={() => setIsDeleteProjectDialogOpen(false)}
                onConfirm={handleDeleteProject}
                title="Delete Project"
                message="This action cannot be undone. The project and all its tasks, resources, and activities will be permanently deleted."
                itemName={project?.name || ""}
                isLoading={deleteProjectMutation.isPending}
            />

            <EditProjectDialog
                isOpen={isEditProjectDialogOpen}
                onClose={() => setIsEditProjectDialogOpen(false)}
                project={project}
                teamMembers={allTeamMembers || []}
                onUpdate={handleUpdateProject}
                isLoading={updateProjectMutation.isPending}
            />

            <AddTaskDialog
                isOpen={isAddTaskDialogOpen}
                onClose={() => setIsAddTaskDialogOpen(false)}
                onSubmit={handleCreateTask}
                teamMembers={allUsers?.data || []}
            />

            <AddResourceDialog
                isOpen={isAddResourceDialogOpen}
                onClose={() => setIsAddResourceDialogOpen(false)}
                onSubmit={handleCreateResource}
            />
        </>
    )
}

function AddTaskDialog({
    isOpen,
    onClose,
    onSubmit,
    teamMembers
}: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    teamMembers: any[]
}) {
    const isMobile = useIsMobile();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "pending" as "pending" | "in-progress" | "completed" | "overdue",
        priority: "medium" as "low" | "medium" | "high",
        deadline: "",
        assigneeId: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : undefined,
        })
        // Reset form
        setFormData({
            title: "",
            description: "",
            status: "pending",
            priority: "medium",
            deadline: "",
            assigneeId: "",
        })
        onClose()
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
        className: "max-h-[95vh] overflow-hidden flex flex-col"
    } : {
        className: "overflow-hidden flex flex-col max-w-md"
    };

    return (
        <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
                <DialogHeaderWrapper>
                    <DialogTitleWrapper>Add New Task</DialogTitleWrapper>
                </DialogHeaderWrapper>

                <div className="flex-1 overflow-y-auto px-6">
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
                                    <SelectContent>
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
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">Assignee</Label>
                            <Select
                                value={formData.assigneeId || "none"}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value === "none" ? "" : value }))}
                            >
                                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                                    <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No assignee</SelectItem>
                                    {teamMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                            {member.name || member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-2 py-4 border-t px-6">
                    <Button type="button" variant="packOutline" onClick={onClose} className="h-10 sm:h-11 text-sm sm:text-base">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="packPrimary"
                        disabled={!formData.title}
                        onClick={handleSubmit}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                    >
                        Create Task
                    </Button>
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    )
}

function AddResourceDialog({
    isOpen,
    onClose,
    onSubmit
}: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
}) {
    const isMobile = useIsMobile();

    const [formData, setFormData] = useState({
        title: "",
        type: "",
        url: "",
        description: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
        // Reset form
        setFormData({
            title: "",
            type: "",
            url: "",
            description: "",
        })
        onClose()
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
        className: "max-h-[95vh] overflow-hidden flex flex-col"
    } : {
        className: "overflow-hidden flex flex-col max-w-md"
    };

    return (
        <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
                <DialogHeaderWrapper>
                    <DialogTitleWrapper>Add New Resource</DialogTitleWrapper>
                </DialogHeaderWrapper>

                <div className="flex-1 overflow-y-auto px-6">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter resource title"
                                className="h-10 sm:h-11 text-sm sm:text-base"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium text-gray-700">Type</Label>
                            <Input
                                id="type"
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                placeholder="e.g., Document, Link, File, Spreadsheet"
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url" className="text-sm font-medium text-gray-700">URL</Label>
                            <Input
                                id="url"
                                value={formData.url}
                                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://..."
                                type="url"
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this resource contains"
                                rows={3}
                                className="resize-none text-sm sm:text-base"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-2 py-4 border-t px-6">
                    <Button type="button" variant="packOutline" onClick={onClose} className="h-10 sm:h-11 text-sm sm:text-base">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="packPrimary"
                        disabled={!formData.title}
                        onClick={handleSubmit}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                    >
                        Create Resource
                    </Button>
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    )
}

function AddTaskForm({ onSubmit, teamMembers }: { onSubmit: (data: any) => void, teamMembers: any[] }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "pending" as "pending" | "in-progress" | "completed" | "overdue",
        priority: "medium" as "low" | "medium" | "high",
        deadline: "",
        assigneeId: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            ...formData,
            assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : undefined,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Title *</Label>
                <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
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
                    placeholder="Describe what needs to be done"
                    rows={3}
                    className="resize-none"
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
            <div className="space-y-2">
                <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">Assignee</Label>
                <Select
                    value={formData.assigneeId || "none"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value === "none" ? "" : value }))}
                >
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No assignee</SelectItem>
                        {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name || member.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button type="submit" disabled={!formData.title} className="h-10 px-6 w-full sm:w-auto">
                    Create Task
                </Button>
            </div>
        </form>
    )
}

