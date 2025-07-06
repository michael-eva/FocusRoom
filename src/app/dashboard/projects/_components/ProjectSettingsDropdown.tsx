"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Settings, Trash2, Edit, Share, Archive } from "lucide-react"

interface ProjectSettingsDropdownProps {
  onDelete: () => void
  onEdit?: () => void
  onShare?: () => void
  onArchive?: () => void
  isLoading?: boolean
}

export function ProjectSettingsDropdown({
  onDelete,
  onEdit,
  onShare,
  onArchive,
  isLoading = false
}: ProjectSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-gray-100"
        disabled={isLoading}
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Project Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {onEdit && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-10"
                onClick={() => {
                  onEdit()
                  setIsOpen(false)
                }}
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-10"
                onClick={() => {
                  onShare()
                  setIsOpen(false)
                }}
              >
                <Share className="h-4 w-4" />
                Share Project
              </Button>
            )}
            {onArchive && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-10"
                onClick={() => {
                  onArchive()
                  setIsOpen(false)
                }}
              >
                <Archive className="h-4 w-4" />
                Archive Project
              </Button>
            )}
            {(onEdit || onShare || onArchive) && (
              <div className="border-t my-2"></div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                onDelete()
                setIsOpen(false)
              }}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
              Delete Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 