"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"

export function AddResourceForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    url: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="resource-title" className="text-sm font-medium text-gray-700">Title *</Label>
        <Input
          id="resource-title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter resource title"
          className="h-10"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-type" className="text-sm font-medium text-gray-700">Type</Label>
        <Input
          id="resource-type"
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          placeholder="e.g., Document, Link, File, Spreadsheet"
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-url" className="text-sm font-medium text-gray-700">URL</Label>
        <Input
          id="resource-url"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://..."
          type="url"
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-description" className="text-sm font-medium text-gray-700">Description</Label>
        <Textarea
          id="resource-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this resource contains"
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={!formData.title} className="h-10 px-6">
          Create Resource
        </Button>
      </div>
    </form>
  )
} 