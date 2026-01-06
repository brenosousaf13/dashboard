
import { useState, useEffect } from "react"
import { useData } from "@/context/DataContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Edit, Download, RefreshCw, TrendingUp, Search, Users, UserPlus, Repeat, DollarSign } from "lucide-react"
import { subDays, format, parseISO, differenceInDays } from "date-fns"
import { StatCard } from "@/components/StatCard"
import { WidgetCard } from "@/components/WidgetCard"

export function CustomersPage() {
    const { data, syncCatalog, isLoading, credentials } = useData()
    const [searchTerm, setSearchTerm] = useState("")
    const [segmentFilter, setSegmentFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Ensure catalog is loaded on mount
    useEffect(() => {
        if (credentials) {
            syncCatalog(credentials)
        }
    }, [credentials])

    const customers = data?.customersList || []
    const orders = data?.orders || []

    // Metrics Calculations
    const totalCustomers = customers.length

    // Helper to calculate LTV from orders
    const calculateLTV = (customerId: number) => {
        if (!orders || orders.length === 0) return 0
        return orders
            .filter(o => o.customer_id === customerId)
            .reduce((acc, order) => acc + parseFloat(order.total), 0)
    }

    // New Customers (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30)
    const newCustomersCount = customers.filter(c => {
        const dateCreated = parseISO(c.date_created)
        return dateCreated >= thirtyDaysAgo
    }).length

    // Recurring Customers (more than 1 order)
    const recurringCustomersCount = customers.filter(c => c.orders_count > 1).length

    // Average Ticket
    // Use calculated LTV for total spent to be consistent
    const totalSpent = customers.reduce((acc, c) => acc + calculateLTV(c.id), 0)
    const averageTicket = totalCustomers > 0 ? totalSpent / totalCustomers : 0

    // Helper to find last order for a customer
    const getLastOrder = (customerId: number) => {
        if (!orders || orders.length === 0) return null
        // Orders are usually sorted by date desc from API, but let's be safe
        const customerOrders = orders.filter(o => o.customer_id === customerId)
        if (customerOrders.length === 0) return null

        // Sort by date desc
        return customerOrders.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())[0]
    }

    // Filtering and Segmentation Logic
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = (customer.first_name + ' ' + customer.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())

        // Determine Status/Segment
        const dateCreated = parseISO(customer.date_created)
        const daysSinceRegistration = differenceInDays(new Date(), dateCreated)
        const totalSpentValue = calculateLTV(customer.id)

        const isNew = daysSinceRegistration <= 30
        const isVip = totalSpentValue > 1000

        const matchesSegment = segmentFilter === "all" ||
            (segmentFilter === 'vip' && isVip) ||
            (segmentFilter === 'novo' && isNew)

        return matchesSearch && matchesSegment
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
    }

    const getCustomerStatus = (customer: any) => {
        const dateCreated = parseISO(customer.date_created)
        const daysSinceRegistration = differenceInDays(new Date(), dateCreated)
        const totalSpentValue = calculateLTV(customer.id)

        if (totalSpentValue > 1000) return { label: 'VIP', color: 'bg-yellow-100 text-yellow-800' }
        if (daysSinceRegistration <= 30) return { label: 'Novo', color: 'bg-blue-100 text-blue-800' }

        return { label: 'Recorrente', color: 'bg-green-100 text-green-800' }
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500 mt-1">Gerencie sua base de clientes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50" onClick={() => syncCatalog(credentials, true)} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </Button>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total de Clientes"
                    value={totalCustomers.toLocaleString('pt-BR')}
                    change="+180"
                    changeType="positive"
                    subtitle="novos este mês"
                    highlighted={true}
                    icon={<Users className="h-5 w-5 text-violet-600" />}
                />
                <StatCard
                    title="Novos Clientes (30d)"
                    value={newCustomersCount.toString()}
                    change="+15%"
                    changeType="positive"
                    subtitle="vs mês anterior"
                    icon={<UserPlus className="h-5 w-5 text-gray-500" />}
                />
                <StatCard
                    title="Clientes Recorrentes"
                    value={recurringCustomersCount.toString()}
                    subtitle={`${(totalCustomers > 0 ? (recurringCustomersCount / totalCustomers * 100).toFixed(0) : 0)}% da base`}
                    icon={<Repeat className="h-5 w-5 text-gray-500" />}
                />
                <StatCard
                    title="Ticket Médio"
                    value={formatCurrency(averageTicket)}
                    change="+5%"
                    changeType="positive"
                    subtitle="vs ano anterior"
                    icon={<DollarSign className="h-5 w-5 text-gray-500" />}
                />
            </div>

            {/* Filters and Table */}
            <WidgetCard noPadding>
                <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nome/email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full pl-9"
                        />
                    </div>
                    <Select value={segmentFilter} onValueChange={(val) => {
                        setSegmentFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-full md:w-[160px]">
                            <SelectValue placeholder="Segmento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="novo">Novo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(val) => {
                        setStatusFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-full md:w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="text-gray-500 font-medium">Cliente</TableHead>
                                <TableHead className="text-gray-500 font-medium">Segmento</TableHead>
                                <TableHead className="text-gray-500 font-medium">Última Compra</TableHead>
                                <TableHead className="text-gray-500 font-medium">Valor</TableHead>
                                <TableHead className="text-gray-500 font-medium">LTV</TableHead>
                                <TableHead className="text-gray-500 font-medium">Status</TableHead>
                                <TableHead className="text-right text-gray-500 font-medium">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((customer) => {
                                    const status = getCustomerStatus(customer)
                                    const lastOrder = getLastOrder(customer.id)

                                    const lastOrderDate = lastOrder
                                        ? format(parseISO(lastOrder.date_created), 'dd/MM/yyyy')
                                        : (customer.date_modified ? format(parseISO(customer.date_modified), 'dd/MM/yyyy') : '-')

                                    const lastOrderValue = lastOrder
                                        ? formatCurrency(parseFloat(lastOrder.total))
                                        : '-'

                                    const ltv = calculateLTV(customer.id)

                                    return (
                                        <TableRow key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell>
                                                <input type="checkbox" className="rounded border-gray-300" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-violet-100">
                                                        <AvatarImage src={customer.avatar_url} />
                                                        <AvatarFallback className="bg-violet-100 text-violet-600 font-semibold">
                                                            {getInitials(customer.first_name, customer.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{customer.first_name} {customer.last_name}</div>
                                                        <div className="text-xs text-gray-500">{customer.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${status.color} border-0`}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{lastOrderDate}</TableCell>
                                            <TableCell className="font-medium text-gray-900">{lastOrderValue}</TableCell>
                                            <TableCell className="font-semibold text-gray-900">{formatCurrency(ltv)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Ativo
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="h-8 border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200">
                                                        <Eye className="mr-2 h-3 w-3" />
                                                        Ver
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="h-8 border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200">
                                                        <Edit className="mr-2 h-3 w-3" />
                                                        Editar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-32 text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-gray-300" />
                                            <p>Nenhum cliente encontrado.</p>
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
