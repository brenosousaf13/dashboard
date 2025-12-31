import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export type WidgetId =
    | 'active_users_realtime' | 'total_users' | 'new_users' | 'sessions'
    | 'engagement_rate' | 'avg_session_duration' | 'screen_page_views'
    | 'event_count' | 'conversions' | 'conversion_rate' | 'total_revenue' | 'avg_order_value'
    | 'users_over_time' | 'sessions_over_time' | 'revenue_over_time' | 'conversions_over_time'
    | 'traffic_sources' | 'devices' | 'browsers' | 'countries'
    | 'top_pages' | 'top_landing_pages' | 'top_products' | 'top_campaigns' | 'top_cities';

interface WidgetSelectorProps {
    enabledWidgets: WidgetId[];
    onSave: (widgets: WidgetId[]) => void;
}

const WIDGET_CATEGORIES = {
    metrics: {
        label: "Métricas (Cards)",
        widgets: [
            { id: 'total_users', label: 'Total de Usuários' },
            { id: 'new_users', label: 'Novos Usuários' },
            { id: 'sessions', label: 'Sessões' },
            { id: 'engagement_rate', label: 'Taxa de Engajamento' },
            { id: 'avg_session_duration', label: 'Duração Média' },
            { id: 'screen_page_views', label: 'Visualizações de Página' },
            { id: 'event_count', label: 'Total de Eventos' },
            { id: 'conversions', label: 'Conversões' },
            { id: 'conversion_rate', label: 'Taxa de Conversão' },
            { id: 'total_revenue', label: 'Receita Total' },
            { id: 'avg_order_value', label: 'Ticket Médio' },
        ]
    },
    charts: {
        label: "Gráficos",
        widgets: [
            { id: 'users_over_time', label: 'Usuários ao Longo do Tempo' },
            { id: 'sessions_over_time', label: 'Sessões ao Longo do Tempo' },
            { id: 'revenue_over_time', label: 'Receita ao Longo do Tempo' },
            { id: 'conversions_over_time', label: 'Conversões ao Longo do Tempo' },
            { id: 'traffic_sources', label: 'Fontes de Tráfego (Pizza)' },
            { id: 'devices', label: 'Dispositivos (Pizza)' },
            { id: 'browsers', label: 'Navegadores (Pizza)' },
            { id: 'countries', label: 'Países (Pizza)' },
        ]
    },
    tables: {
        label: "Tabelas",
        widgets: [
            { id: 'top_pages', label: 'Páginas Mais Visitadas' },
            { id: 'top_landing_pages', label: 'Páginas de Entrada' },
            { id: 'top_products', label: 'Produtos Mais Vendidos' },
            { id: 'top_campaigns', label: 'Campanhas' },
            { id: 'top_cities', label: 'Cidades' },
        ]
    }
};

export function WidgetSelector({ enabledWidgets, onSave }: WidgetSelectorProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Set<WidgetId>>(new Set(enabledWidgets));

    const handleToggle = (id: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id as WidgetId)) {
            newSelected.delete(id as WidgetId);
        } else {
            newSelected.add(id as WidgetId);
        }
        setSelected(newSelected);
    };

    const handleSave = () => {
        onSave(Array.from(selected));
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (val) setSelected(new Set(enabledWidgets));
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Widget
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Personalizar Dashboard</DialogTitle>
                    <DialogDescription>
                        Selecione as métricas e gráficos que deseja visualizar.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="metrics">Métricas</TabsTrigger>
                        <TabsTrigger value="charts">Gráficos</TabsTrigger>
                        <TabsTrigger value="tables">Tabelas</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4 border rounded-md p-4">
                        <TabsContent value="metrics" className="mt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {WIDGET_CATEGORIES.metrics.widgets.map((widget) => (
                                    <div key={widget.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => handleToggle(widget.id)}>
                                        <Checkbox
                                            id={widget.id}
                                            checked={selected.has(widget.id as WidgetId)}
                                            onCheckedChange={() => handleToggle(widget.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={widget.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {widget.label}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="charts" className="mt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {WIDGET_CATEGORIES.charts.widgets.map((widget) => (
                                    <div key={widget.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => handleToggle(widget.id)}>
                                        <Checkbox
                                            id={widget.id}
                                            checked={selected.has(widget.id as WidgetId)}
                                            onCheckedChange={() => handleToggle(widget.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={widget.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {widget.label}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="tables" className="mt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {WIDGET_CATEGORIES.tables.widgets.map((widget) => (
                                    <div key={widget.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => handleToggle(widget.id)}>
                                        <Checkbox
                                            id={widget.id}
                                            checked={selected.has(widget.id as WidgetId)}
                                            onCheckedChange={() => handleToggle(widget.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={widget.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {widget.label}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Configuração</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
