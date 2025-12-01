import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/DateRangePicker"
import type { DateRange } from "react-day-picker"

interface ABCCurveAnalysisProps {
    products: any[]
    dateRange: DateRange | undefined
    onDateRangeChange: (range: DateRange | undefined) => void
}

export function ABCCurveAnalysis({ products, dateRange, onDateRangeChange }: ABCCurveAnalysisProps) {

    // Calculate ABC Classification
    const abcData = useMemo(() => {
        if (!products || !Array.isArray(products)) return {
            totalRevenue: 0,
            classifiedProducts: [],
            stats: {
                A: { count: 0, revenue: 0, items: [] },
                B: { count: 0, revenue: 0, items: [] },
                C: { count: 0, revenue: 0, items: [] },
            }
        }

        // 1. Filter products with sales > 0
        const activeProducts = products.filter((p: any) => p.net_revenue > 0)

        // 2. Sort by revenue descending
        const sortedProducts = [...activeProducts].sort((a, b) => b.net_revenue - a.net_revenue)

        // 3. Calculate total revenue
        const totalRevenue = sortedProducts.reduce((acc, p) => acc + p.net_revenue, 0)

        // 4. Assign classes
        let accumulatedRevenue = 0
        const classifiedProducts = sortedProducts.map(product => {
            accumulatedRevenue += product.net_revenue
            const percentage = (accumulatedRevenue / totalRevenue) * 100

            let classification = 'C'
            if (percentage <= 80) classification = 'A'
            else if (percentage <= 95) classification = 'B'

            return {
                ...product,
                classification,
                share: (product.net_revenue / totalRevenue) * 100
            }
        })

        const classA = classifiedProducts.filter(p => p.classification === 'A')
        const classB = classifiedProducts.filter(p => p.classification === 'B')
        const classC = classifiedProducts.filter(p => p.classification === 'C')

        return {
            totalRevenue,
            classifiedProducts,
            stats: {
                A: { count: classA.length, revenue: classA.reduce((acc, p) => acc + p.net_revenue, 0), items: classA },
                B: { count: classB.length, revenue: classB.reduce((acc, p) => acc + p.net_revenue, 0), items: classB },
                C: { count: classC.length, revenue: classC.reduce((acc, p) => acc + p.net_revenue, 0), items: classC },
            }
        }
    }, [products])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Análise Curva ABC</CardTitle>
                        <CardDescription>Classificação de produtos por importância no faturamento</CardDescription>
                    </div>
                    <CalendarDateRangePicker date={dateRange} setDate={onDateRangeChange} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">Classe A (80% da Receita)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-900">{abcData.stats.A.count} Produtos</div>
                            <p className="text-xs text-green-700">
                                {formatCurrency(abcData.stats.A.revenue)} ({formatPercent((abcData.stats.A.revenue / abcData.totalRevenue) * 100 || 0)})
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Classe B (15% da Receita)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">{abcData.stats.B.count} Produtos</div>
                            <p className="text-xs text-blue-700">
                                {formatCurrency(abcData.stats.B.revenue)} ({formatPercent((abcData.stats.B.revenue / abcData.totalRevenue) * 100 || 0)})
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-800">Classe C (5% da Receita)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-900">{abcData.stats.C.count} Produtos</div>
                            <p className="text-xs text-orange-700">
                                {formatCurrency(abcData.stats.C.revenue)} ({formatPercent((abcData.stats.C.revenue / abcData.totalRevenue) * 100 || 0)})
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="A" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="A">Produtos Classe A</TabsTrigger>
                        <TabsTrigger value="B">Produtos Classe B</TabsTrigger>
                        <TabsTrigger value="C">Produtos Classe C</TabsTrigger>
                    </TabsList>
                    {['A', 'B', 'C'].map((className) => (
                        <TabsContent key={className} value={className}>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-right">Vendas (Unid.)</TableHead>
                                            <TableHead className="text-right">Receita</TableHead>
                                            <TableHead className="text-right">% Share</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {abcData.stats[className as 'A' | 'B' | 'C'].items.length > 0 ? (
                                            abcData.stats[className as 'A' | 'B' | 'C'].items.map((product: any) => (
                                                <TableRow key={product.product_id}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell className="text-right">{product.items_sold}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(product.net_revenue)}</TableCell>
                                                    <TableCell className="text-right">{formatPercent(product.share)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                    Nenhum produto nesta classe para o período selecionado.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
