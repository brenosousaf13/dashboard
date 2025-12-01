import { useState, useEffect } from "react"
import { CalendarDateRangePicker } from "../components/DateRangePicker"
import { OverviewCards } from "../components/analytics/OverviewCards"
import { SalesChart } from "../components/analytics/SalesChart"
import { SalesHeatmap } from "../components/analytics/SalesHeatmap"

import { ProductPerformance } from "../components/analytics/ProductPerformance"
import { RetentionMetrics } from "../components/analytics/RetentionMetrics"
import { BrazilMap } from "../components/analytics/BrazilMap"
import { Button } from "../components/ui/button"
import { Download, RefreshCw, Loader2 } from "lucide-react"
import { useData } from "../context/DataContext"
import { type DateRange } from "react-day-picker"
import { subDays } from "date-fns"

export function AnalyticsPage() {
    const { data, isLoading, syncAnalytics, credentials } = useData()
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })

    // Sync data when date changes or credentials load
    useEffect(() => {
        if (credentials && date?.from && date?.to) {
            syncAnalytics(credentials, date.from, date.to)
        }
    }, [credentials, date?.from, date?.to]) // Sync whenever credentials or date changes

    const handleRefresh = async () => {
        if (date?.from && date?.to) {
            await syncAnalytics(credentials, date.from, date.to, true)
        } else {
            await syncAnalytics(credentials, undefined, undefined, true)
        }
    }

    console.log('AnalyticsPage Data:', data);

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

    console.log('Overview Data Calculated:', overviewData);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Análises</h2>
                <div className="flex items-center space-x-2">
                    <CalendarDateRangePicker date={date} setDate={setDate} />
                    <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Atualizar
                    </Button>
                    <Button size="sm">
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
