import { WidgetId } from "./WidgetSelector";
import { GaWidgetRenderer } from "./GaWidgets";

interface WidgetGridProps {
    widgets: WidgetId[];
    data: any;
    isLoading: boolean;
}

export function WidgetGrid({ widgets, data, isLoading }: WidgetGridProps) {
    // Separate widgets by type for better layout organization
    const metrics = widgets.filter(w => [
        'total_users', 'new_users', 'sessions', 'engagement_rate',
        'avg_session_duration', 'screen_page_views', 'event_count',
        'conversions', 'conversion_rate', 'total_revenue', 'avg_order_value'
    ].includes(w));

    const charts = widgets.filter(w => [
        'users_over_time', 'sessions_over_time', 'revenue_over_time', 'conversions_over_time',
        'traffic_sources', 'devices', 'browsers', 'countries',
        'top_pages', 'top_landing_pages', 'top_products', 'top_campaigns', 'top_cities'
    ].includes(w));

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            {metrics.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {metrics.map(id => (
                        <div key={id} className="h-full">
                            {isLoading ? (
                                <div className="h-[120px] rounded-xl bg-muted/50 animate-pulse" />
                            ) : (
                                <GaWidgetRenderer id={id} data={data?.[id]} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Charts Grid */}
            {charts.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {charts.map(id => (
                        <div key={id} className={
                            ['traffic_sources', 'devices', 'browsers', 'countries', 'top_pages', 'top_landing_pages', 'top_products', 'top_campaigns', 'top_cities'].includes(id)
                                ? "col-span-1 md:col-span-2 lg:col-span-3"
                                : "col-span-1 md:col-span-2 lg:col-span-4"
                        }>
                            {isLoading ? (
                                <div className="h-[400px] rounded-xl bg-muted/50 animate-pulse" />
                            ) : (
                                <GaWidgetRenderer id={id} data={data?.[id]} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
