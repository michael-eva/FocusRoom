"use client"

import { use, useState } from "react"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Checkbox } from "~/components/ui/checkbox"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Bell, User, Plus, ArrowLeft, Calendar, Users, Mail, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { ResourcesSection } from "../_components/ResourceSection"
import { TaskAssignmentDialog } from "../_components/TaskAssignmentDialog"
import { api } from "~/trpc/react"

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
type PageProps = {
    params: Promise<{
        id: string;
    }>;
}
export default function ProjectDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

    const { data: project, isLoading } = api.project.getProjectById.useQuery({ id });

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!project) {
        return <div>Project not found</div>
    }

    const completedTasks = project.tasks.filter((task) => task.status === "completed").length
    const totalTasks = project.tasks.length

    const handleTaskAssign = (taskId: number, assignee: any, deadline: string) => {
        // In a real app, this would update the database and send notifications
        console.log("Task assigned:", { taskId, assignee, deadline })
        // Simulate email notification
        alert(`Email notification sent to ${assignee.email} for task assignment!`)
    }

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <Link href="/projects">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-800">{project.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Project Overview */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Progress</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-orange-500 h-2 rounded-full"
                                                style={{ width: `${project.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">{project.progress}%</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {completedTasks}/{totalTasks} tasks completed
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Deadline</h3>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">{new Date(project.deadline!).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Team</h3>
                                    <div className="flex -space-x-2">
                                        {project.teamMembers.map((member) => (
                                            <Avatar key={member?.id} className="w-8 h-8 border-2 border-white">
                                                <AvatarFallback className="bg-orange-500 text-white text-xs">
                                                    {member?.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
                                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="tasks" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="resources">Resources</TabsTrigger>
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tasks" className="space-y-4">
                            {project.tasks.map((task) => (
                                <Card key={task.id} className="hover:shadow-sm transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <Checkbox checked={task.status === "completed"} className="mt-1" />
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4
                                                            className={`font-medium ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-800"}`}
                                                        >
                                                            {task.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">{task.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getPriorityIcon(task.priority)}
                                                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {task.assignee ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="w-6 h-6">
                                                                    <AvatarFallback className="bg-orange-500 text-white text-xs">
                                                                        {task.assignee.avatar}
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
                                                            >
                                                                <Users className="h-4 w-4 mr-1" />
                                                                Assign
                                                            </Button>
                                                        )}

                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Calendar className="h-4 w-4" />
                                                            Due {new Date(task.deadline!).toLocaleDateString()}{" "}
                                                        </div>
                                                    </div>

                                                    <Button variant="ghost" size="sm">
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        Notify
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        <TabsContent value="resources">
                            <ResourcesSection />
                        </TabsContent>

                        <TabsContent value="activity">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                        <div>
                                            <p className="text-sm">
                                                <strong>Alice Johnson</strong> completed &quot;Research local venues&quot;
                                            </p>
                                            <p className="text-xs text-gray-500">2 days ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <div>
                                            <p className="text-sm">
                                                <strong>Bob Smith</strong> was assigned to &quot;Create outreach email template&quot;
                                            </p>
                                            <p className="text-xs text-gray-500">3 days ago</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
        </>
    )
}