"use client"


import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Bell, User, Plus, Users, Calendar, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { api } from "~/trpc/react"

const getStatusColor = (status: string | null) => {
    switch (status) {
        case "active":
            return "bg-green-100 text-green-800"
        case "planning":
            return "bg-yellow-100 text-yellow-800"
        case "completed":
            return "bg-blue-100 text-blue-800"
        default:
            return "bg-gray-100 text-gray-800"
    }
}

const getPriorityColor = (priority: string | null) => {
    switch (priority) {
        case "high":
            return "bg-red-100 text-red-800"
        case "medium":
            return "bg-orange-100 text-orange-800"
        case "low":
            return "bg-green-100 text-green-800"
        default:
            return "bg-gray-100 text-gray-800"
    }
}

export default function ProjectsPage() {
    const { data: projects, isLoading } = api.project.getProjects.useQuery();

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!projects) {
        return <div>No projects found.</div>
    }

    // Calculate dynamic statistics
    const activeProjects = projects.filter(project => project.status === "active").length;
    const totalTasks = projects.reduce((sum, project) => sum + (project.totalTasks || 0), 0);
    const uniqueTeamMembers = new Set(
        projects.flatMap(project =>
            project.teamMembers.map(member => member.teamMemberId)
        )
    ).size;

    // Calculate tasks due this week
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tasksDueThisWeek = projects.reduce((sum, project) => {
        const projectTasks = project.tasks || [];
        const dueThisWeek = projectTasks.filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            return deadline >= now && deadline <= oneWeekFromNow;
        }).length;
        return sum + dueThisWeek;
    }, 0);

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <SidebarTrigger />
                    <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                        <span className="hidden sm:inline">Projects & Tasks</span>
                        <span className="sm:hidden">Projects</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Link href="/dashboard/projects/new">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base px-3 sm:px-4 py-2">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">New Project</span>
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                    {/* Projects Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Active Projects</p>
                                        <p className="text-xl sm:text-2xl font-bold leading-tight">{activeProjects}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Total Tasks</p>
                                        <p className="text-xl sm:text-2xl font-bold leading-tight">{totalTasks}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Team Members</p>
                                        <p className="text-xl sm:text-2xl font-bold leading-tight">{uniqueTeamMembers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">Due This Week</p>
                                        <p className="text-xl sm:text-2xl font-bold leading-tight">{tasksDueThisWeek}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full active:scale-95">
                                    <CardHeader className="p-4 sm:p-6 pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2 leading-tight">
                                                {project.name}
                                            </CardTitle>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Badge className={`${getPriorityColor(project.priority)} text-xs`}>{project.priority}</Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">{project.description}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="font-medium">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Tasks Summary */}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tasks</span>
                                            <span className="font-medium">
                                                {project.completedTasks}/{project.totalTasks} completed
                                            </span>
                                        </div>

                                        {/* Team Members */}
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">Team</p>
                                            <div className="flex -space-x-2">
                                                {project.teamMembers.slice(0, 3).map((member, index) => (
                                                    <div
                                                        key={index}
                                                        className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                                        title={member.teamMember?.name ?? ""}
                                                    >
                                                        {member.teamMember?.name?.charAt(0)}
                                                    </div>
                                                ))}
                                                {project.teamMembers.length > 3 && (
                                                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                                                        +{project.teamMembers.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status and Deadline */}
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                                            <span className="text-xs text-gray-500">
                                                Due {new Date(project.deadline!).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}