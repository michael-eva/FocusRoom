"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { ExternalLink, FileText, Plus, LinkIcon, Trash2 } from "lucide-react"
import { api } from "~/trpc/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { AddResourceForm } from "./AddResourceForm"
import { useState } from "react"
import { toast } from "sonner"

interface ResourcesSectionProps {
    projectId: number
    onDeleteResource?: (resource: any) => void
}

const getTypeColor = (type: string | null) => {
    switch (type) {
        case "Google Docs":
            return "bg-blue-100 text-blue-800"
        case "Google Sheets":
            return "bg-green-100 text-green-800"
        default:
            return "bg-gray-100 text-gray-800"
    }
}

const getTypeIcon = (type: string | null) => {
    switch (type) {
        case "Google Docs":
            return <FileText className="h-4 w-4" />
        case "Google Sheets":
            return <FileText className="h-4 w-4" />
        default:
            return <LinkIcon className="h-4 w-4" />
    }
}

export function ResourcesSection({ projectId, onDeleteResource }: ResourcesSectionProps) {
    const { data: resources, isLoading, refetch } = api.project.getResources.useQuery();
    const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
    const logActivityMutation = api.project.logActivity.useMutation()
    const utils = api.useUtils()

    const createResourceMutation = api.project.createResource.useMutation({
        onSuccess: async () => {
            toast.success("Resource created successfully!")
            setIsAddResourceDialogOpen(false)
            await utils.project.getResources.invalidate()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create resource")
        },
    })


    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!resources) {
        return <div>No resources found.</div>
    }

    // Filter resources for this project and sort by newest first
    const projectResources = resources
        ?.filter(resource => resource.projectId === projectId)
        .sort((a, b) => {
            // Sort by lastUpdated in descending order (newest first)
            const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
            const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
            return dateB - dateA;
        }) || [];
    const handleCreateResource = (formData: any) => {
        createResourceMutation.mutate({
            projectId: projectId,
            title: formData.title,
            type: formData.type,
            url: formData.url,
            description: formData.description,
        }, {
            onSuccess: (resource) => {
                // Log activity
                if (resource) {
                    logActivityMutation.mutate({
                        projectId: projectId,
                        type: "resource_added",
                        description: `Resource "${formData.title}" was added`,
                        resourceId: resource.id,
                    })
                }
            }
        })
    }
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isAddResourceDialogOpen} onOpenChange={setIsAddResourceDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
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
            </div>

            {projectResources.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                        <LinkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources yet</h3>
                        <p className="text-gray-500 mb-6">Add your first resource to get started with this project!</p>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add First Resource
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectResources.map((resource) => (
                        <Card key={resource.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(resource.type)}
                                        <CardTitle className="text-base">{resource.title}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                                        {onDeleteResource && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteResource(resource)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-gray-600">{resource.description}</p>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Updated {new Date(resource.lastUpdated!).toLocaleDateString()}
                                    </span>
                                    <Button variant="outline" size="sm" onClick={() => window.open(resource.url!, "_blank")}>
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Open
                                    </Button>
                                </div>

                                {/* Embedded preview for Google Docs/Sheets */}
                                <div className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <LinkIcon className="h-4 w-4" />
                                        <span className="truncate">{resource.url}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}