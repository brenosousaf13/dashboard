import { useState, useEffect } from "react"
import { useData } from "@/context/DataContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Edit, RefreshCw, Download, AlertTriangle, TrendingUp, CreditCard, Package, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react"
import { ABCCurveAnalysis } from "@/components/analytics/ABCCurveAnalysis"
import type { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { EditProductModal } from "@/components/products/EditProductModal"

export function ProductsPage() {
    const { data, syncCatalog, syncAnalytics, isLoading, getProductVariations, credentials, updateProduct, updateProductVariation } = useData()
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })

    // Ensure catalog is loaded on mount
    useEffect(() => {
        if (credentials) {
            syncCatalog(credentials)
        }
    }, [credentials])

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Variations State
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})
    const [variationsData, setVariationsData] = useState<Record<number, any[]>>({})
    const [loadingVariations, setLoadingVariations] = useState<Record<number, boolean>>({})

    // Edit Modal State
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [editingVariation, setEditingVariation] = useState<any>(null)
    const [parentProduct, setParentProduct] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const products = data?.productsList || []

    // Metrics Calculations
    const activeProducts = products.filter(p => p.status === 'publish').length
    const criticalStock = products.filter(p => (p.stock_quantity || 0) < 5 && p.stock_quantity !== null).length

    const stockValue = products.reduce((acc, product) => {
        const price = parseFloat(product.price || 0)
        const stock = product.stock_quantity || 0
        return acc + (price * stock)
    }, 0)

    const analyticsProducts = data?.products || []
    const totalItemsSoldPeriod = analyticsProducts.reduce((acc, p) => acc + p.items_sold, 0)
    const totalStock = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0)
    const turnoverRate = totalStock > 0 ? ((totalItemsSoldPeriod / totalStock) * 100).toFixed(1) : "0"

    // Filtering
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === "all" || product.categories.some((c: any) => c.slug === categoryFilter)
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === 'active' && product.status === 'publish') ||
            (statusFilter === 'draft' && product.status === 'draft')

        return matchesSearch && matchesCategory && matchesStatus
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // Variations Logic
    const toggleRow = async (productId: number) => {
        const isExpanded = !!expandedRows[productId]

        setExpandedRows(prev => ({ ...prev, [productId]: !isExpanded }))

        if (!isExpanded && !variationsData[productId]) {
            // Fetch variations if expanding and not already loaded
            setLoadingVariations(prev => ({ ...prev, [productId]: true }))
            try {
                const variations = await getProductVariations(productId)
                setVariationsData(prev => ({ ...prev, [productId]: variations }))
            } catch (error) {
                console.error("Error fetching variations", error)
            } finally {
                setLoadingVariations(prev => ({ ...prev, [productId]: false }))
            }
        }
    }

    // Get unique categories for filter
    const categories = Array.from(new Set(products.flatMap(p => p.categories.map((c: any) => JSON.stringify({ id: c.id, name: c.name, slug: c.slug })))))
        .map(s => JSON.parse(s as string))

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const handleEditClick = (product: any) => {
        setEditingProduct(product)
        setEditingVariation(null)
        setParentProduct(null)
        setIsEditModalOpen(true)
    }

    const handleEditVariationClick = (variation: any, parent: any) => {
        // Create a display name for the variation based on attributes
        const variationName = `${parent.name} - ${variation.attributes.map((attr: any) => attr.option).join(', ')}`

        setEditingProduct(null)
        setEditingVariation({ ...variation, name: variationName }) // Add name for the modal
        setParentProduct(parent)
        setIsEditModalOpen(true)
    }

    const handleSave = async (id: number, data: any) => {
        if (editingVariation && parentProduct && updateProductVariation) {
            // Updating a variation
            await updateProductVariation(parentProduct.id, id, data)

            // Refresh variations data locally
            const updatedVariations = variationsData[parentProduct.id].map(v =>
                v.id === id ? { ...v, ...data, price: data.sale_price || data.regular_price } : v
            )
            setVariationsData(prev => ({ ...prev, [parentProduct.id]: updatedVariations }))

        } else if (updateProduct) {
            // Updating a main product
            await updateProduct(id, data)
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => syncCatalog(credentials, true)} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar Catálogo
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
                        <CardTitle className="text-sm font-medium">Total de Produtos Ativos</CardTitle>
                        <span className="text-muted-foreground">$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeProducts}</div>
                        <p className="text-xs text-green-500">+5 novos essa semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estoque Crítico <AlertTriangle className="inline h-4 w-4 text-orange-500" /></CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{criticalStock}</div>
                        <p className="text-xs text-muted-foreground">Produtos com &lt; 5 unid.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stockValue)}</div>
                        <p className="text-xs text-muted-foreground">Custo total armazenado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Giro de Estoque (30d)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{turnoverRate}%</div>
                        <p className="text-xs text-muted-foreground">Velocidade de saída</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card>
                <div className="p-4 flex flex-col md:flex-row gap-4 border-b">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Buscar por nome/SKU..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={(v: string) => { setCategoryFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Categorias</SelectItem>
                            {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="draft">Rascunho</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Estoque (Visual)</TableHead>
                                <TableHead>Performance (30d)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedProducts.length > 0 ? (
                                paginatedProducts.map((product) => {
                                    const stock = product.stock_quantity || 0
                                    const stockStatusColor = stock > 20 ? "bg-green-500" : stock > 5 ? "bg-yellow-500" : "bg-red-500"
                                    const stockStatusText = stock > 20 ? "Saudável" : stock > 5 ? "Baixo" : "Repor Agora"

                                    // Find analytics data for this product
                                    const analyticsItem = analyticsProducts.find((p: any) => p.product_id === product.id)
                                    const itemsSold = analyticsItem ? analyticsItem.items_sold : 0
                                    const revenue = analyticsItem ? analyticsItem.net_revenue : 0

                                    const isVariable = product.type === 'variable'
                                    const isExpanded = expandedRows[product.id]
                                    const variations = variationsData[product.id] || []
                                    const isLoadingVars = loadingVariations[product.id]

                                    return (
                                        <>
                                            <TableRow key={product.id} className={isExpanded ? "bg-muted/50" : ""}>
                                                <TableCell>
                                                    {isVariable ? (
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleRow(product.id)}>
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    ) : (
                                                        <input type="checkbox" className="rounded border-gray-300" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden">
                                                            {product.images && product.images[0] ? (
                                                                <img src={product.images[0].src} alt={product.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Package className="h-full w-full p-2 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{product.name}</div>
                                                            <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{product.categories.map((c: any) => c.name).join(', ')}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{formatCurrency(parseFloat(product.price || 0))}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2.5 w-2.5 rounded-full ${stockStatusColor}`} />
                                                        <span className="font-medium">{stock} unid.</span>
                                                    </div>
                                                    <div className={`text-xs ${stock > 5 ? 'text-green-600' : 'text-red-600'}`}>{stockStatusText}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {itemsSold > 0 && <span className="text-orange-500">🔥</span>}
                                                        <span className="font-medium">{itemsSold} Vendas</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{formatCurrency(revenue)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={product.status === 'publish' ? 'default' : 'secondary'} className={product.status === 'publish' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                                        {product.status === 'publish' ? 'Ativo' : product.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" className="h-8" onClick={() => handleEditClick(product)}>
                                                            <Edit className="mr-2 h-3 w-3" />
                                                            Editar
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="h-8" onClick={() => window.open(product.permalink, '_blank')}>
                                                            <Eye className="mr-2 h-3 w-3" />
                                                            Ver
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                    <TableCell colSpan={8} className="p-0">
                                                        <div className="p-4 pl-16">
                                                            <h4 className="mb-2 text-sm font-semibold">Variações</h4>
                                                            {isLoadingVars ? (
                                                                <div className="text-sm text-muted-foreground">Carregando variações...</div>
                                                            ) : variations.length > 0 ? (
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead className="w-[200px]">Variação</TableHead>
                                                                            <TableHead>SKU</TableHead>
                                                                            <TableHead>Preço</TableHead>
                                                                            <TableHead>Estoque</TableHead>
                                                                            <TableHead className="text-right">Ações</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {variations.map((variation: any) => (
                                                                            <TableRow key={variation.id}>
                                                                                <TableCell className="font-medium">
                                                                                    {variation.attributes.map((attr: any) => `${attr.name}: ${attr.option}`).join(', ')}
                                                                                </TableCell>
                                                                                <TableCell>{variation.sku}</TableCell>
                                                                                <TableCell>{formatCurrency(parseFloat(variation.price || 0))}</TableCell>
                                                                                <TableCell>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={`h-2 w-2 rounded-full ${(variation.stock_quantity || 0) > 5 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                                        <span>{variation.stock_quantity || 0} unid.</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => handleEditVariationClick(variation, product)}>
                                                                                            <Edit className="h-3 w-3" />
                                                                                        </Button>
                                                                                        <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => window.open(variation.permalink, '_blank')}>
                                                                                            <Eye className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            ) : (
                                                                <div className="text-sm text-muted-foreground">Nenhuma variação encontrada.</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        Nenhum produto encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Controls */}
                <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredProducts.length)} de {filteredProducts.length} produtos
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* ABC Analysis */}
            <ABCCurveAnalysis
                products={analyticsProducts}
                dateRange={dateRange}
                onDateRangeChange={(range) => {
                    setDateRange(range)
                    if (range?.from && range?.to) {
                        syncAnalytics(credentials, range.from, range.to)
                    }
                }}
            />

            <EditProductModal
                product={editingVariation || editingProduct}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    )
}
