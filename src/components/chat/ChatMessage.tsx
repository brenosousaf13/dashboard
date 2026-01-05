import { cn } from "@/lib/utils";
import { Bot, User, Copy, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    model?: string;
}

export function ChatMessage({ role, content, model }: ChatMessageProps) {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn(
            "flex w-full gap-4 p-4 group",
            isUser ? "flex-row-reverse bg-primary/5" : "bg-muted/50"
        )}>
            <div className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border",
                isUser ? "bg-primary text-primary-foreground" : "bg-background"
            )}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
                "flex-1 space-y-2 overflow-hidden",
                isUser ? "text-right" : "text-left"
            )}>
                <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
                {!isUser && (
                    <div className="flex items-center gap-2 pt-1">
                        {model && (
                            <span className="text-xs text-muted-foreground">
                                {model}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                            <span className="ml-1 text-xs">{copied ? "Copiado" : "Copiar"}</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

