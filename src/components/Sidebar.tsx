import { useState } from "react"
import { BarChart3, ChevronLeft, ChevronRight, Settings, ShoppingBag, Users, Package, Megaphone, LogOut } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const location = useLocation()
    const { signOut, user } = useAuth()

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-card transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 border-b">
                {!isCollapsed && <span className="text-lg font-bold">E-com Dash</span>}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("ml-auto", isCollapsed && "mx-auto")}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex-1 py-4">
                <nav className="grid gap-1 px-2">
                    <NavItem
                        icon={BarChart3}
                        label="Análises"
                        to="/analytics"
                        isActive={location.pathname === "/analytics"}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem icon={ShoppingBag} label="Pedidos" to="/orders" isActive={location.pathname === "/orders"} isCollapsed={isCollapsed} />
                    <NavItem icon={Users} label="Clientes" to="/customers" isActive={location.pathname === "/customers"} isCollapsed={isCollapsed} />
                    <NavItem icon={Package} label="Produtos" to="/products" isActive={location.pathname === "/products"} isCollapsed={isCollapsed} />
                    <NavItem
                        icon={Megaphone}
                        label="Campanhas"
                        to="/campaigns"
                        isActive={location.pathname === "/campaigns"}
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        icon={Settings}
                        label="Configurações"
                        to="/settings"
                        isActive={location.pathname === "/settings"}
                        isCollapsed={isCollapsed}
                    />
                </nav>
            </div>

            <div className="border-t p-4">
                <div className={cn("flex items-center gap-3 mb-4", isCollapsed && "justify-center")}>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.email?.[0].toUpperCase() || "U"}
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{user?.email}</span>
                            <span className="text-xs text-muted-foreground">Loja Exemplo</span>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
                        isCollapsed ? "justify-center px-2" : "px-4"
                    )}
                    onClick={signOut}
                >
                    <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>Sair</span>}
                </Button>
            </div>
        </div>
    )
}

interface NavItemProps {
    icon: React.ElementType
    label: string
    to: string
    isActive?: boolean
    isCollapsed?: boolean
}

function NavItem({ icon: Icon, label, to, isActive, isCollapsed }: NavItemProps) {
    return (
        <Link to={to}>
            <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary",
                    isCollapsed ? "justify-center px-2" : "px-4"
                )}
            >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>{label}</span>}
            </Button>
        </Link>
    )
}
