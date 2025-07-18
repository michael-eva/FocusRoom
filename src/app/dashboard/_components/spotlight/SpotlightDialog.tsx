"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { SpotlightSection } from "./SpotlightSection"
import { useIsMobile } from "~/hooks/use-mobile"
import { useScrollLock } from "~/hooks/use-scroll-lock"

interface SpotlightDialogProps {
    isOpen: boolean
    onClose: () => void
    isAdmin?: boolean
}

export function SpotlightDialog({ isOpen, onClose, isAdmin = false }: SpotlightDialogProps) {
    const isMobile = useIsMobile();

    // Lock scroll when dialog is open
    useScrollLock(isOpen)

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
        className: "sm:max-w-6xl max-h-[90vh] overflow-y-auto"
    };

    return (
        <DialogWrapper {...dialogProps}>
            <DialogContentWrapper {...contentProps}>
                <DialogHeaderWrapper className={isMobile ? "pb-2" : ""}>
                    <DialogTitleWrapper className={`${isMobile ? "text-lg" : "text-xl"}`}>
                        Spotlight & Discovery
                    </DialogTitleWrapper>
                </DialogHeaderWrapper>

                <div className={`${isMobile ? "flex-1 overflow-y-auto px-4 pb-4" : "mt-4 px-6"}`}>
                    <SpotlightSection isAdmin={isAdmin} />
                </div>
            </DialogContentWrapper>
        </DialogWrapper>
    )
}
