"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { ExternalLink, FileText, Plus, LinkIcon } from "lucide-react"
import { api } from "~/trpc/react";

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

export function ResourcesSection() {
    const { data: resources, isLoading } = api.project.getResources.useQuery();

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!resources) {
        return <div>No resources found.</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Resources</h3>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource) => (
                    <Card key={resource.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {getTypeIcon(resource.type)}
                                    <CardTitle className="text-base">{resource.title}</CardTitle>
                                </div>
                                <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
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

            {/* Quick Actions */}
            <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                            Create New Google Doc
                        </Button>
                        <Button variant="outline" size="sm">
                            Create New Google Sheet
                        </Button>
                        <Button variant="outline" size="sm">
                            Upload File
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}