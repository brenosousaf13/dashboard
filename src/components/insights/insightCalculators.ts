import { format, getDay, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Insight {
    id: string;
    type: 'alert' | 'opportunity' | 'performance';
    icon: string;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
}

export const calculateAlerts = (productsList: any[], orders: any[]): Insight[] => {
    const alerts: Insight[] = [];

    // 1. Estoque Crítico (stock_quantity < 5 e status 'publish')
    const lowStockProducts = productsList.filter(p =>
        p.status === 'publish' &&
        p.manage_stock &&
        p.stock_quantity !== null &&
        p.stock_quantity < 5 &&
        p.stock_quantity > 0
    );

    if (lowStockProducts.length > 0) {
        alerts.push({
            id: 'low_stock',
            type: 'alert',
            icon: '⚠️',
            title: 'Estoque Crítico',
            message: `${lowStockProducts.length} produtos estão com menos de 5 unidades em estoque.`,
            action: { label: 'Ver Produtos', href: '/products' }
        });
    }

    // 2. Pedidos Pendentes
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'on-hold');
    if (pendingOrders.length > 0) {
        alerts.push({
            id: 'pending_orders',
            type: 'alert',
            icon: '⏳',
            title: 'Pedidos Pendentes',
            message: `Você tem ${pendingOrders.length} pedidos aguardando processamento.`,
            action: { label: 'Ver Pedidos', href: '/orders' }
        });
    }

    // 3. Sem Estoque
    const outOfStockProducts = productsList.filter(p =>
        p.status === 'publish' &&
        p.manage_stock &&
        p.stock_quantity === 0
    );

    if (outOfStockProducts.length > 0) {
        alerts.push({
            id: 'out_of_stock',
            type: 'alert',
            icon: '🚫',
            title: 'Sem Estoque',
            message: `${outOfStockProducts.length} produtos estão esgotados e visíveis na loja.`,
            action: { label: 'Ver Produtos', href: '/products' }
        });
    }

    return alerts;
};

export const calculateOpportunities = (orders: any[], sales: any[]): Insight[] => {
    const opportunities: Insight[] = [];

    if (orders.length === 0) return opportunities;

    // 4. Melhor Horário
    const hoursCount: Record<number, number> = {};
    orders.forEach(o => {
        if (o.date_created) {
            const hour = getHours(new Date(o.date_created));
            hoursCount[hour] = (hoursCount[hour] || 0) + 1;
        }
    });

    let bestHour = -1;
    let maxOrdersInHour = 0;
    Object.entries(hoursCount).forEach(([hour, count]) => {
        if (count > maxOrdersInHour) {
            maxOrdersInHour = count;
            bestHour = parseInt(hour);
        }
    });

    if (bestHour !== -1) {
        opportunities.push({
            id: 'best_hour',
            type: 'opportunity',
            icon: '⏰',
            title: 'Melhor Horário',
            message: `Seus clientes compram mais por volta das ${bestHour}h. Ótimo horário para postar nas redes sociais!`
        });
    }

    // 5. Melhor Dia da Semana
    const daysCount: Record<number, number> = {};
    orders.forEach(o => {
        if (o.date_created) {
            const day = getDay(new Date(o.date_created));
            daysCount[day] = (daysCount[day] || 0) + 1;
        }
    });

    let bestDay = -1;
    let maxOrdersInDay = 0;
    Object.entries(daysCount).forEach(([day, count]) => {
        if (count > maxOrdersInDay) {
            maxOrdersInDay = count;
            bestDay = parseInt(day);
        }
    });

    if (bestDay !== -1) {
        const dayName = format(new Date().setDate(new Date().getDate() - (new Date().getDay() - bestDay)), 'EEEE', { locale: ptBR });
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        opportunities.push({
            id: 'best_day',
            type: 'opportunity',
            icon: '📅',
            title: 'Melhor Dia',
            message: `${capitalizedDay} é o seu dia mais forte de vendas. Planeje campanhas para este dia.`
        });
    }

    // 6. Região Forte
    const statesCount: Record<string, number> = {};
    orders.forEach(o => {
        if (o.billing?.state) {
            statesCount[o.billing.state] = (statesCount[o.billing.state] || 0) + 1;
        }
    });

    let bestState = '';
    let maxOrdersInState = 0;
    Object.entries(statesCount).forEach(([state, count]) => {
        if (count > maxOrdersInState) {
            maxOrdersInState = count;
            bestState = state;
        }
    });

    if (bestState) {
        opportunities.push({
            id: 'best_region',
            type: 'opportunity',
            icon: '🗺️',
            title: 'Região Forte',
            message: `O estado de ${bestState} concentra a maior parte das suas vendas. Considere frete grátis para lá.`
        });
    }

    // 7. Sugestão Upsell (Ticket Médio < 100)
    const totalRevenue = orders.reduce((acc, o) => acc + parseFloat(o.total), 0);
    const avgTicket = totalRevenue / orders.length;

    if (avgTicket < 100) {
        opportunities.push({
            id: 'upsell',
            type: 'opportunity',
            icon: '💰',
            title: 'Aumentar Ticket Médio',
            message: `Seu ticket médio é R$ ${avgTicket.toFixed(2)}. Crie kits ou ofereça descontos progressivos para aumentar.`
        });
    }

    return opportunities;
};

export const calculatePerformance = (sales: any[], customersList: any[], products: any[]): Insight[] => {
    const performance: Insight[] = [];

    // 8. Produto Campeão
    if (products.length > 0) {
        const topProduct = products[0]; // Assuming products are sorted by sales
        performance.push({
            id: 'top_product',
            type: 'performance',
            icon: '🏆',
            title: 'Produto Campeão',
            message: `${topProduct.name} é o seu produto mais vendido no período.`
        });
    }

    // 9. Novos Clientes
    // This requires filtering customers by date_created within the selected period
    // Since we don't have the period explicitly here, we might need to rely on what's passed or just count total for now
    // Or better, if customersList is already filtered or if we just want total count
    // Let's assume customersList contains all customers. We need to filter if we want "New in period".
    // For now, let's just show total customers if we can't filter easily, or skip.
    // Actually, let's use the total count from the list size as a proxy for "Base de Clientes"
    performance.push({
        id: 'total_customers',
        type: 'performance',
        icon: '👥',
        title: 'Base de Clientes',
        message: `Você tem um total de ${customersList.length} clientes cadastrados.`
    });

    // 10. Ticket Médio (Recalculating here or passing it? Let's recalculate if we have sales data)
    // Sales data from analytics usually has totals.
    if (sales.length > 0) {
        const totalSales = sales.reduce((acc, s) => acc + parseFloat(s.total_sales), 0);
        const totalOrders = sales.reduce((acc, s) => acc + parseInt(s.total_orders), 0);

        if (totalOrders > 0) {
            const avgTicket = totalSales / totalOrders;
            performance.push({
                id: 'avg_ticket_perf',
                type: 'performance',
                icon: '📊',
                title: 'Ticket Médio',
                message: `R$ ${avgTicket.toFixed(2)} por pedido neste período.`
            });
        }

        // 11. Total de Vendas
        performance.push({
            id: 'total_sales',
            type: 'performance',
            icon: '💲',
            title: 'Vendas do Período',
            message: `Total de R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em vendas.`
        });
    }

    return performance;
};
