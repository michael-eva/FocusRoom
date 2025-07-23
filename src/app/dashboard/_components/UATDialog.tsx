'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { Label } from "~/components/ui/label"
import { Loader2, Send } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useIsMobile } from "~/hooks/use-mobile"
import { useScrollLock } from "~/hooks/use-scroll-lock"

interface UATDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (query: string) => Promise<void>
}

export function UATDialog({ isOpen, onClose, onSubmit }: UATDialogProps) {
  const [query, setQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const isMobile = useIsMobile()

  // Lock scroll when dialog is open
  useScrollLock(isOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(query.trim())
      setQuery("")
      onClose()
    } catch (error) {
      console.error("Failed to submit UAT query:", error)
    } finally {
      setIsSubmitting(false)
    }
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
    className: "sm:max-w-[500px]"
  };

  return (
    <DialogWrapper {...dialogProps}>
      <DialogContentWrapper {...contentProps}>
        <DialogHeaderWrapper className={`${isMobile ? "px-4 pt-4 pb-2" : "px-6 pt-6 pb-2"}`}>
          <DialogTitleWrapper className={`${isMobile ? "text-xl" : "text-2xl"} font-semibold`}>
            Submit UAT Query
          </DialogTitleWrapper>
        </DialogHeaderWrapper>

        <div className={`${isMobile ? "flex-1 overflow-y-auto px-4 pb-4" : "px-6 pb-6"}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query" className="text-sm font-medium">
                Describe your query or feedback
              </Label>
              <Textarea
                id="query"
                placeholder="Please describe your query, bug report, feature request, or any feedback you'd like to share..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[120px] resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!query.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Query
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContentWrapper>
    </DialogWrapper>
  )
} 