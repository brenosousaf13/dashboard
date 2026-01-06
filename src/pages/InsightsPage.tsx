import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData, ChatMessage as ChatMessageType } from "../context/DataContext";
import { ChatMessage } from "../components/chat/ChatMessage";
import { ChatInput } from "../components/chat/ChatInput";
import { SuggestionCards } from "../components/chat/SuggestionCards";
import { Bot, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AI_MODELS = [
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano (Econômico)" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-5-mini", label: "GPT-5 Mini (Balanceado)" },
];

export function InsightsPage() {
    const { user } = useAuth();
    const {
        chatMessages,
        selectedAiModel,
        addChatMessage,
        clearChatMessages,
        setAiModel
    } = useData();
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        const newUserMessage: ChatMessageType = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date()
        };

        addChatMessage(newUserMessage);
        setIsLoading(true);

        try {
            // Prepare messages for API (remove id and timestamp)
            const apiMessages = [...chatMessages, newUserMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    userId: user?.id,
                    model: selectedAiModel
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();

            const newAssistantMessage: ChatMessageType = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                model: selectedAiModel
            };

            addChatMessage(newAssistantMessage);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessageType = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
                timestamp: new Date(),
                model: selectedAiModel
            };
            addChatMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        clearChatMessages();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-70px)] bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-100 rounded-xl">
                        <Bot className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Noord AI
                            <Sparkles className="h-4 w-4 text-amber-500" />
                        </h1>
                        <p className="text-sm text-gray-500">
                            Seu especialista em e-commerce
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedAiModel} onValueChange={setAiModel}>
                        <SelectTrigger className="w-[200px] border-gray-200">
                            <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                            {AI_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                    {model.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {chatMessages.length > 0 ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Conversa
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Iniciar nova conversa?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        O histórico atual será perdido. Essa ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearChat} className="bg-violet-600 hover:bg-violet-700">
                                        Nova Conversa
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button variant="outline" size="sm" className="border-gray-200" disabled>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Conversa
                        </Button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4 pb-4">
                    {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900">Como posso ajudar sua loja hoje?</h2>
                                <p className="text-gray-500">
                                    Escolha uma sugestão abaixo ou digite sua pergunta.
                                </p>
                            </div>
                            <SuggestionCards onSelect={handleSendMessage} />
                        </div>
                    ) : (
                        <>
                            {chatMessages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    role={msg.role}
                                    content={msg.content}
                                    model={msg.model}
                                />
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-gray-500 p-4">
                                    <Bot className="h-4 w-4 animate-bounce text-violet-600" />
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

