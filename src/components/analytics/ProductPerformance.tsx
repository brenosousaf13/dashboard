import { WidgetCard } from "../WidgetCard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { TrendingUp } from "lucide-react"

interface ProductPerformanceProps {
    products?: any[];
}

export function ProductPerformance({ className, products = [] }: { className?: string } & ProductPerformanceProps) {
    const sortedByRevenue = [...products].sort((a, b) => b.net_revenue - a.net_revenue).slice(0, 10);

    return (
        <WidgetCard
            title="Performance de Produtos"
            subtitle="Top 10 produtos por receita"
            className={className}
        >
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-gray-100 hover:bg-transparent">
                            <TableHead className="text-gray-500 font-medium">Produto</TableHead>
                            <TableHead className="text-right text-gray-500 font-medium">Unidades</TableHead>
                            <TableHead className="text-right text-gray-500 font-medium">Pedidos</TableHead>
                            <TableHead className="text-right text-gray-500 font-medium">Receita</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedByRevenue.length > 0 ? (
                            sortedByRevenue.map((product, index) => (
                                <TableRow key={product.product_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold ${index === 0 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <span className="truncate max-w-[200px]">
                                                {product.extended_info?.name || product.name || "Nome Indisponível"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-600">{product.items_sold}</TableCell>
                                    <TableCell className="text-right text-gray-600">{product.orders_count}</TableCell>
                                    <TableCell className="text-right font-semibold text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.net_revenue)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-400 h-32">
                                    <div className="flex flex-col items-center gap-2">
                                        <TrendingUp className="h-8 w-8 text-gray-300" />
                                        <p>Nenhum dado de produto encontrado para o período selecionado.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </WidgetCard>
    )
}

