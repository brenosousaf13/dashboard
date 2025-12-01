import { useState } from "react"
import { useData } from "../context/DataContext"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Loader2, CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"

export function SettingsPage() {
    const { isConnected, isLoading, connect, disconnect, syncData, isFacebookConnected, connectFacebook, disconnectFacebook, isFbLoading } = useData()
    const [url, setUrl] = useState("")
    const [key, setKey] = useState("")
    const [secret, setSecret] = useState("")
    const [fbAppId, setFbAppId] = useState("")
    const [fbAccessToken, setFbAccessToken] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [fbError, setFbError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            await connect({ url, consumerKey: key, consumerSecret: secret })
        } catch (err: any) {
            setError(err.message || "Erro desconhecido ao conectar.")
        }
    }

    const handleSync = async () => {
        try {
            await syncData()
        } catch (err) {
            console.error("Sync failed manually", err)
        }
    }

    const handleFacebookSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFbError(null)
        try {
            await connectFacebook({ appId: fbAppId, accessToken: fbAccessToken })
        } catch (err: any) {
            setFbError(err.message || "Erro ao conectar Facebook.")
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Conexão WooCommerce</CardTitle>
                        <CardDescription>
                            Conecte sua loja para importar os dados automaticamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isConnected ? (
                            <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <div className="text-center">
                                    <h3 className="text-lg font-medium">Loja Conectada</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Seus dados estão sendo sincronizados.
                                    </p>
                                </div>
                                <div className="flex space-x-2 w-full max-w-xs">
                                    <Button variant="outline" className="flex-1" onClick={handleSync} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Sincronizar
                                    </Button>
                                    <Button variant="destructive" className="flex-1" onClick={disconnect} disabled={isLoading}>
                                        Desconectar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Erro</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="url">URL da Loja</Label>
                                    <Input
                                        id="url"
                                        placeholder="https://sualoja.com.br"
                                        value={url}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="key">Consumer Key</Label>
                                    <Input
                                        id="key"
                                        placeholder="ck_xxxxxxxxxxxxxxxx"
                                        value={key}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secret">Consumer Secret</Label>
                                    <Input
                                        id="secret"
                                        placeholder="cs_xxxxxxxxxxxxxxxx"
                                        type="password"
                                        value={secret}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecret(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? "Conectando..." : "Conectar Loja"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Conexão Facebook Ads</CardTitle>
                        <CardDescription>
                            Conecte sua conta de anúncios para importar dados de campanhas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isFacebookConnected ? (
                            <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                <CheckCircle className="h-16 w-16 text-blue-500" />
                                <div className="text-center">
                                    <h3 className="text-lg font-medium">Facebook Conectado</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Integração ativa.
                                    </p>
                                </div>
                                <Button variant="destructive" className="w-full max-w-xs" onClick={disconnectFacebook} disabled={isFbLoading}>
                                    Desconectar
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleFacebookSubmit} className="space-y-4">
                                {fbError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Erro</AlertTitle>
                                        <AlertDescription>{fbError}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="fbAppId">App ID</Label>
                                    <Input
                                        id="fbAppId"
                                        placeholder="1234567890"
                                        value={fbAppId}
                                        onChange={(e) => setFbAppId(e.target.value)}
                                        required
                                        disabled={isFbLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fbAccessToken">Access Token</Label>
                                    <Input
                                        id="fbAccessToken"
                                        placeholder="EAA..."
                                        type="password"
                                        value={fbAccessToken}
                                        onChange={(e) => setFbAccessToken(e.target.value)}
                                        required
                                        disabled={isFbLoading}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isFbLoading}>
                                    {isFbLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isFbLoading ? "Conectando..." : "Conectar Facebook"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
