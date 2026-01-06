import { Mail } from "lucide-react"
import { Button } from "./ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover"

interface Message {
    id: string
    sender: string
    subject: string
    preview: string
    time: string
    read: boolean
    avatar?: string
}

// Mock messages - in real app, this would come from context/API
const mockMessages: Message[] = [
    {
        id: "1",
        sender: "João Silva",
        subject: "Dúvida sobre pedido",
        preview: "Olá, gostaria de saber sobre o prazo de entrega...",
        time: "10 min atrás",
        read: false
    },
    {
        id: "2",
        sender: "Maria Santos",
        subject: "Troca de produto",
        preview: "Preciso solicitar a troca do produto que recebi...",
        time: "30 min atrás",
        read: false
    },
    {
        id: "3",
        sender: "Carlos Oliveira",
        subject: "Feedback positivo",
        preview: "Estou muito satisfeito com a compra...",
        time: "1 hora atrás",
        read: true
    }
]

export function MessageIcon() {
    const unreadCount = mockMessages.filter(m => !m.read).length

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-violet-50">
                    <Mail className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Mensagens</h4>
                    <Button variant="ghost" size="sm" className="text-xs text-violet-600 hover:text-violet-700">
                        Marcar todas como lidas
                    </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {mockMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!message.read ? "bg-violet-50/50" : ""
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm shrink-0">
                                    {message.sender.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900">{message.sender}</p>
                                        <p className="text-xs text-gray-400">{message.time}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium truncate">{message.subject}</p>
                                    <p className="text-xs text-gray-500 truncate">{message.preview}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t">
                    <Button variant="ghost" className="w-full text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                        Ver todas as mensagens
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
