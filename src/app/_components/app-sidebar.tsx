"use client"

import { Calendar, CheckSquare, FileText, Home, MessageSquare, Music, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "~/components/ui/sidebar"
import Image from "next/image"
import { useUserRole } from "~/hooks/useUserRole"

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
    const userRole = useUserRole()
    const { setOpenMobile, isMobile } = useSidebar()

    // Filter menu items based on user role
    const filteredMenuItems = menuItems.filter(item => {
        if (item.title === "Settings") {
            return userRole === "admin"
        }
        return true
    })

    // Function to handle menu item clicks and close sidebar on mobile
    const handleMenuItemClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    return (
        <Sidebar className="border-r border-border bg-sidebar">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3 justify-center">
                    <div className="min-w-0">
                        {/* <h2 className="font-semibold text-sidebar-foreground truncate">pack music/</h2> */}
                        <Image src="/pack-logo.svg" alt="Pack Music" width={100} height={100} />
                        <p className="text-sm text-muted-foreground truncate">Focus Room</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredMenuItems.map((item) => {
                                // Determine if this item is active based on the current pathname
                                const isActive = item.url === "#"
                                    ? false
                                    : pathname === item.url ||
                                    (item.url !== "/dashboard" && pathname.startsWith(item.url))

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            {item.url === "#" ? (
                                                <a href={item.url} className="flex items-center gap-3 w-full touch-target" onClick={handleMenuItemClick}>
                                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                                    <span className="truncate">{item.title}</span>
                                                </a>
                                            ) : (
                                                <Link href={item.url} className="flex items-center gap-3 w-full touch-target" onClick={handleMenuItemClick}>
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
