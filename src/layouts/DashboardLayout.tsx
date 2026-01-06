import { Sidebar } from "../components/Sidebar"
import { Header } from "../components/Header"
import { Outlet } from "react-router-dom"

export function DashboardLayout() {
    return (
        <div className="flex h-screen w-full bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64">
                <Header />
                <main className="flex-1 overflow-y-auto pt-[70px] custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

