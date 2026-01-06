import { Bell } from "lucide-react"
import { Button } from "./ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover"

interface Notification {
    id: string
    title: string
    message: string
    time: string
    read: boolean
}

// Mock notifications - in real app, this would come from context/API
const mockNotifications: Notification[] = [
    {
        id: "1",
        title: "Novo pedido",
        message: "Pedido #1234 foi realizado",
        time: "5 min atrás",
        read: false
    },
    {
        id: "2",
        title: "Estoque baixo",
        message: "Produto X está com estoque baixo",
        time: "1 hora atrás",
        read: false
    },
    {
        id: "3",
        title: "Pagamento confirmado",
        message: "Pedido #1230 foi pago",
        time: "2 horas atrás",
        read: true
    }
]

export function NotificationBell() {
    const unreadCount = mockNotifications.filter(n => !n.read).length

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-violet-50">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    <Button variant="ghost" size="sm" className="text-xs text-violet-600 hover:text-violet-700">
                        Marcar todas como lidas
                    </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {mockNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? "bg-violet-50/50" : ""
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`h-2 w-2 rounded-full mt-2 ${!notification.read ? "bg-violet-500" : "bg-transparent"}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                    <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t">
                    <Button variant="ghost" className="w-full text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                        Ver todas as notificações
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
