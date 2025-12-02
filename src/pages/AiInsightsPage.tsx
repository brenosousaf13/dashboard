import { useState, useRef, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { sendMessageToGemini, ChatMessage } from "@/services/geminiService";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiInsightsPage() {
    const { data, storeName } = useData();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            parts: [{ text: `Olá! Sou seu Co-piloto de IA. Estou analisando os dados da ${storeName || 'sua loja'} e pronto para ajudar. O que você gostaria de saber sobre suas vendas, clientes ou produtos hoje?` }]
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare context data - filter to relevant parts to avoid token limits if necessary
            // For now, passing the whole data object structure but we might want to be selective
            const contextData = {
                storeName,
                salesSummary: data?.sales?.slice(-30), // Last 30 days sales
                topProducts: data?.products?.slice(0, 10), // Top 10 products
                recentOrders: data?.orders?.slice(0, 20), // Last 20 orders
                customerStats: data?.customers,
                date: new Date().toISOString()
            };

            const responseText = await sendMessageToGemini(input, messages, contextData);

            const aiMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error in chat:", error);
            const errorMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: "Desculpe, tive um problema ao processar sua solicitação. Por favor, tente novamente." }]
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Insights de IA</h1>
                    <p className="text-muted-foreground">Seu assistente inteligente para análise de dados</p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-md bg-background/50 backdrop-blur-sm">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex w-full gap-3",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === 'model' && (
                                    <Avatar className="h-8 w-8 border bg-primary/10">
                                        <AvatarFallback><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={cn(
                                        "rounded-lg px-4 py-2 max-w-[80%] text-sm shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card border"
                                    )}
                                >
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.parts[0].text}
                                    </div>
                                </div>

                                {msg.role === 'user' && (
                                    <Avatar className="h-8 w-8 border bg-muted">
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex w-full gap-3 justify-start">
                                <Avatar className="h-8 w-8 border bg-primary/10">
                                    <AvatarFallback><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                                </Avatar>
                                <div className="bg-card border rounded-lg px-4 py-3 shadow-sm flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Analisando dados...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-card/50">
                    <div className="flex gap-2 max-w-4xl mx-auto">
                        <Input
                            placeholder="Pergunte sobre suas vendas, clientes ou produtos..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Enviar</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
