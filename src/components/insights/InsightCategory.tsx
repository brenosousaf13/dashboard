import { ScrollArea } from "@/components/ui/scroll-area";
import { InsightCard } from "./InsightCard";
import { Insight } from "./insightCalculators";
import { AlertCircle, Lightbulb, TrendingUp } from "lucide-react";

interface InsightCategoryProps {
    title: string;
    type: 'alert' | 'opportunity' | 'performance';
    insights: Insight[];
}

export function InsightCategory({ title, type, insights }: InsightCategoryProps) {
    const getIcon = () => {
        switch (type) {
            case 'alert': return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'opportunity': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
            case 'performance': return <TrendingUp className="w-5 h-5 text-green-600" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'alert': return 'text-red-700';
            case 'opportunity': return 'text-yellow-700';
            case 'performance': return 'text-green-700';
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className={`flex items-center gap-2 font-bold text-lg ${getHeaderColor()}`}>
                {getIcon()}
                {title}
                <span className="ml-auto text-sm bg-black/5 px-2 py-0.5 rounded-full">
                    {insights.length}
                </span>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                <div className="space-y-4 pb-4">
                    {insights.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                            <p>Nenhum insight nesta categoria no momento.</p>
                        </div>
                    ) : (
                        insights.map(insight => (
                            <InsightCard key={insight.id} insight={insight} />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
