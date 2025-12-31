import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === 'user';

    return (
        <div className={cn(
            "flex w-full gap-4 p-4",
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
            </div>
        </div>
    );
}
