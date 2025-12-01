import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

interface RetentionMetricsProps {
    customers?: { total: number };
}

export function RetentionMetrics({ className, customers }: { className?: string } & RetentionMetricsProps) {
    // Use mock data for pie chart for now as we don't have this breakdown from simple API call
    // But we can use total customers for LTV calculation if we had total revenue

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Retenção e Clientes</CardTitle>
                <CardDescription>LTV e Fidelidade</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="h-[200px] flex items-center justify-center border rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground text-center px-4">
                        Gráfico de retenção indisponível<br />(Requer dados históricos detalhados)
                    </p>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                    <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Total de Clientes</span>
                        <div className="text-2xl font-bold">{customers?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">Cadastrados na loja</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">LTV (Lifetime Value)</span>
                        <div className="text-2xl font-bold">R$ 0,00</div>
                        <p className="text-xs text-muted-foreground">Média gasta por cliente</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
