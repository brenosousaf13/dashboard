import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "../lib/utils"

interface StatCardProps {
    title: string
    value: string
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
    subtitle?: string
    highlighted?: boolean
    icon?: React.ReactNode
    onClick?: () => void
}

export function StatCard({
    title,
    value,
    change,
    changeType = 'neutral',
    subtitle,
    highlighted = false,
    icon,
    onClick
}: StatCardProps) {
    return (
        <div
            className={cn(
                "relative p-6 rounded-2xl transition-all duration-200 cursor-pointer group",
                highlighted
                    ? "stat-card-highlighted border border-violet-200"
                    : "bg-white border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
            )}
            onClick={onClick}
        >
            {/* Arrow icon */}
            <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ArrowUpRight className="h-4 w-4 text-gray-600" />
            </button>

            {/* Icon */}
            {icon && (
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center mb-4",
                    highlighted ? "bg-violet-200/50" : "bg-gray-100"
                )}>
                    {icon}
                </div>
            )}

            {/* Title */}
            <p className={cn(
                "text-sm font-medium mb-2",
                highlighted ? "text-violet-700" : "text-gray-500"
            )}>
                {title}
            </p>

            {/* Value */}
            <p className={cn(
                "text-3xl font-bold tracking-tight",
                highlighted ? "text-violet-900" : "text-gray-900"
            )}>
                {value}
            </p>

            {/* Change indicator */}
            {change && (
                <div className="flex items-center gap-1.5 mt-3">
                    {changeType === 'positive' && (
                        <div className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">{change}</span>
                        </div>
                    )}
                    {changeType === 'negative' && (
                        <div className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">{change}</span>
                        </div>
                    )}
                    {changeType === 'neutral' && (
                        <span className="text-sm text-gray-500">{change}</span>
                    )}
                    {subtitle && (
                        <span className="text-sm text-gray-400">{subtitle}</span>
                    )}
                </div>
            )}

            {/* Subtitle without change */}
            {!change && subtitle && (
                <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
            )}
        </div>
    )
}
