import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

interface ProductPerformanceProps {
    products?: any[];
}

export function ProductPerformance({ className, products = [] }: { className?: string } & ProductPerformanceProps) {
    // Analytics API returns: product_id, items_sold, net_revenue, orders_count, extended_info.name
    const sortedByRevenue = [...products].sort((a, b) => b.net_revenue - a.net_revenue).slice(0, 10);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Performance de Produtos</CardTitle>
                <CardDescription>Top 10 produtos por receita e unidades vendidas</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Unidades Vendidas</TableHead>
                            <TableHead className="text-right">Pedidos</TableHead>
                            <TableHead className="text-right">Receita Líquida</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedByRevenue.length > 0 ? (
                            sortedByRevenue.map((product) => (
                                <TableRow key={product.product_id}>
                                    <TableCell className="font-medium">{product.extended_info?.name || product.name || "Nome Indisponível"}</TableCell>
                                    <TableCell className="text-right">{product.items_sold}</TableCell>
                                    <TableCell className="text-right">{product.orders_count}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.net_revenue)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    Nenhum dado de produto encontrado para o período selecionado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
