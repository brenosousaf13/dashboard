
import { useState } from "react"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, Edit, Download, RefreshCw, CreditCard, TrendingUp } from "lucide-react"
import { subDays, format, parseISO, differenceInDays } from "date-fns"

export function CustomersPage() {
    const { data, syncData, isLoading } = useData()
    const [searchTerm, setSearchTerm] = useState("")
    const [segmentFilter, setSegmentFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

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
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => syncData()} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </Button>
                    <Button variant="default" className="bg-black hover:bg-gray-800">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                        <span className="text-muted-foreground">$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-green-500">+180 novos este mês</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Novos Clientes (30d)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newCustomersCount}</div>
                        <p className="text-xs text-green-500">+15% em relação ao mês anterior</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recurringCustomersCount}</div>
                        <p className="text-xs text-muted-foreground">{(totalCustomers > 0 ? (recurringCustomersCount / totalCustomers * 100).toFixed(0) : 0)}% da base</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio por Cliente</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
                        <p className="text-xs text-green-500">+5% em relação ao ano anterior</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card>
                <div className="p-4 flex flex-col md:flex-row gap-4 border-b">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Buscar por nome/email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1) // Reset to first page on search
                            }}
                            className="w-full"
                        />
                    </div>
                    <Select value={segmentFilter} onValueChange={(val) => {
                        setSegmentFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-[180px]">
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
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status (Ativo/Inativo)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Cliente (Nome/Email)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Última Compra</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Total Gasto (LTV)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
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
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <input type="checkbox" className="rounded border-gray-300" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={customer.avatar_url} />
                                                        <AvatarFallback>{getInitials(customer.first_name, customer.last_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                                                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={status.color}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{lastOrderDate}</div>
                                                <div className="text-xs text-muted-foreground">Data</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{lastOrderValue}</div>
                                                <div className="text-xs text-muted-foreground">Valor</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{formatCurrency(ltv)}</div>
                                                <div className="text-xs text-muted-foreground">LTV</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                                    Ativo
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="h-8">
                                                        <Eye className="mr-2 h-3 w-3" />
                                                        Ver
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="h-8">
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
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Controls */}
                <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages || 1}
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Próximo
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
