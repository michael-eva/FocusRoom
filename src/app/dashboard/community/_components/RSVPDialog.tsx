"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Check, X, HelpCircle } from "lucide-react"
import { useScrollLock } from "~/hooks/use-scroll-lock"

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-900">RSVP for Event</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-2">
          {eventTitle && (
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800">{eventTitle}</h3>
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
        <div className="px-6 pt-4 pb-6 flex flex-col sm:flex-row gap-3 border-t bg-gray-50 mt-6">
          <Button variant="outline" onClick={handleCancel} className="flex-1 py-2 text-base">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus}
            className="flex-1 py-2 text-base font-semibold shadow-md bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            Confirm RSVP
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 