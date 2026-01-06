import { Sidebar } from "../components/Sidebar"
import { Header } from "../components/Header"
import { Outlet } from "react-router-dom"
import { SidebarProvider, useSidebar } from "../context/SidebarContext"
import { cn } from "../lib/utils"

function DashboardContent() {
    const { isCollapsed } = useSidebar()

    return (
        <div className="flex h-screen w-full bg-background">
            <Sidebar />
            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                isCollapsed ? "md:ml-20" : "md:ml-64"
            )}>
                <Header />
                <main className="flex-1 overflow-y-auto pt-[70px] custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export function DashboardLayout() {
    return (
        <SidebarProvider>
            <DashboardContent />
        </SidebarProvider>
    )
}
