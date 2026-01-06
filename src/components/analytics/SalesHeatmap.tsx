import { WidgetCard } from "../WidgetCard"
import { useMemo } from "react"

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const hours = Array.from({ length: 24 }, (_, i) => i)

interface SalesHeatmapProps {
    className?: string
    orders?: any[]
}

export function SalesHeatmap({ className, orders = [] }: SalesHeatmapProps) {
    const { grid, maxValue, bestTime } = useMemo(() => {
        const gridData = Array(7).fill(0).map(() => Array(24).fill(0))
        let max = 0
        let best = { day: 0, hour: 0, value: 0 }

        if (orders && orders.length > 0) {
            orders.forEach(order => {
                if (!order.date_created) return
                const date = new Date(order.date_created)
                const day = date.getDay()
                const hour = date.getHours()

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
        if (value === 0) return "bg-gray-100"
        if (maxValue === 0) return "bg-gray-100"

        const intensity = value / maxValue
        if (intensity > 0.8) return "bg-violet-600"
        if (intensity > 0.6) return "bg-violet-500"
        if (intensity > 0.4) return "bg-violet-400"
        if (intensity > 0.2) return "bg-violet-300"
        return "bg-violet-200"
    }

    return (
        <WidgetCard
            title="Mapa de Calor de Vendas"
            subtitle={`Baseado em ${orders?.length || 0} pedidos`}
            className={className}
        >
            <div className="flex flex-col gap-2 overflow-x-auto">
                <div className="flex">
                    <div className="w-10"></div>
                    {hours.map(h => (
                        <div key={h} className="w-6 text-center text-[10px] text-gray-400">
                            {h}
                        </div>
                    ))}
                </div>
                {days.map((day, dayIndex) => (
                    <div key={day} className="flex items-center">
                        <div className="w-10 text-xs text-gray-500 font-medium">{day}</div>
                        {hours.map((h, hourIndex) => (
                            <div
                                key={h}
                                className={`w-6 h-6 m-[1px] rounded-md transition-colors cursor-pointer hover:ring-2 hover:ring-violet-400 hover:ring-offset-1 ${getColor(grid[dayIndex][hourIndex])}`}
                                title={`${day} ${h}h: ${grid[dayIndex][hourIndex]} pedidos`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-violet-50 rounded-xl">
                <p className="text-sm text-gray-600">
                    {bestTime.value > 0 ? (
                        <>
                            💡 <span className="font-medium text-violet-700">{days[bestTime.day]}-feira às {bestTime.hour}h</span> é o seu melhor horário ({bestTime.value} pedidos).
                        </>
                    ) : (
                        "Aguardando dados de pedidos para gerar insights."
                    )}
                </p>
            </div>
        </WidgetCard>
    )
}

