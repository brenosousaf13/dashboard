import { useEffect } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2, LogOut } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function GoogleAnalyticsPage() {
    const {
        googleConnected,
        gaPropertyId,
        gaProperties,
        gaData,
        isGaLoading,
        connectGoogle,
        disconnectGoogle,
        fetchGaProperties,
        setGaProperty,
        fetchGaData,
        dateFilter,
        customStartDate,
        customEndDate
    } = useData();

    useEffect(() => {
        if (googleConnected && gaProperties.length === 0) {
            fetchGaProperties();
        }
    }, [googleConnected]);

    useEffect(() => {
        if (googleConnected && gaPropertyId) {
            fetchGaData();
        }
    }, [googleConnected, gaPropertyId, dateFilter, customStartDate, customEndDate]);

    if (!googleConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Google Analytics</h1>
                    <p className="text-muted-foreground max-w-md">
                        Conecte sua conta do Google para visualizar métricas de tráfego, usuários e conversões diretamente no seu dashboard.
                    </p>
                </div>
                <Button onClick={connectGoogle} size="lg" className="gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Conectar Google Analytics
                </Button>
            </div>
        );
    }

    if (!gaPropertyId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Selecione uma Propriedade</h1>
                    <p className="text-muted-foreground">
                        Escolha qual propriedade do Google Analytics 4 você deseja visualizar.
                    </p>
                </div>
                {isGaLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                    <div className="w-full max-w-xs space-y-4">
                        <Select onValueChange={setGaProperty}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a propriedade" />
                            </SelectTrigger>
                            <SelectContent>
                                {gaProperties.map((prop) => (
                                    <SelectItem key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={disconnectGoogle} className="w-full">
                            Desconectar
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Google Analytics</h2>
                    <p className="text-muted-foreground">
                        Visão geral do tráfego e engajamento do seu site.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={disconnectGoogle}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Desconectar
                    </Button>
                </div>
            </div>

            {isGaLoading && !gaData ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : gaData ? (
                <>
                    {/* Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {gaData.overview.reduce((acc, row) => acc + row.activeUsers, 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sessões</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {gaData.overview.reduce((acc, row) => acc + row.sessions, 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taxa de Rejeição Média</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(gaData.overview.reduce((acc, row) => acc + row.bounceRate, 0) / (gaData.overview.length || 1) * 100).toFixed(1)}%
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Math.round(gaData.overview.reduce((acc, row) => acc + row.avgDuration, 0) / (gaData.overview.length || 1))}s
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Line Chart */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Usuários ao longo do tempo</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={gaData.overview}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(value) => {
                                                    // Value is YYYYMMDD
                                                    if (value && value.length === 8) {
                                                        return `${value.substring(6, 8)}/${value.substring(4, 6)}`;
                                                    }
                                                    return value;
                                                }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                            />
                                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                            <Tooltip
                                                labelFormatter={(value) => {
                                                    if (value && value.length === 8) {
                                                        return `${value.substring(6, 8)}/${value.substring(4, 6)}/${value.substring(0, 4)}`;
                                                    }
                                                    return value;
                                                }}
                                            />
                                            <Line type="monotone" dataKey="activeUsers" stroke="#2563eb" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Fontes de Tráfego</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={gaData.sources}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="sessions"
                                                nameKey="source"
                                            >
                                                {gaData.sources.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Pages Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Páginas Mais Visitadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Página</TableHead>
                                        <TableHead className="text-right">Visualizações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gaData.topPages.map((page, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{page.path}</TableCell>
                                            <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado.
                </div>
            )}
        </div>
    );
}
