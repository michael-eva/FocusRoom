import { Calendar, CheckSquare, FileText, Home, MessageSquare, Music, Settings } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar"



const menuItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: true,
    },
    {
        title: "Calendar & RSVP",
        url: "/dashboard/calendar",
        icon: Calendar,
    },
    {
        title: "Projects & Tasks",
        url: "/dashboard/projects",
        icon: CheckSquare,
    },
    {
        title: "Community Feed",
        url: "/dashboard/community",
        icon: MessageSquare,
    },
    {
        title: "Resources/Docs",
        url: "#",
        icon: FileText,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

export function AppSidebar() {
    return (
        <Sidebar className="border-r">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full">
                        <Music className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">Pack</h2>
                        <p className="text-sm text-gray-600">Australia</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={item.isActive}>
                                        <a href={item.url} className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
