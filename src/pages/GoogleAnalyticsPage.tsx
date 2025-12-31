import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { WidgetSelector, WidgetId } from "../components/analytics/WidgetSelector";
import { WidgetGrid } from "../components/analytics/WidgetGrid";

export function GoogleAnalyticsPage() {
    const {
        googleConnected,
        connectGoogle,
        disconnectGoogle,
        gaProperties,
        gaPropertyId,
        setGaProperty,
        gaData,
        isGaLoading,
        fetchGaData,
        gaWidgetsConfig,
        saveGaWidgetsConfig,
        fetchGaProperties,
        isLoadingProfile
    } = useData();

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (googleConnected && gaProperties.length === 0) {
            fetchGaProperties();
        }
    }, [googleConnected]);

    // Auto-load data when property is selected
    useEffect(() => {
        if (googleConnected && gaPropertyId) {
            console.log('Auto-fetching GA data for property:', gaPropertyId);
            fetchGaData();
        }
    }, [googleConnected, gaPropertyId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchGaData();
        setIsRefreshing(false);
    };

    const handleSaveWidgets = async (widgets: WidgetId[]) => {
        await saveGaWidgetsConfig(widgets);
    };

    if (isLoadingProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verificando conexão...</p>
            </div>
        );
    }

    if (!googleConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Conectar Google Analytics</h2>
                    <p className="text-muted-foreground max-w-[500px]">
                        Conecte sua conta do Google para visualizar métricas de tráfego, usuários e conversões diretamente no seu dashboard.
                    </p>
                </div>
                <Button size="lg" onClick={connectGoogle} className="gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Conectar com Google
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Google Analytics 4</h2>
                    <p className="text-muted-foreground">
                        Acompanhe o desempenho do seu site em tempo real.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={gaPropertyId || ""} onValueChange={setGaProperty}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Selecione uma propriedade" />
                        </SelectTrigger>
                        <SelectContent>
                            {gaProperties.map((prop) => (
                                <SelectItem key={prop.id} value={prop.id}>
                                    {prop.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <WidgetSelector
                        enabledWidgets={gaWidgetsConfig as WidgetId[]}
                        onSave={handleSaveWidgets}
                    />

                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing || isGaLoading}>
                        <RefreshCw className={`h-4 w-4 ${isRefreshing || isGaLoading ? 'animate-spin' : ''}`} />
                    </Button>

                    <Button variant="destructive" size="sm" onClick={disconnectGoogle}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Desconectar
                    </Button>
                </div>
            </div>

            {!gaPropertyId ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhuma propriedade selecionada</AlertTitle>
                    <AlertDescription>
                        Selecione uma propriedade do Google Analytics 4 acima para visualizar os dados.
                    </AlertDescription>
                </Alert>
            ) : (
                <WidgetGrid
                    widgets={gaWidgetsConfig as WidgetId[]}
                    data={gaData}
                    isLoading={isGaLoading}
                />
            )}
        </div>
    );
}
