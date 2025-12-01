import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, subDays, startOfToday, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type DateRange } from "react-day-picker"

import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover"


interface CalendarDateRangePickerProps {
    className?: string;
    date?: DateRange;
    setDate?: (date: DateRange | undefined) => void;
}

export function CalendarDateRangePicker({
    className,
    date,
    setDate,
}: CalendarDateRangePickerProps) {
    const [month, setMonth] = React.useState<Date>(new Date())

    const presets = [
        {
            label: "Hoje",
            getValue: () => {
                const today = startOfToday()
                return { from: today, to: today }
            },
        },
        {
            label: "Ontem",
            getValue: () => {
                const yesterday = subDays(startOfToday(), 1)
                return { from: yesterday, to: yesterday }
            },
        },
        {
            label: "Últimos 7 dias",
            getValue: () => {
                const today = startOfToday()
                return { from: subDays(today, 6), to: today }
            },
        },
        {
            label: "Últimos 30 dias",
            getValue: () => {
                const today = startOfToday()
                return { from: subDays(today, 29), to: today }
            },
        },
        {
            label: "Este Mês",
            getValue: () => {
                const today = startOfToday()
                return { from: startOfMonth(today), to: endOfMonth(today) }
            },
        },
        {
            label: "Mês Passado",
            getValue: () => {
                const today = startOfToday()
                const lastMonth = subMonths(today, 1)
                return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
            },
        },
    ]

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                                    {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                        ) : (
                            <span>Selecione uma data</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex">
                        <div className="flex flex-col gap-2 p-3 border-r">
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    className="justify-start font-normal text-sm"
                                    onClick={() => {
                                        const range = preset.getValue()
                                        setDate?.(range)
                                        setMonth(range.from) // Update calendar view
                                    }}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={month}
                            month={month}
                            onMonthChange={setMonth}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            locale={ptBR}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
