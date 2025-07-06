"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import {
  CheckCircle2,
  User,
  FileText,
  LinkIcon,
  Clock,
  AlertCircle,
  Calendar,
  Plus,
  Edit,
  Users
} from "lucide-react"
import { api } from "~/trpc/react"

interface ActivitySectionProps {
  projectId: number
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "task_created":
      return <Plus className="h-4 w-4 text-blue-500" />
    case "task_completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "task_assigned":
      return <Users className="h-4 w-4 text-purple-500" />
    case "task_status_changed":
      return <Clock className="h-4 w-4 text-orange-500" />
    case "resource_added":
      return <LinkIcon className="h-4 w-4 text-indigo-500" />
    case "project_updated":
      return <Edit className="h-4 w-4 text-gray-500" />
    default:
      return <FileText className="h-4 w-4 text-gray-500" />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "task_created":
      return "bg-blue-100"
    case "task_completed":
      return "bg-green-100"
    case "task_assigned":
      return "bg-purple-100"
    case "task_status_changed":
      return "bg-orange-100"
    case "resource_added":
      return "bg-indigo-100"
    case "project_updated":
      return "bg-gray-100"
    default:
      return "bg-gray-100"
  }
}

const formatTimeAgo = (timestamp: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

export function ActivitySection({ projectId }: ActivitySectionProps) {
  const { data: activities, isLoading } = api.project.getProjectActivities.useQuery({ projectId })

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-gray-200 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
          <p className="text-gray-500">Activity will appear here as you work on the project</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {activity.description}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {activity.timestamp ? formatTimeAgo(new Date(activity.timestamp)) : "Unknown time"}
                </span>
                {activity.taskId && (
                  <Badge variant="outline" className="text-xs">
                    Task ID: {activity.taskId}
                  </Badge>
                )}
                {activity.resourceId && (
                  <Badge variant="outline" className="text-xs">
                    Resource ID: {activity.resourceId}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 