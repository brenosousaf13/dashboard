import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"


const geoData = [
    { name: "SP", value: 4000 },
    { name: "RJ", value: 3000 },
    { name: "MG", value: 2000 },
    { name: "RS", value: 1500 },
    { name: "PR", value: 1000 },
]

const deviceData = [
    { name: "Mobile", value: 80, fill: "hsl(var(--primary))" },
    { name: "Desktop", value: 20, fill: "hsl(var(--muted))" },
]

export function GeoTechContext({ className }: { className?: string }) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Contexto</CardTitle>
                <CardDescription>Geográfico e Dispositivos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="text-sm font-medium mb-4">Top Estados</h4>
                    <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={geoData} layout="vertical" margin={{ left: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={30} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium mb-2">Dispositivos</h4>
                    <div className="h-[150px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
