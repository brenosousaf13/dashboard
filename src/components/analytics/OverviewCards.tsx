import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react"
import { StatCard } from "../StatCard"

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
        total_customers: number;
    }
}

export function OverviewCards({ data }: OverviewCardsProps) {
    const totalSales = data ? `R$ ${parseFloat(data.total_sales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"
    const ticket = data ? `R$ ${parseFloat(data.average_sales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"
    const orders = data ? data.total_orders.toString() : "0"
    const customers = data ? data.total_customers.toString() : "0"

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Vendas Totais"
                value={totalSales}
                change="+20.1%"
                changeType="positive"
                subtitle="vs mês anterior"
                highlighted={true}
                icon={<DollarSign className="h-5 w-5 text-violet-600" />}
            />
            <StatCard
                title="Ticket Médio"
                value={ticket}
                change="+4%"
                changeType="positive"
                subtitle="vs mês anterior"
                icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
            />
            <StatCard
                title="Pedidos"
                value={orders}
                change="+12%"
                changeType="positive"
                subtitle="vs mês anterior"
                icon={<ShoppingCart className="h-5 w-5 text-gray-500" />}
            />
            <StatCard
                title="Clientes Ativos"
                value={customers}
                change="+180"
                changeType="positive"
                subtitle="novos clientes"
                icon={<Users className="h-5 w-5 text-gray-500" />}
            />
        </div>
    )
}

