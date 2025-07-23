"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Check, X, HelpCircle } from "lucide-react"
import { useScrollLock } from "~/hooks/use-scroll-lock"
import { useIsMobile } from "~/hooks/use-mobile"

interface RSVPDialogProps {
  isOpen: boolean
  onClose: () => void
  onRSVP: (status: "attending" | "maybe" | "declined") => void
  eventTitle?: string
  currentStatus?: "attending" | "maybe" | "declined" | null
}

const RSVP_OPTIONS = [
  {
    value: "attending" as const,
    label: "Attending",
    description: "I'll be there!",
    icon: <Check className="h-5 w-5 text-green-600" />,
    color: "border-green-500 bg-green-50 hover:bg-green-100",
    selected: "ring-2 ring-green-500 border-green-500 bg-green-100",
  },
  {
    value: "maybe" as const,
    label: "Maybe",
    description: "I might attend",
    icon: <HelpCircle className="h-5 w-5 text-yellow-600" />,
    color: "border-yellow-400 bg-yellow-50 hover:bg-yellow-100",
    selected: "ring-2 ring-yellow-400 border-yellow-400 bg-yellow-100",
  },
  {
    value: "declined" as const,
    label: "Not Attending",
    description: "I can't make it",
    icon: <X className="h-5 w-5 text-red-600" />,
    color: "border-red-400 bg-red-50 hover:bg-red-100",
    selected: "ring-2 ring-red-400 border-red-400 bg-red-100",
  },
]

export function RSVPDialog({ isOpen, onClose, onRSVP, eventTitle, currentStatus }: RSVPDialogProps) {
  const isMobile = useIsMobile();
  const [selectedStatus, setSelectedStatus] = useState<"attending" | "maybe" | "declined" | null>(currentStatus || null)

  // Lock scroll when dialog is open
  useScrollLock(isOpen)

  const handleSubmit = () => {
    if (selectedStatus) {
      onRSVP(selectedStatus)
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedStatus(currentStatus || null)
    onClose()
  }

  // Use consistent component selection to prevent layout shifts
  const DialogWrapper = isMobile ? Sheet : Dialog;
  const DialogContentWrapper = isMobile ? SheetContent : DialogContent;
  const DialogHeaderWrapper = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleWrapper = isMobile ? SheetTitle : DialogTitle;

  const dialogProps = {
    open: isOpen,
    onOpenChange: onClose,
  };

  const contentProps = isMobile ? {
    side: "bottom" as const,
    className: "max-h-[95vh] overflow-hidden flex flex-col"
  } : {
    className: "sm:max-w-md p-0 overflow-hidden"
  };

  return (
    <DialogWrapper {...dialogProps}>
      <DialogContentWrapper {...contentProps}>
        <DialogHeaderWrapper className={`${isMobile ? "px-4 pt-4 pb-2" : "px-6 pt-6 pb-2"}`}>
          <DialogTitleWrapper className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-900`}>
            RSVP for Event
          </DialogTitleWrapper>
        </DialogHeaderWrapper>
        <div className={`${isMobile ? "flex-1 overflow-y-auto px-4 pb-2" : "px-6 pb-2"}`}>
          {eventTitle && (
            <div className="text-center mb-4">
              <h3 className={`font-semibold ${isMobile ? "text-base" : "text-lg"} text-gray-800`}>{eventTitle}</h3>
            </div>
          )}
          <div className="space-y-3">
            {RSVP_OPTIONS.map(option => {
              const isSelected = selectedStatus === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full flex items-center gap-3 rounded-xl border transition-all px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSelected ? option.selected : option.color}`}
                  onClick={() => setSelectedStatus(option.value)}
                >
                  <span className="flex-shrink-0">{option.icon}</span>
                  <span className="flex flex-col flex-1">
                    <span className={`font-semibold text-base ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{option.label}</span>
                    <span className="text-sm text-gray-500">{option.description}</span>
                  </span>
                  {isSelected && (
                    <Badge className="ml-2 bg-white text-green-600 border border-green-500">Selected</Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className={`${isMobile ? "px-4 pt-4 pb-4" : "px-6 pt-4 pb-6"} flex flex-col sm:flex-row gap-3 border-t bg-gray-50 ${isMobile ? "mt-auto" : "mt-6"}`}>
          <Button variant="packOutline" onClick={handleCancel} className="flex-1 py-2 text-base">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus}
            className="flex-1 py-2 text-base font-semibold shadow-md bg-accent hover:bg-accent/90 text-accent-foreground disabled:bg-muted disabled:text-muted-foreground"
          >
            Confirm RSVP
          </Button>
        </div>
      </DialogContentWrapper>
    </DialogWrapper>
  )
} 