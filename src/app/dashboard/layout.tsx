
import { SidebarProvider, SidebarInset, SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"

import { Bell, User } from "lucide-react"
import { AppSidebar } from "../_components/app-sidebar"

export default function layout({ children }: { children: React.ReactNode }) {
    const recentActivities = [
        { id: 1, text: "Ellie posted in Community Feed" },
        { id: 2, text: "Setlist Swap created a new event" },
        { id: 3, text: "Johnny added a task to Project X" },
    ]

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex flex-col min-h-screen">
                    {/* Main Content */}
                    {children}

                    {/* Footer */}
                    <footer className="border-t bg-white p-4">
                        <div className="max-w-6xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <Button variant="link" className="text-gray-600 p-0">
                                    Help
                                </Button>
                                <Button variant="link" className="text-gray-600 p-0">
                                    Contact
                                </Button>
                            </div>
                            <p className="text-gray-600 text-sm">Keeping live music alive, together</p>
                        </div>
                    </footer>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
