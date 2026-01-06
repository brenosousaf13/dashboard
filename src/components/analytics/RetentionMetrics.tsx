import { WidgetCard } from "../WidgetCard"
import { Users, DollarSign, BarChart3 } from "lucide-react"

interface RetentionMetricsProps {
    customers?: { total: number };
}

export function RetentionMetrics({ className, customers }: { className?: string } & RetentionMetricsProps) {
    return (
        <WidgetCard
            title="Retenção e Clientes"
            subtitle="LTV e Fidelidade"
            className={className}
        >
            <div className="grid md:grid-cols-2 gap-6">
                <div className="h-[200px] flex items-center justify-center border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="text-center px-4">
                        <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">
                            Gráfico de retenção indisponível<br />(Requer dados históricos)
                        </p>
                    </div>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                    <div className="p-4 bg-violet-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-violet-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Total de Clientes</span>
                        </div>
                        <div className="text-3xl font-bold text-violet-700">{customers?.total || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Cadastrados na loja</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">LTV (Lifetime Value)</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">R$ 0,00</div>
                        <p className="text-xs text-gray-500 mt-1">Média gasta por cliente</p>
                    </div>
                </div>
            </div>
        </WidgetCard>
    )
}

