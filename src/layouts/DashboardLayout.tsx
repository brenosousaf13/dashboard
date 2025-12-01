import { Sidebar } from "../components/Sidebar"
import { Outlet } from "react-router-dom"

export function DashboardLayout() {
    return (
        <div className="flex h-screen w-full bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-muted/10">
                <Outlet />
            </main>
        </div>
    )
}
