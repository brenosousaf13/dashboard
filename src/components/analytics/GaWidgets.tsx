import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Users, Activity, Clock, MousePointerClick, ShoppingCart, DollarSign, Layout, TrendingUp } from "lucide-react";
import { WidgetId } from "./WidgetSelector";
import { StatCard } from "../StatCard";
import { WidgetCard } from "../WidgetCard";

// Violet color palette for charts
const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#DDD6FE'];

// --- Widget Implementations ---

export function GaWidgetRenderer({ id, data }: { id: WidgetId, data: any }) {
    if (!data) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card h-full flex items-center justify-center p-6">
            <div className="text-gray-400 text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                Carregando...
            </div>
        </div>
    );

    // --- Metrics - Using StatCard ---
    if (id === 'total_users') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return (
            <StatCard
                title="Total de Usuários"
                value={parseInt(val).toLocaleString()}
                icon={<Users className="h-5 w-5 text-violet-600" />}
                highlighted={true}
            />
        );
    }
    if (id === 'new_users') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return (
            <StatCard
                title="Novos Usuários"
                value={parseInt(val).toLocaleString()}
                icon={<Users className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'sessions') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return (
            <StatCard
                title="Sessões"
                value={parseInt(val).toLocaleString()}
                icon={<Activity className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'engagement_rate') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return (
            <StatCard
                title="Taxa de Engajamento"
                value={`${(val * 100).toFixed(1)}%`}
                icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'avg_session_duration') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return (
            <StatCard
                title="Duração Média"
                value={`${Math.round(val)}s`}
                icon={<Clock className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'screen_page_views') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return (
            <StatCard
                title="Visualizações de Página"
                value={parseInt(val).toLocaleString()}
                icon={<Layout className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'event_count') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return (
            <StatCard
                title="Total de Eventos"
                value={parseInt(val).toLocaleString()}
                icon={<MousePointerClick className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'conversions') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return (
            <StatCard
                title="Conversões"
                value={parseInt(val).toLocaleString()}
                icon={<ShoppingCart className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'conversion_rate') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return (
            <StatCard
                title="Taxa de Conversão"
                value={`${(val * 100).toFixed(1)}%`}
                icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'total_revenue') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return (
            <StatCard
                title="Receita Total"
                value={`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={<DollarSign className="h-5 w-5 text-gray-500" />}
            />
        );
    }
    if (id === 'avg_order_value') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return (
            <StatCard
                title="Ticket Médio"
                value={`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={<DollarSign className="h-5 w-5 text-gray-500" />}
            />
        );
    }

    // --- Charts - Using WidgetCard ---
    if (['users_over_time', 'sessions_over_time', 'revenue_over_time', 'conversions_over_time'].includes(id)) {
        const chartData = data.rows?.map((row: any) => ({
            date: row.dimensionValues[0].value,
            value: parseFloat(row.metricValues[0].value)
        })) || [];

        const config = ({
            'users_over_time': { title: 'Usuários ao Longo do Tempo' },
            'sessions_over_time': { title: 'Sessões ao Longo do Tempo' },
            'revenue_over_time': { title: 'Receita ao Longo do Tempo' },
            'conversions_over_time': { title: 'Conversões ao Longo do Tempo' },
        } as Record<string, { title: string }>)[id]!;

        return (
            <WidgetCard title={config.title} className="h-[400px]">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => val && val.length === 8 ? `${val.substring(6, 8)}/${val.substring(4, 6)}` : val}
                                tickLine={false} axisLine={false} tickMargin={8}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                            <Tooltip
                                labelFormatter={(val) => val && val.length === 8 ? `${val.substring(6, 8)}/${val.substring(4, 6)}/${val.substring(0, 4)}` : val}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill={`url(#color${id})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </WidgetCard>
        );
    }

    // --- Pie Charts - Using WidgetCard ---
    if (['traffic_sources', 'devices', 'browsers', 'countries'].includes(id)) {
        const pieData = data.rows?.map((row: any) => ({
            name: row.dimensionValues[0].value,
            value: parseInt(row.metricValues[0].value)
        })) || [];

        const title = ({
            'traffic_sources': 'Fontes de Tráfego',
            'devices': 'Dispositivos',
            'browsers': 'Navegadores',
            'countries': 'Países'
        } as Record<string, string>)[id]!;

        return (
            <WidgetCard title={title} className="h-[400px]">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {pieData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px' }}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </WidgetCard>
        );
    }

    // --- Tables - Using WidgetCard ---
    if (['top_pages', 'top_landing_pages', 'top_products', 'top_campaigns', 'top_cities'].includes(id)) {
        const tableData = data.rows?.map((row: any) => ({
            name: row.dimensionValues[0].value,
            value: row.metricValues[0].value,
            value2: row.metricValues[1]?.value
        })) || [];

        const config = ({
            'top_pages': { title: 'Páginas Mais Visitadas', col1: 'Página', col2: 'Visualizações' },
            'top_landing_pages': { title: 'Páginas de Entrada', col1: 'Página', col2: 'Sessões' },
            'top_products': { title: 'Produtos Mais Vendidos', col1: 'Produto', col2: 'Receita' },
            'top_campaigns': { title: 'Top Campanhas', col1: 'Campanha', col2: 'Sessões' },
            'top_cities': { title: 'Top Cidades', col1: 'Cidade', col2: 'Usuários' },
        } as Record<string, { title: string, col1: string, col2: string }>)[id]!;

        return (
            <WidgetCard title={config.title} className="h-[400px]" noPadding>
                <div className="overflow-auto max-h-[320px] px-6 pb-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                <TableHead className="text-gray-500 font-medium">{config.col1}</TableHead>
                                <TableHead className="text-right text-gray-500 font-medium">{config.col2}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.length > 0 ? tableData.map((row: any, i: number) => (
                                <TableRow key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-900 truncate max-w-[200px]" title={row.name}>{row.name}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-semibold text-violet-600">
                                            {id === 'top_products'
                                                ? `R$ ${parseFloat(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                : parseInt(row.value).toLocaleString()
                                            }
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-gray-400">Sem dados</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </WidgetCard>
        );
    }

    return null;
}
