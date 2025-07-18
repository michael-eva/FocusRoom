"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { ExternalLink, FileText, Plus, LinkIcon, Trash2 } from "lucide-react"
import { api } from "~/trpc/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/use-mobile"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
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
                    <Button type="button" variant="outline" onClick={onClose} className="h-10 sm:h-11 text-sm sm:text-base">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
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
                <Button
                    onClick={() => setIsAddResourceDialogOpen(true)}
                    className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                >
                    <Plus className="h-4 w-4" />
                    Add Resource
                </Button>
            </div>

            <AddResourceDialog
                isOpen={isAddResourceDialogOpen}
                onClose={() => setIsAddResourceDialogOpen(false)}
                onSubmit={handleCreateResource}
            />

            {projectResources.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                        <LinkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources yet</h3>
                        <p className="text-gray-500 mb-6">Add your first resource to get started with this project!</p>
                        <Button
                            onClick={() => setIsAddResourceDialogOpen(true)}
                            className="gap-2"
                        >
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