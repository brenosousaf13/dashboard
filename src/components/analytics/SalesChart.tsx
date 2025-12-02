import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

interface SalesChartProps {
    sales?: any[];
}

export function SalesChart({ className, sales }: { className?: string } & SalesChartProps) {
    // Transform sales data for chart
    const data = sales && sales.length > 0 ? sales.map((item: any) => {
        // item.date is YYYY-MM-DD. Split to avoid timezone issues with new Date()
        const [year, month, day] = item.date.split('-');
        return {
            name: `${day}/${month}`,
            total: parseFloat(item.total_sales)
        }
    }) : []

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Vendas ao Longo do Tempo</CardTitle>
                <CardDescription>Comparativo com período anterior</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$ ${value}`}
                            />
                            <Tooltip
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
