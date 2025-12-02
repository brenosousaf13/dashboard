import { useState, useEffect } from "react"
import { useData } from "../context/DataContext"
import { OverviewCards } from "../components/analytics/OverviewCards"
import { SalesChart } from "../components/analytics/SalesChart"
import { SalesHeatmap } from "../components/analytics/SalesHeatmap"
import { ProductPerformance } from "../components/analytics/ProductPerformance"
import { RetentionMetrics } from "../components/analytics/RetentionMetrics"
import { BrazilMap } from "../components/analytics/BrazilMap"
import { Button } from "../components/ui/button"
import { RefreshCw, Download, Loader2, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Input } from "../components/ui/input"
import { startOfMonth, endOfMonth, subDays, format, startOfDay, endOfDay, parseISO } from "date-fns"

export function AnalyticsPage() {
    const { data, syncAnalytics, isLoading, credentials } = useData()

    // Date Filter State
    const [dateFilter, setDateFilter] = useState("this_month")
    const [customStartDate, setCustomStartDate] = useState("")
    const [customEndDate, setCustomEndDate] = useState("")

    // Calculate initial date range based on "this_month"
    const [currentRange, setCurrentRange] = useState<{ from: Date, to: Date }>(() => {
        const now = new Date()
        return { from: startOfMonth(now), to: endOfMonth(now) }
    })

    // Initial sync on mount
    useEffect(() => {
        if (credentials && (!data?.sales || data.sales.length === 0)) {
            syncAnalytics(credentials, currentRange.from, currentRange.to)
        }
    }, [credentials])

    const handleApplyFilter = () => {
        const now = new Date()
        let from = now
        let to = now

        if (dateFilter === 'all') {
            // "All time" - using a wide range
            from = new Date(2020, 0, 1)
            to = now
        } else if (dateFilter === 'today') {
            from = startOfDay(now)
            to = endOfDay(now)
        } else if (dateFilter === 'this_month') {
            from = startOfMonth(now)
            to = endOfMonth(now)
        } else if (dateFilter === 'last_30_days') {
            from = subDays(now, 30)
            to = now
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
            from = parseISO(customStartDate)
            to = endOfDay(parseISO(customEndDate))
        }

        setCurrentRange({ from, to })
        syncAnalytics(credentials, from, to)
    }

    // Combine sales data with customer count for OverviewCards
    const overviewData = data?.sales && data.sales.length > 0 ? {
        total_sales: data.sales.reduce((acc, curr) => acc + parseFloat(curr.total_sales), 0).toString(),
        net_sales: data.sales.reduce((acc, curr) => acc + parseFloat(curr.net_sales), 0).toString(),
        average_sales: (data.sales.reduce((acc, curr) => acc + parseFloat(curr.total_sales), 0) / data.sales.length).toString(),
        total_orders: data.sales.reduce((acc, curr) => acc + parseInt(curr.total_orders), 0),
        total_items: data.sales.reduce((acc, curr) => acc + parseInt(curr.total_items), 0),
        total_tax: data.sales.reduce((acc, curr) => acc + parseFloat(curr.total_tax), 0).toString(),
        total_shipping: data.sales.reduce((acc, curr) => acc + parseFloat(curr.total_shipping), 0).toString(),
        total_refunds: data.sales.reduce((acc, curr) => acc + parseFloat(curr.total_refunds), 0),
        total_discount: data.sales.reduce((acc, curr) => acc + parseFloat(curr.total_discount), 0),
        totals_grouped_by: data.sales[0].totals_grouped_by || 'day',
        totals: {}, // Placeholder as we don't need detailed totals here
        total_customers: data.customers?.total || 0
    } : undefined

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Análises</h2>
                <div className="flex items-center space-x-2">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo o período</SelectItem>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="this_month">Este Mês</SelectItem>
                            <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>

                    {dateFilter === 'custom' && (
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-auto"
                            />
                            <Input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                    )}

                    <Button onClick={handleApplyFilter} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Aplicar
                    </Button>

                    <Button variant="default" className="bg-black hover:bg-gray-800">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Carregando dados da loja...</span>
                </div>
            ) : (
                <>
                    <OverviewCards data={overviewData} />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <SalesChart className="col-span-4" sales={data?.sales} />
                        <SalesHeatmap className="col-span-3" orders={data?.orders} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <ProductPerformance className="col-span-7" products={data?.products} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <RetentionMetrics className="col-span-4" customers={data?.customers} />
                        <BrazilMap className="col-span-3" orders={data?.orders} />
                    </div>
                </>
            )}
        </div>
    )
}
