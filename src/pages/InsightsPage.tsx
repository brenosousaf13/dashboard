import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ChatMessage } from "../components/chat/ChatMessage";
import { ChatInput } from "../components/chat/ChatInput";
import { SuggestionCards } from "../components/chat/SuggestionCards";
import { Bot, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function InsightsPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            // Prepare messages for API (remove id and timestamp)
            const apiMessages = [...messages, newUserMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    userId: user?.id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();

            const newAssistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, newAssistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Noord AI
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Seu especialista em e-commerce
                        </p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearChat} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Nova Conversa
                    </Button>
                )}
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4 pb-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Como posso ajudar sua loja hoje?</h2>
                                <p className="text-muted-foreground">
                                    Escolha uma sugestão abaixo ou digite sua pergunta.
                                </p>
                            </div>
                            <SuggestionCards onSelect={handleSendMessage} />
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground p-4">
                                    <Bot className="h-4 w-4 animate-bounce" />
                                    <span className="text-sm">Digitando...</span>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="max-w-4xl mx-auto w-full">
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>
        </div>
    );
}
