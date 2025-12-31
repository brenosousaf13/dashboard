import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, MessageSquare, ShoppingBag, Tag, TrendingUp } from "lucide-react";

interface SuggestionCardsProps {
    onSelect: (suggestion: string) => void;
}

export function SuggestionCards({ onSelect }: SuggestionCardsProps) {
    const suggestions = [
        {
            icon: <Tag className="h-5 w-5 text-blue-500" />,
            title: "Descrição de Produto",
            prompt: "Crie uma descrição otimizada para SEO para o seguinte produto: [Nome do Produto], características: [Características]"
        },
        {
            icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
            title: "Copy para Instagram",
            prompt: "Escreva uma legenda engajadora para um post no Instagram sobre: [Assunto/Produto]"
        },
        {
            icon: <ShoppingBag className="h-5 w-5 text-green-500" />,
            title: "Estratégia de Venda",
            prompt: "Sugira uma estratégia de upsell para aumentar o ticket médio da minha loja de [Nicho]"
        },
        {
            icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
            title: "Melhorar Título",
            prompt: "Melhore o título deste produto para torná-lo mais atraente: [Título Atual]"
        },
        {
            icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
            title: "Ideia de Campanha",
            prompt: "Dê 3 ideias de campanhas de email marketing para [Data Comemorativa/Evento]"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-w-4xl mx-auto">
            {suggestions.map((suggestion, index) => (
                <Card
                    key={index}
                    className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
                    onClick={() => onSelect(suggestion.prompt)}
                >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                        <div className="p-2 bg-background rounded-full border shadow-sm">
                            {suggestion.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{suggestion.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {suggestion.prompt}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
