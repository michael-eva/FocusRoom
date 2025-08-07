"use client"


import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Bell, User, Plus, Users, Calendar, CheckCircle2, Clock, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { api } from "~/trpc/react"
import CommonNavbar from "~/app/_components/CommonNavbar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"

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
        return (
            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title="Projects"
                    rightContent={
                        <Link href="/dashboard/projects/new">
                            <Button variant="packPrimary" disabled>
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">New Project</span>
                            </Button>
                        </Link>
                    }
                    mobilePopoverContent={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="packOutline" disabled>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                    <Link href="/dashboard/projects/new">
                                        <Button disabled variant="ghost" className="justify-start">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Project
                                        </Button>
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                        <span className="text-muted-foreground">Loading projects...</span>
                    </div>
                </div>
            </main>
        );
    }

    if (!projects || projects.length === 0) {
        return (
            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title="Projects"
                    rightContent={
                        <Link href="/dashboard/projects/new">
                            <Button variant="packPrimary" >
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">New Project</span>
                            </Button>
                        </Link>
                    }
                    mobilePopoverContent={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="packOutline">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                    <Link href="/dashboard/projects/new">
                                        <Button variant="ghost" className="justify-start">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Project
                                        </Button>
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Get started by creating your first project to collaborate with your team.
                            </p>
                        </div>
                        <Link href="/dashboard/projects/new">
                            <Button variant="packPrimary" className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Project
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Calculate dynamic statistics
    const activeProjects = projects.filter(project => project.status === "active").length;
    const totalTasks = projects.reduce((sum, project) => sum + (project.totalTasks || 0), 0);
    const uniqueTeamMembers = new Set(
        projects.flatMap(project =>
            project.teamMembers.map(member => member.clerkUserId)
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
            <main className="flex-1 space-y-6 p-6">
                <CommonNavbar
                    title="Projects"
                    rightContent={
                        <Link href="/dashboard/projects/new">
                            <Button variant="packPrimary" >
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">New Project</span>
                            </Button>
                        </Link>
                    }
                    mobilePopoverContent={
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="packOutline">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                    <Link href="/dashboard/projects/new">
                                        <Button variant="ghost" className="justify-start">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Project
                                        </Button>
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>
                    }
                />
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
                                                        key={member.clerkUserId || index}
                                                        className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                                        title={member.teamMember?.name || 'Unknown User'}
                                                    >
                                                        {member.teamMember?.name?.charAt(0) || '?'}
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
            </main >
        </>
    )
}