
import { useState } from "react"
import { BarChart3, ChevronLeft, ChevronRight, Settings, ShoppingBag, Users, Package, Megaphone, LogOut, LineChart, Bot, Menu, X } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useData } from "../context/DataContext"
import { StoreSettingsModal } from "./settings/StoreSettingsModal"

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
    const location = useLocation()
    const { signOut } = useAuth()
    const { storeName, logoUrl } = useData()

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 bg-white shadow-md"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed left-0 top-0 h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-50",
                    isCollapsed ? "w-20" : "w-64",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="flex h-[70px] items-center justify-between px-4 border-b border-gray-100">
                    {!isCollapsed && (
                        <div className="flex items-center gap-3">
                            {logoUrl ? (
                                <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">N</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">Noord</span>
                                </div>
                            )}
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg hidden md:flex",
                            isCollapsed && "mx-auto"
                        )}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
                    {/* MENU Section */}
                    {!isCollapsed && (
                        <div className="px-4 mb-2">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
                        </div>
                    )}
                    <nav className="grid gap-1 px-3">
                        <NavItem
                            icon={BarChart3}
                            label="Dashboard"
                            to="/analytics"
                            isActive={location.pathname === "/analytics"}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={ShoppingBag}
                            label="Pedidos"
                            to="/orders"
                            isActive={location.pathname === "/orders"}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={Users}
                            label="Clientes"
                            to="/customers"
                            isActive={location.pathname === "/customers"}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={Package}
                            label="Produtos"
                            to="/products"
                            isActive={location.pathname === "/products"}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={Megaphone}
                            label="Campanhas"
                            to="/campaigns"
                            isActive={location.pathname === "/campaigns"}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={LineChart}
                            label="Google Analytics"
                            to="/google-analytics"
                            isActive={location.pathname === "/google-analytics"}
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={Bot}
                            label="Assistente IA"
                            to="/insights"
                            isActive={location.pathname === "/insights"}
                            isCollapsed={isCollapsed}
                        />
                    </nav>

                    {/* GERAL Section */}
                    <div className="mt-6">
                        {!isCollapsed && (
                            <div className="px-4 mb-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Geral</span>
                            </div>
                        )}
                        <nav className="grid gap-1 px-3">
                            <NavItem
                                icon={Settings}
                                label="Configurações"
                                to="/settings"
                                isActive={location.pathname === "/settings"}
                                isCollapsed={isCollapsed}
                            />
                        </nav>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="border-t border-gray-100 p-4">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl",
                            isCollapsed ? "justify-center px-2" : "px-4"
                        )}
                        onClick={signOut}
                    >
                        <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                        {!isCollapsed && <span>Sair</span>}
                    </Button>
                </div>

                <StoreSettingsModal
                    isOpen={isStoreModalOpen}
                    onClose={() => setIsStoreModalOpen(false)}
                />
            </div>
        </>
    )
}

interface NavItemProps {
    icon: React.ElementType
    label: string
    to: string
    isActive?: boolean
    isCollapsed?: boolean
    badge?: number
}

function NavItem({ icon: Icon, label, to, isActive, isCollapsed, badge }: NavItemProps) {
    return (
        <Link to={to}>
            <div
                className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                        ? "bg-violet-100 text-violet-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    isCollapsed && "justify-center px-2"
                )}
            >
                {/* Active indicator */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-full" />
                )}

                <Icon className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-violet-600" : "text-gray-500"
                )} />

                {!isCollapsed && (
                    <>
                        <span className="flex-1">{label}</span>
                        {badge !== undefined && badge > 0 && (
                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-violet-600 text-white text-xs font-medium flex items-center justify-center">
                                {badge}
                            </span>
                        )}
                    </>
                )}
            </div>
        </Link>
    )
}

