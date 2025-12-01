import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

const data = [
    { name: "Sessões", value: 5000, fill: "hsl(var(--primary))" },
    { name: "Visualizaram", value: 3500, fill: "hsl(var(--primary))" },
    { name: "Carrinho", value: 1200, fill: "hsl(var(--primary))" },
    { name: "Checkout", value: 800, fill: "hsl(var(--primary))" },
    { name: "Compra", value: 450, fill: "hsl(var(--primary))" },
]

export function ConversionFunnel({ className }: { className?: string }) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Taxa de Abandono de Carrinho: 62.5%</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={1 - (index * 0.15)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
