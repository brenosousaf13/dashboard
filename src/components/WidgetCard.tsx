import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { MoreHorizontal } from "lucide-react"

interface WidgetCardProps {
    title?: string
    subtitle?: string
    action?: React.ReactNode
    children: React.ReactNode
    className?: string
    noPadding?: boolean
    headerClassName?: string
}

export function WidgetCard({
    title,
    subtitle,
    action,
    children,
    className,
    noPadding = false,
    headerClassName
}: WidgetCardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-2xl border border-gray-100 shadow-card transition-all duration-200 hover:shadow-card-hover",
                className
            )}
        >
            {/* Header */}
            {(title || action) && (
                <div className={cn(
                    "flex items-center justify-between p-6 pb-0",
                    headerClassName
                )}>
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {action ? (
                        action
                    ) : title && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={cn(
                noPadding ? "" : "p-6",
                title && !noPadding && "pt-4"
            )}>
                {children}
            </div>
        </div>
    )
}
