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
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Bell, User, Plus, ArrowLeft, Calendar, Users, Mail, CheckCircle2, Clock, AlertCircle, ExternalLink, FileText, LinkIcon, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { ResourcesSection } from "../_components/ResourceSection"
import { TaskAssignmentDialog } from "../_components/TaskAssignmentDialog"
import { EditTaskDialog } from "../_components/EditTaskDialog"
import { ActivitySection } from "../_components/ActivitySection"
import { DeleteConfirmationDialog } from "../_components/DeleteConfirmationDialog"
import { ProjectSettingsDropdown } from "../_components/ProjectSettingsDropdown"
import { AddResourceForm } from "../_components/AddResourceForm"
import { api } from "~/trpc/react"
import { toast } from "sonner"

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

    const { data: project, isLoading, refetch } = api.project.getProjectById.useQuery({ id });
    const { data: teamMembers } = api.users.getAll.useQuery();
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

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!project) {
        return <div>Project not found</div>
    }

    const completedTasks = project.tasks.filter((task) => task.status === "completed").length
    const totalTasks = project.tasks.length

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
                        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                                <Plus className="h-4 w-4" />
                                Add Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                            </DialogHeader>
                            <AddTaskForm onSubmit={handleCreateTask} teamMembers={teamMembers || []} />
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isAddResourceDialogOpen} onOpenChange={setIsAddResourceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Resource
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Resource</DialogTitle>
                            </DialogHeader>
                            <AddResourceForm onSubmit={handleCreateResource} />
                        </DialogContent>
                    </Dialog>
                    <ProjectSettingsDropdown
                        onDelete={() => setIsDeleteProjectDialogOpen(true)}
                        isLoading={deleteProjectMutation.isPending}
                    />
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-8 bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Project Overview */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">Progress</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-lg font-bold text-gray-900">{project.progress}%</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {completedTasks} of {totalTasks} tasks completed
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">Deadline</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{new Date(project.deadline!).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-600">Project deadline</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">Team</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {project.teamMembers.map((member) => (
                                                <Avatar key={member?.id} className="w-8 h-8 border-2 border-white shadow-sm">
                                                    <AvatarFallback className="bg-orange-500 text-white text-xs font-medium">
                                                        {member?.avatar || (member?.name?.charAt(0) || "?")}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-600">{project.teamMembers.length} members</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">Status</h3>
                                    <Badge className={`${getStatusColor(project.status)} px-3 py-1 text-sm font-medium`}>
                                        {project.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="tasks" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 h-12 bg-white shadow-sm">
                            <TabsTrigger value="tasks" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Tasks ({totalTasks})
                            </TabsTrigger>
                            <TabsTrigger value="resources" className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4" />
                                Resources ({project.resources?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Activity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="tasks" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Project Tasks</h3>
                                <Button
                                    onClick={() => setIsAddTaskDialogOpen(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Task
                                </Button>
                            </div>

                            {project.tasks.length === 0 ? (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-12 text-center">
                                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
                                        <p className="text-gray-500 mb-6">Create your first task to get started with this project!</p>
                                        <Button onClick={() => setIsAddTaskDialogOpen(true)} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add First Task
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {project.tasks.map((task) => (
                                        <Card key={task.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <Checkbox
                                                        checked={task.status === "completed"}
                                                        onCheckedChange={(checked) => handleTaskStatusChange(task.id, checked as boolean)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1">
                                                                <h4
                                                                    className={`text-lg font-medium ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"}`}
                                                                >
                                                                    {task.title}
                                                                </h4>
                                                                {task.description && (
                                                                    <p className="text-gray-600">{task.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {task.priority && (
                                                                    <Badge className={`${getPriorityColor(task.priority)} px-2 py-1 text-xs font-medium flex items-center gap-1`}>
                                                                        {getPriorityIcon(task.priority)}
                                                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                                    </Badge>
                                                                )}
                                                                <Select
                                                                    value={task.status}
                                                                    onValueChange={(value: "pending" | "in-progress" | "completed" | "overdue") =>
                                                                        updateTaskStatusMutation.mutate({
                                                                            taskId: task.id,
                                                                            status: value,
                                                                        })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-32 h-8">
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

                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                            <div className="flex items-center gap-6">
                                                                {task.assignee ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="w-6 h-6">
                                                                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                                                                                {task.assignee.avatar || task.assignee.name?.charAt(0)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-sm text-gray-600">{task.assignee.name}</span>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedTask(task)
                                                                            setIsAssignDialogOpen(true)
                                                                        }}
                                                                        className="gap-2"
                                                                    >
                                                                        <Users className="h-3 w-3" />
                                                                        Assign
                                                                    </Button>
                                                                )}

                                                                {task.deadline && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                        <Calendar className="h-4 w-4" />
                                                                        Due {new Date(task.deadline).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                                {task.completedAt && (
                                                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                        Completed {new Date(task.completedAt).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setTaskToEdit(task)
                                                                        setIsEditTaskDialogOpen(true)
                                                                    }}
                                                                    className="gap-2"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setTaskToDelete(task)
                                                                        setIsDeleteTaskDialogOpen(true)
                                                                    }}
                                                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete
                                                                </Button>
                                                                <Button variant="ghost" size="sm" className="gap-2">
                                                                    <Mail className="h-4 w-4" />
                                                                    Notify
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
        </>
    )
}

// Add Task Form Component
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" disabled={!formData.title} className="h-10 px-6">
                    Create Task
                </Button>
            </div>
        </form>
    )
}

