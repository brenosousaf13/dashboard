import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Insight } from "./insightCalculators";

interface InsightCardProps {
    insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
    const { type, icon, title, message, action } = insight;

    const getColors = () => {
        switch (type) {
            case 'alert':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'opportunity':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'performance':
                return 'bg-green-50 border-green-200 text-green-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    return (
        <Card className={`border ${getColors()}`}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <span className="text-2xl">{icon}</span>
                <CardTitle className="text-lg font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm mb-4">{message}</p>
                {action && (
                    <Button variant="outline" size="sm" asChild className="w-full bg-white/50 hover:bg-white/80 border-black/10">
                        {action.href ? (
                            <Link to={action.href}>{action.label}</Link>
                        ) : (
                            <span onClick={action.onClick} className="cursor-pointer">{action.label}</span>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
