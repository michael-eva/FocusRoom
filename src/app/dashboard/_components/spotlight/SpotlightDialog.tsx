"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { SpotlightSection } from "./SpotlightSection"


interface SpotlightDialogProps {
    isOpen: boolean
    onClose: () => void
    isAdmin?: boolean
}

export function SpotlightDialog({ isOpen, onClose, isAdmin = false }: SpotlightDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Spotlight & Discovery</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <SpotlightSection isAdmin={isAdmin} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
