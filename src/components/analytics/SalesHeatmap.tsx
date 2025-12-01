import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useMemo } from "react"

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const hours = Array.from({ length: 24 }, (_, i) => i)

interface SalesHeatmapProps {
    className?: string
    orders?: any[]
}

export function SalesHeatmap({ className, orders = [] }: SalesHeatmapProps) {
    const { grid, maxValue, bestTime } = useMemo(() => {
        // Initialize 7x24 grid with 0s
        const gridData = Array(7).fill(0).map(() => Array(24).fill(0))
        let max = 0
        let best = { day: 0, hour: 0, value: 0 }

        if (orders && orders.length > 0) {
            orders.forEach(order => {
                if (!order.date_created) return
                const date = new Date(order.date_created)
                const day = date.getDay() // 0 = Sunday
                const hour = date.getHours() // 0-23

                gridData[day][hour]++

                if (gridData[day][hour] > max) {
                    max = gridData[day][hour]
                }

                if (gridData[day][hour] > best.value) {
                    best = { day, hour, value: gridData[day][hour] }
                }
            })
        }

        return { grid: gridData, maxValue: max, bestTime: best }
    }, [orders])

    function getColor(value: number) {
        if (value === 0) return "bg-secondary" // Empty state
        if (maxValue === 0) return "bg-secondary"

        const intensity = value / maxValue
        if (intensity > 0.8) return "bg-primary"
        if (intensity > 0.6) return "bg-primary/80"
        if (intensity > 0.4) return "bg-primary/60"
        if (intensity > 0.2) return "bg-primary/40"
        return "bg-primary/20"
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Mapa de Calor de Vendas</CardTitle>
                <CardDescription>Melhores horários para vendas (Baseado em {orders?.length || 0} pedidos)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 overflow-x-auto">
                    <div className="flex">
                        <div className="w-10"></div>
                        {hours.map(h => (
                            <div key={h} className="w-6 text-center text-[10px] text-muted-foreground">
                                {h}
                            </div>
                        ))}
                    </div>
                    {days.map((day, dayIndex) => (
                        <div key={day} className="flex items-center">
                            <div className="w-10 text-xs text-muted-foreground">{day}</div>
                            {hours.map((h, hourIndex) => (
                                <div
                                    key={h}
                                    className={`w-6 h-6 m-[1px] rounded-sm transition-colors ${getColor(grid[dayIndex][hourIndex])}`}
                                    title={`${day} ${h}h: ${grid[dayIndex][hourIndex]} pedidos`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    {bestTime.value > 0 ? (
                        <>
                            Insight: <strong>{days[bestTime.day]}-feira às {bestTime.hour}h</strong> é o seu melhor horário ({bestTime.value} pedidos).
                        </>
                    ) : (
                        "Aguardando dados de pedidos para gerar insights."
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
