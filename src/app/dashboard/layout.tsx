
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { AppSidebar } from "../_components/app-sidebar"

export default function layout({ children }: { children: React.ReactNode }) {
    

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
