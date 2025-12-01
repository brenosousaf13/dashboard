import { useMemo, useState } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleLinear } from "d3-scale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tooltip as ReactTooltip } from "react-tooltip"

// Brazil TopoJSON URL
const GEO_URL = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson"

interface BrazilMapProps {
    className?: string
    orders?: any[]
}

export function BrazilMap({ className, orders = [] }: BrazilMapProps) {
    const [tooltipContent, setTooltipContent] = useState("")

    // Process orders to get sales by state
    const { stateData, maxSales, topStates } = useMemo(() => {
        const salesByState: Record<string, number> = {}

        if (orders) {
            orders.forEach(order => {
                // Try to find state in billing or shipping
                const state = order.billing?.state || order.shipping?.state
                if (state) {
                    // Normalize state code (usually 2 letters like SP, RJ)
                    const normalizedState = state.toUpperCase().trim()
                    salesByState[normalizedState] = (salesByState[normalizedState] || 0) + 1
                }
            })
        }

        const max = Math.max(...Object.values(salesByState), 0)

        const top = Object.entries(salesByState)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }))

        return { stateData: salesByState, maxSales: max, topStates: top }
    }, [orders])

    const colorScale = scaleLinear<string>()
        .domain([0, maxSales || 1])
        .range(["#EEE", "#0f172a"]) // Light gray to Primary (dark blue/slate)

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Dados Geográficos</CardTitle>
                <CardDescription>Vendas por Estado</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="h-[300px] w-full border rounded-md bg-slate-50 relative" data-tooltip-id="geo-tooltip">
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{
                                scale: 600,
                                center: [-54, -15]
                            }}
                            style={{ width: "100%", height: "100%" }}
                        >
                            <ZoomableGroup>
                                <Geographies geography={GEO_URL}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
                                            // GeoJSON from click_that_hood has 'sigla' property for state code? 
                                            // Let's check typical properties. Usually 'properties.sigla' or 'properties.name'.
                                            // The URL is GeoJSON. Properties likely have 'name' and 'sigla' (or similar).
                                            // For this specific URL, properties are like { name: "São Paulo", sigla: "SP" } usually.
                                            // Let's assume 'sigla' exists or map name to sigla if needed.
                                            // Actually, looking at the source, it has 'sigla'.
                                            const stateCode = geo.properties.sigla || geo.properties.name
                                            const sales = stateData[stateCode] || 0

                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    fill={sales > 0 ? colorScale(sales) : "#EEE"}
                                                    stroke="#FFF"
                                                    strokeWidth={0.5}
                                                    style={{
                                                        default: { outline: "none" },
                                                        hover: { fill: "#F53", outline: "none", cursor: "pointer" },
                                                        pressed: { outline: "none" },
                                                    }}
                                                    onMouseEnter={() => {
                                                        setTooltipContent(`${geo.properties.name}: ${sales} vendas`)
                                                    }}
                                                    onMouseLeave={() => {
                                                        setTooltipContent("")
                                                    }}
                                                />
                                            )
                                        })
                                    }
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                        <ReactTooltip id="geo-tooltip" content={tooltipContent} float />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-3">Top 5 Estados</h4>
                        <div className="space-y-3">
                            {topStates.length > 0 ? (
                                topStates.map((state, index) => (
                                    <div key={state.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold w-4">{index + 1}.</span>
                                            <span>{state.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${(state.value / maxSales) * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-medium min-w-[3ch] text-right">{state.value}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma venda registrada com dados de localização.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
