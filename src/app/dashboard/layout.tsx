
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
                        <div className="max-w-6xl mx-auto">
                            {/* Mobile-first footer layout */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex gap-3 flex-row sm:items-center sm:gap-6">
                                    <Button variant="link" className="text-gray-600 p-0 justify-start sm:justify-center">
                                        Help
                                    </Button>
                                    <Button variant="link" className="text-gray-600 p-0 justify-start sm:justify-center">
                                        Contact
                                    </Button>
                                </div>
                                <p className="text-gray-600 text-sm text-center sm:text-right">Keeping live music alive, together</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
