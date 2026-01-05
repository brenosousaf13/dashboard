import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { KeyboardEvent, useRef, useState, useEffect } from "react";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 150);
            textarea.style.height = newHeight + 'px';
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput("");
            // Reset height after sending
            if (textareaRef.current) {
                textareaRef.current.style.height = '44px';
            }
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
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem para o Noord AI..."
                className="flex-1 min-h-[44px] max-h-[150px] py-3 px-4 resize-none rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto"
                rows={1}
                disabled={isLoading}
            />
            <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0"
            >
                <SendHorizontal className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
            </Button>
        </div>
    );
}

