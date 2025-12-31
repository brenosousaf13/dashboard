import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { InsightCategory } from "../components/insights/InsightCategory";
import {
    calculateAlerts,
    calculateOpportunities,
    calculatePerformance,
    Insight
} from "../components/insights/insightCalculators";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";

export function InsightsPage() {
    const {
        data,
        isLoading,
        syncData,
        credentials,
        dateFilter,
        customStartDate,
        customEndDate
    } = useData();

    const [alerts, setAlerts] = useState<Insight[]>([]);
    const [opportunities, setOpportunities] = useState<Insight[]>([]);
    const [performance, setPerformance] = useState<Insight[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    const calculateInsights = () => {
        if (!data) return;
        setIsCalculating(true);

        // Simulate calculation delay for better UX
        setTimeout(() => {
            const newAlerts = calculateAlerts(data.productsList || [], data.orders || []);
            const newOpportunities = calculateOpportunities(data.orders || [], data.sales || []);
            const newPerformance = calculatePerformance(data.sales || [], data.customersList || [], data.products || []);

            setAlerts(newAlerts);
            setOpportunities(newOpportunities);
            setPerformance(newPerformance);
            setIsCalculating(false);
        }, 500);
    };

    useEffect(() => {
        calculateInsights();
    }, [data]);

    const handleRefresh = async () => {
        if (credentials) {
            await syncData(credentials, undefined, undefined, true);
        }
    };

    return (
        <div className="p-8 pt-6 space-y-6 h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-yellow-500" />
                        Insights Inteligentes
                    </h2>
                    <p className="text-muted-foreground">
                        Descubra oportunidades e alertas importantes para seu negócio.
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={isLoading || isCalculating}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || isCalculating ? 'animate-spin' : ''}`} />
                    Atualizar Insights
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <InsightCategory
                    title="Alertas"
                    type="alert"
                    insights={alerts}
                />
                <InsightCategory
                    title="Oportunidades"
                    type="opportunity"
                    insights={opportunities}
                />
                <InsightCategory
                    title="Performance"
                    type="performance"
                    insights={performance}
                />
            </div>
        </div>
    );
}
