import { useState, useEffect } from "react"
import { useData } from "@/context/DataContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, CreditCard, TrendingUp, Clock, CheckCircle2, Search, Loader2, ShoppingBag, DollarSign } from "lucide-react"
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StatCard } from "@/components/StatCard"
import { WidgetCard } from "@/components/WidgetCard"

export function OrdersPage() {
    const {
        data,
        syncAnalytics,
        isLoading,
        credentials,
        dateFilter,
        customStartDate,
        customEndDate,
        setGlobalDateFilter
    } = useData()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Local state for inputs before applying
    const [localDateFilter, setLocalDateFilter] = useState(dateFilter)
    const [localStartDate, setLocalStartDate] = useState(customStartDate)
    const [localEndDate, setLocalEndDate] = useState(customEndDate)

    // Sync local state with global state on mount/update
    useEffect(() => {
        setLocalDateFilter(dateFilter)
        setLocalStartDate(customStartDate)
        setLocalEndDate(customEndDate)
    }, [dateFilter, customStartDate, customEndDate])
    const [paymentFilter, setPaymentFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const orders = data?.orders || []

    // Initial sync on mount if needed
    // Initial sync on mount if needed
    useEffect(() => {
        if (credentials && orders.length === 0) {
            handleApplyFilter(true)
        }
    }, [credentials])

    const handleApplyFilter = (isInitial = false) => {
        const filter = isInitial ? dateFilter : localDateFilter
        const start = isInitial ? customStartDate : localStartDate
        const end = isInitial ? customEndDate : localEndDate

        const now = new Date()
        let from = now
        let to = now

        if (filter === 'all') {
            from = new Date(2020, 0, 1)
            to = now
        } else if (filter === 'today') {
            from = startOfDay(now)
            to = endOfDay(now)
        } else if (filter === 'this_month') {
            from = startOfMonth(now)
            to = endOfMonth(now)
        } else if (filter === 'last_30_days') {
            from = subDays(now, 30)
            to = now
        } else if (filter === 'custom' && start && end) {
            from = parseISO(start)
            to = endOfDay(parseISO(end))
        }

        if (!isInitial) {
            setGlobalDateFilter(filter, start, end)
        }
        syncAnalytics(credentials, from, to)
        setCurrentPage(1)
    }

    // Filter Orders (Client-side for status/search, Server-side for date)
    const filteredOrders = orders.filter(order => {
        // Date is already filtered by the API sync, so we don't strictly need to filter here again
        // unless we want to be super safe or if 'all' was fetched and we want to narrow it down locally.
        // But for now, let's assume data.orders IS the filtered set for the date.

        const matchesSearch =
            order.id.toString().includes(searchTerm) ||
            (order.billing?.first_name + ' ' + order.billing?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.billing?.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter

        const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter

        return matchesSearch && matchesStatus && matchesPayment
    })

    // Metrics Calculations
    const totalOrders = filteredOrders.length

    const pendingOrdersCount = filteredOrders.filter(o =>
        ['pending', 'processing', 'on-hold'].includes(o.status)
    ).length

    const totalRevenue = filteredOrders
        .filter(o => ['completed', 'processing'].includes(o.status))
        .reduce((acc, o) => acc + parseFloat(o.total), 0)

    const avgProcessingTime = "2.5 dias"

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800'
            case 'processing': return 'bg-yellow-100 text-yellow-800'
            case 'pending': return 'bg-orange-100 text-orange-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            case 'failed': return 'bg-red-100 text-red-800'
            case 'refunded': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            completed: 'Concluído',
            processing: 'Processando',
            pending: 'Pendente',
            on_hold: 'Em espera',
            cancelled: 'Cancelado',
            refunded: 'Reembolsado',
            failed: 'Falhou',
            trash: 'Lixeira'
        }
        return labels[status] || status
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pedidos</h1>
                    <p className="text-gray-500 mt-1">Gerencie todos os pedidos da sua loja</p>
                </div>
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total de Pedidos"
                    value={totalOrders.toString()}
                    subtitle="No período selecionado"
                    highlighted={true}
                    icon={<ShoppingBag className="h-5 w-5 text-violet-600" />}
                />
                <StatCard
                    title="Pedidos Pendentes"
                    value={pendingOrdersCount.toString()}
                    subtitle="Aguardando processamento"
                    icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
                />
                <StatCard
                    title="Valor Total"
                    value={formatCurrency(totalRevenue)}
                    subtitle="Receita bruta"
                    icon={<DollarSign className="h-5 w-5 text-gray-500" />}
                />
                <StatCard
                    title="Tempo Médio"
                    value={avgProcessingTime}
                    subtitle="Da confirmação ao envio"
                    icon={<Clock className="h-5 w-5 text-gray-500" />}
                />
            </div>

            {/* Filters and Table */}
            <WidgetCard noPadding>
                <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nº ou cliente..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(val) => {
                        setStatusFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-full md:w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="on_hold">Em espera</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="refunded">Reembolsado</SelectItem>
                            <SelectItem value="failed">Falhou</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={localDateFilter} onValueChange={setLocalDateFilter}>
                        <SelectTrigger className="w-full md:w-[160px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo o período</SelectItem>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="this_month">Este Mês</SelectItem>
                            <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>

                    {localDateFilter === 'custom' && (
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={localStartDate}
                                onChange={(e) => setLocalStartDate(e.target.value)}
                                className="w-auto"
                            />
                            <Input
                                type="date"
                                value={localEndDate}
                                onChange={(e) => setLocalEndDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                    )}

                    <Button
                        onClick={() => handleApplyFilter(false)}
                        disabled={isLoading}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Aplicar
                    </Button>

                    <Select value={paymentFilter} onValueChange={(val) => {
                        setPaymentFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-full md:w-[160px]">
                            <SelectValue placeholder="Pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="bacs">Transferência</SelectItem>
                            <SelectItem value="cod">Dinheiro</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="credit_card">Cartão</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="text-gray-500 font-medium">Pedido</TableHead>
                                <TableHead className="text-gray-500 font-medium">Data</TableHead>
                                <TableHead className="text-gray-500 font-medium">Status</TableHead>
                                <TableHead className="text-gray-500 font-medium">Total</TableHead>
                                <TableHead className="text-gray-500 font-medium">Pagamento</TableHead>
                                <TableHead className="text-right text-gray-500 font-medium">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedOrders.length > 0 ? (
                                paginatedOrders.map((order) => {
                                    const date = format(parseISO(order.date_created), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                    const statusColor = getStatusColor(order.status)
                                    const statusLabel = getStatusLabel(order.status)
                                    const itemCount = order.line_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0

                                    return (
                                        <TableRow key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell>
                                                <input type="checkbox" className="rounded border-gray-300" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                                        <CheckCircle2 className="h-5 w-5 text-violet-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">Nº {order.id}</div>
                                                        <div className="text-xs text-gray-500">{order.billing.first_name} {order.billing.last_name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{date}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${statusColor} border-0`}>
                                                    {statusLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-gray-900">{formatCurrency(parseFloat(order.total))}</div>
                                                <div className="text-xs text-gray-500">{itemCount} itens</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-700">{order.payment_method_title}</div>
                                                <div className="text-xs text-emerald-600">
                                                    {order.status === 'completed' || order.status === 'processing' ? 'Aprovado' : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" className="h-8 border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200" onClick={() => {
                                                    alert(`Abrir pedido ${order.id} no WooCommerce`)
                                                }}>
                                                    <Eye className="mr-2 h-3 w-3" />
                                                    Ver
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-32 text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShoppingBag className="h-8 w-8 text-gray-300" />
                                            <p>Nenhum pedido encontrado.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                        Página {currentPage} de {totalPages || 1}
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="border-gray-200"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="border-gray-200"
                        >
                            Próximo
                        </Button>
                    </div>
                </div>
            </WidgetCard>
        </div>
    )
}
