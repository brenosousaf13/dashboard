import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { Users, Activity, Clock, MousePointerClick, ShoppingCart, DollarSign, Globe, Monitor, Layout, MapPin, Tag } from "lucide-react";
import { WidgetId } from "./WidgetSelector";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57'];

// --- Helper Components ---

function MetricCard({ title, value, subtext, icon: Icon }: { title: string, value: string, subtext?: string, icon?: any }) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {children}
            </CardContent>
        </Card>
    );
}

function PieChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {children}
            </CardContent>
        </Card>
    );
}

function TableCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                {children}
            </CardContent>
        </Card>
    );
}

// --- Widget Implementations ---

export function GaWidgetRenderer({ id, data }: { id: WidgetId, data: any }) {
    if (!data) return (
        <Card className="h-full flex items-center justify-center p-6">
            <div className="text-muted-foreground text-sm">Carregando {id}...</div>
        </Card>
    );

    // Check for empty data
    const isEmpty = !data.rows || data.rows.length === 0;

    // --- Metrics ---
    if (id === 'total_users') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return <MetricCard title="Total de Usuários" value={parseInt(val).toLocaleString()} icon={Users} />;
    }
    if (id === 'new_users') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return <MetricCard title="Novos Usuários" value={parseInt(val).toLocaleString()} icon={Users} />;
    }
    if (id === 'sessions') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return <MetricCard title="Sessões" value={parseInt(val).toLocaleString()} icon={Activity} />;
    }
    if (id === 'engagement_rate') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return <MetricCard title="Taxa de Engajamento" value={`${(val * 100).toFixed(1)}%`} icon={Activity} />;
    }
    if (id === 'avg_session_duration') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return <MetricCard title="Duração Média" value={`${Math.round(val)}s`} icon={Clock} />;
    }
    if (id === 'screen_page_views') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return <MetricCard title="Visualizações de Página" value={parseInt(val).toLocaleString()} icon={Layout} />;
    }
    if (id === 'event_count') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return <MetricCard title="Total de Eventos" value={parseInt(val).toLocaleString()} icon={MousePointerClick} />;
    }
    if (id === 'conversions') {
        const val = data.rows?.[0]?.metricValues?.[0]?.value || "0";
        return <MetricCard title="Conversões" value={parseInt(val).toLocaleString()} icon={ShoppingCart} />;
    }
    if (id === 'conversion_rate') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return <MetricCard title="Taxa de Conversão" value={`${(val * 100).toFixed(1)}%`} icon={Activity} />;
    }
    if (id === 'total_revenue') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return <MetricCard title="Receita Total" value={`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />;
    }
    if (id === 'avg_order_value') {
        const val = parseFloat(data.rows?.[0]?.metricValues?.[0]?.value || "0");
        return <MetricCard title="Ticket Médio" value={`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />;
    }

    // --- Charts ---
    if (['users_over_time', 'sessions_over_time', 'revenue_over_time', 'conversions_over_time'].includes(id)) {
        const chartData = data.rows?.map((row: any) => ({
            date: row.dimensionValues[0].value,
            value: parseFloat(row.metricValues[0].value)
        })) || [];

        const config = ({
            'users_over_time': { title: 'Usuários ao Longo do Tempo', color: '#0088FE' },
            'sessions_over_time': { title: 'Sessões ao Longo do Tempo', color: '#00C49F' },
            'revenue_over_time': { title: 'Receita ao Longo do Tempo', color: '#82ca9d' },
            'conversions_over_time': { title: 'Conversões ao Longo do Tempo', color: '#FF8042' },
        } as Record<string, { title: string, color: string }>)[id]!;

        return (
            <ChartCard title={config.title}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(val) => val && val.length === 8 ? `${val.substring(6, 8)}/${val.substring(4, 6)}` : val}
                            tickLine={false} axisLine={false} tickMargin={8}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip
                            labelFormatter={(val) => val && val.length === 8 ? `${val.substring(6, 8)}/${val.substring(4, 6)}/${val.substring(0, 4)}` : val}
                        />
                        <Area type="monotone" dataKey="value" stroke={config.color} fillOpacity={1} fill={`url(#color${id})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
        );
    }

    // --- Pie Charts ---
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
            <PieChartCard title={title}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </PieChartCard>
        );
    }

    // --- Tables ---
    if (['top_pages', 'top_landing_pages', 'top_products', 'top_campaigns', 'top_cities'].includes(id)) {
        const tableData = data.rows?.map((row: any) => ({
            name: row.dimensionValues[0].value,
            value: row.metricValues[0].value,
            value2: row.metricValues[1]?.value // For products (revenue + quantity)
        })) || [];

        const config = ({
            'top_pages': { title: 'Páginas Mais Visitadas', col1: 'Página', col2: 'Visualizações' },
            'top_landing_pages': { title: 'Páginas de Entrada', col1: 'Página', col2: 'Sessões' },
            'top_products': { title: 'Produtos Mais Vendidos', col1: 'Produto', col2: 'Receita' },
            'top_campaigns': { title: 'Top Campanhas', col1: 'Campanha', col2: 'Sessões' },
            'top_cities': { title: 'Top Cidades', col1: 'Cidade', col2: 'Usuários' },
        } as Record<string, { title: string, col1: string, col2: string }>)[id]!;

        return (
            <TableCard title={config.title}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{config.col1}</TableHead>
                            <TableHead className="text-right">{config.col2}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.length > 0 ? tableData.map((row: any, i: number) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium truncate max-w-[200px]" title={row.name}>{row.name}</TableCell>
                                <TableCell className="text-right">
                                    {id === 'top_products'
                                        ? `R$ ${parseFloat(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                        : parseInt(row.value).toLocaleString()
                                    }
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">Sem dados</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableCard>
        );
    }

    return null;
}
