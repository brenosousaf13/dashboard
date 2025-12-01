import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { DollarSign, Users, ShoppingCart, Activity, TrendingUp } from "lucide-react"

interface OverviewCardsProps {
    data?: {
        total_sales: string;
        net_sales: string;
        average_sales: string;
        total_orders: number;
        total_items: number;
        total_tax: string;
        total_shipping: string;
        total_refunds: number;
        total_discount: number;
        totals_grouped_by: string;
        totals: any;
        total_customers: number; // Added manually
    }
}

export function OverviewCards({ data }: OverviewCardsProps) {
    // Fallback to mock data if no real data
    const totalSales = data ? `R$ ${parseFloat(data.total_sales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"
    const ticket = data ? `R$ ${parseFloat(data.average_sales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"
    const orders = data ? data.total_orders : "0"
    const customers = data ? data.total_customers : "0"

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSales}</div>
                    <p className="text-xs text-muted-foreground">
                        +20.1% em relação ao mês anterior
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{ticket}</div>
                    <p className="text-xs text-muted-foreground">
                        +4% em relação ao mês anterior
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{orders}</div>
                    <p className="text-xs text-muted-foreground">
                        +12% em relação ao mês anterior
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{customers}</div>
                    <p className="text-xs text-muted-foreground">
                        +180 novos clientes
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">3.2%</div>
                    <p className="text-xs text-muted-foreground">
                        +0.4% em relação ao mês anterior
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
