import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { KeyboardEvent, useRef, useState } from "react";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="relative flex items-end gap-2 p-4 border-t bg-background">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem para o Noord AI..."
                className="min-h-[60px] w-full resize-none bg-background pr-12"
                rows={1}
                disabled={isLoading}
            />
            <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-6 bottom-6 h-8 w-8"
            >
                <SendHorizontal className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
            </Button>
        </div>
    );
}
