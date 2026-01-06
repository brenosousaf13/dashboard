import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"
import { WidgetCard } from "../WidgetCard"

interface SalesChartProps {
    sales?: any[];
}

export function SalesChart({ className, sales }: { className?: string } & SalesChartProps) {
    // Transform sales data for chart
    const data = sales && sales.length > 0 ? sales.map((item: any) => {
        const [year, month, day] = item.date.split('-');
        return {
            name: `${day}/${month}`,
            total: parseFloat(item.total_sales)
        }
    }) : []

    return (
        <WidgetCard
            title="Vendas ao Longo do Tempo"
            subtitle="Comparativo com período anterior"
            className={className}
        >
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$ ${value}`}
                        />
                        <Tooltip
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                            contentStyle={{
                                backgroundColor: 'white',
                                borderColor: '#E5E7EB',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#1F2937' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill="url(#colorTotal)"
                            dot={false}
                            activeDot={{ r: 6, fill: '#8B5CF6', stroke: 'white', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </WidgetCard>
    )
}

