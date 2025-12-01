import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Search, Download, Facebook, Eye, Edit, TrendingUp, DollarSign, ShoppingCart, Activity, Loader2, AlertCircle } from "lucide-react"
import { facebookAdsService } from "../services/facebookAdsService"
import type { CampaignData } from "../services/facebookAdsService"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"

export function CampaignsPage() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [campaigns, setCampaigns] = useState<CampaignData[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkConnection = async () => {
            const token = localStorage.getItem('fb_access_token')
            if (token) {
                setIsConnected(true)
                await loadCampaigns(token)
            }
        }

        facebookAdsService.init().then(() => {
            checkConnection()
        })
    }, [])

    const loadCampaigns = async (token: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const accounts = await facebookAdsService.getAdAccounts(token)
            if (accounts && accounts.length > 0) {
                // For simplicity, using the first ad account. 
                // In a real app, we might want a selector if multiple accounts exist.
                const adAccountId = accounts[0].id
                const data = await facebookAdsService.getCampaigns(adAccountId, token)
                setCampaigns(data)
            } else {
                setError("Nenhuma conta de anúncios encontrada.")
            }
        } catch (err) {
            console.error(err)
            setError("Erro ao carregar campanhas. Tente reconectar.")
            // If token is invalid, maybe disconnect?
            // setIsConnected(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConnect = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const authResponse = await facebookAdsService.login()
            if (authResponse) {
                setIsConnected(true)
                await loadCampaigns(authResponse.accessToken)
            }
        } catch (err) {
            console.error(err)
            setError("Falha na conexão com o Facebook.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDisconnect = async () => {
        setIsLoading(true)
        try {
            await facebookAdsService.logout()
            setIsConnected(false)
            setCampaigns([])
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate totals
    const totalSpend = campaigns.reduce((acc, curr) => acc + curr.spend, 0)
    const totalSales = campaigns.reduce((acc, curr) => acc + curr.sales, 0)
    // Weighted average or sum? ROAS is usually Total Sales Value / Total Spend. 
    // Since we calculated ROAS per campaign based on mock sales value, let's sum up sales value first.
    // Mock sales value = conversions * 150 (from service)
    const totalSalesValue = totalSales * 150
    const totalRoas = totalSpend > 0 ? totalSalesValue / totalSpend : 0
    const totalCpa = totalSales > 0 ? totalSpend / totalSales : 0

    if (!isConnected) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h1 className="text-2xl font-bold">Campanhas</h1>
                    <Button onClick={handleConnect} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        + Conectar Facebook Ads
                    </Button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                        <Facebook className="h-12 w-12 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Conecte sua conta do Facebook Ads</h2>
                    <p className="max-w-md mb-6">
                        Conecte sua conta para visualizar suas campanhas, métricas de desempenho e otimizar seus anúncios diretamente do dashboard.
                    </p>
                    {error && (
                        <Alert variant="destructive" className="mb-4 max-w-md text-left">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button onClick={handleConnect} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Conectar Agora"}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Campanhas</h1>
                <div className="flex gap-2">
                    <Button onClick={handleDisconnect} variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        Desconectar Conta
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gasto Total (30d)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `R$ ${totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </div>
                        <p className="text-xs text-green-600 flex items-center">
                            +5% vs anterior
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas (Conversões)</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalSales}
                        </div>
                        <p className="text-xs text-muted-foreground">R$ {totalSalesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} +10%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ROAS (Retorno)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${totalRoas.toFixed(2)}x`}
                        </div>
                        <p className="text-xs text-green-600 flex items-center">
                            +4.1% vs anterior
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CPA (Custo por Aquisição)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `R$ ${totalCpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </div>
                        <p className="text-xs text-green-600 flex items-center">
                            -3% vs anterior
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar campanha..."
                        className="pl-8 w-full md:w-[300px]"
                    />
                </div>
                <Select defaultValue="30d">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Últimos 7 dias</SelectItem>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="conversions">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="conversions">Conversões</SelectItem>
                        <SelectItem value="traffic">Tráfego</SelectItem>
                        <SelectItem value="engagement">Engajamento</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <input type="checkbox" className="rounded border-gray-300" />
                            </TableHead>
                            <TableHead>Campanha</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Gasto</TableHead>
                            <TableHead>Vendas</TableHead>
                            <TableHead>ROAS</TableHead>
                            <TableHead>CPA</TableHead>
                            <TableHead>CTR</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <span className="sr-only">Carregando...</span>
                                </TableCell>
                            </TableRow>
                        ) : campaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Nenhuma campanha encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell>
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-600 p-1 rounded text-white">
                                                <Facebook className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{campaign.name}</span>
                                                <span className="text-xs text-muted-foreground">{campaign.name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={campaign.status === "active" ? "default" : "secondary"} className={campaign.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                            {campaign.status === "active" ? "Ativa" : "Pausada"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>R$ {campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell>{campaign.sales}</TableCell>
                                    <TableCell>{campaign.roas}x</TableCell>
                                    <TableCell>R$ {campaign.cpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell>{campaign.ctr}%</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                                <Eye className="h-4 w-4 mr-1" />
                                                Ver
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                                <Edit className="h-4 w-4 mr-1" />
                                                Editar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
