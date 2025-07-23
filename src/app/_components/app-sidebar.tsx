"use client"

import { Calendar, CheckSquare, FileText, Home, MessageSquare, Music, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar"

const menuItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
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
    // {
    //     title: "Resources/Docs",
    //     url: "#",
    //     icon: FileText,
    // },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar className="border-r border-border bg-sidebar">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-foreground rounded-full flex-shrink-0">
                        <span className="text-background font-bold text-sm">P</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-semibold text-sidebar-foreground truncate">pack music/</h2>
                        <p className="text-sm text-muted-foreground truncate">Focus Room</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                // Determine if this item is active based on the current pathname
                                const isActive = item.url === "#"
                                    ? false
                                    : pathname === item.url ||
                                    (item.url !== "/dashboard" && pathname.startsWith(item.url))

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            {item.url === "#" ? (
                                                <a href={item.url} className="flex items-center gap-3 w-full touch-target">
                                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                                    <span className="truncate">{item.title}</span>
                                                </a>
                                            ) : (
                                                <Link href={item.url} className="flex items-center gap-3 w-full touch-target">
                                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
