import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GoogleAnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Google Analytics</h1>
                <p className="text-muted-foreground">
                    Acompanhe as métricas do seu site diretamente por aqui.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Integração em Breve</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Estamos trabalhando para trazer os dados do Google Analytics para o seu dashboard.</p>
                </CardContent>
            </Card>
        </div>
    )
}
