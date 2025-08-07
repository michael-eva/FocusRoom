
"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { AppSidebar } from "../_components/app-sidebar"
import { UATDialog } from "./_components/UATDialog"
import { useUser } from "@clerk/nextjs"
import { api } from "~/trpc/react"

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isUATDialogOpen, setIsUATDialogOpen] = useState(false)
    const { user } = useUser()

    // UAT mutations
    const submitUATQuery = api.uat.submit.useMutation({
        onSuccess: async () => {
            alert("UAT query submitted successfully!");
        },
        onError: () => {
            alert("Failed to submit UAT query. Please try again.");
        }
    })

    const handleUATSubmit = async (query: string) => {
        if (!user?.id) return;

        try {
            await submitUATQuery.mutateAsync({
                query,
                clerkUserId: user.id,
                userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
                userEmail: user?.emailAddresses?.[0]?.emailAddress,
            });
        } catch (error) {
            console.error("Failed to submit UAT query:", error);
            throw error; // Re-throw to let the dialog handle the error
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex flex-col min-h-screen bg-background">
                    {/* Main Content */}
                    {children}

                    {/* Footer */}
                    <footer className="border-t border-border bg-background p-4">
                        <div className="max-w-6xl mx-auto">
                            {/* Mobile-first footer layout */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex gap-3 flex-row sm:items-center sm:gap-6">
                                    <Button
                                        variant="link"
                                        className="text-muted-foreground p-0 justify-start sm:justify-center hover:text-accent"
                                        onClick={() => setIsUATDialogOpen(true)}
                                    >
                                        Help
                                    </Button>
                                </div>
                                <p className="text-muted-foreground text-sm text-center sm:text-right">
                                    Keeping live music alive, together
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </SidebarInset>

            {/* UAT Dialog */}
            <UATDialog
                isOpen={isUATDialogOpen}
                onClose={() => setIsUATDialogOpen(false)}
                onSubmit={handleUATSubmit}
            />
        </SidebarProvider>
    )
}
