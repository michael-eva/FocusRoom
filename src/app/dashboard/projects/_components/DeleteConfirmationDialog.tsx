"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { useIsMobile } from "~/hooks/use-mobile"
import { Button } from "~/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName: string
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  const isMobile = useIsMobile();

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
    className: "overflow-hidden flex flex-col sm:max-w-md"
  };

  return (
    <DialogWrapper {...dialogProps}>
      <DialogContentWrapper {...contentProps}>
        <DialogHeaderWrapper>
          <DialogTitleWrapper className="flex items-center gap-2 text-red-600 text-lg sm:text-xl">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitleWrapper>
        </DialogHeaderWrapper>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm sm:text-base text-red-800 font-medium mb-1">
                Are you sure you want to delete &quot;{itemName}&quot;?
              </p>
              <p className="text-xs sm:text-sm text-red-700">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t px-6 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 sm:h-11 px-4 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 h-10 sm:h-11 px-6 gap-2 text-sm sm:text-base"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContentWrapper>
    </DialogWrapper>
  )
} 