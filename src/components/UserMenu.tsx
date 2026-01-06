import { ChevronDown, User, Settings, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover"
import { useAuth } from "../context/AuthContext"
import { useData } from "../context/DataContext"
import { useNavigate } from "react-router-dom"

export function UserMenu() {
    const { signOut, user } = useAuth()
    const { storeName, logoUrl } = useData()
    const navigate = useNavigate()

    const userInitials = user?.email?.[0].toUpperCase() || "U"
    const userName = user?.email?.split('@')[0] || "Usuário"

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-2 h-auto py-2 hover:bg-violet-50">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-violet-600 font-semibold">{userInitials}</span>
                        )}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900">{userName}</span>
                        <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
                <div className="flex flex-col gap-1">
                    <div className="px-2 py-2 border-b mb-1">
                        <p className="text-sm font-medium text-gray-900">{storeName || userName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => navigate('/settings')}
                    >
                        <User className="h-4 w-4" />
                        Perfil
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => navigate('/settings')}
                    >
                        <Settings className="h-4 w-4" />
                        Configurações
                    </Button>
                    <div className="border-t my-1" />
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={signOut}
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
