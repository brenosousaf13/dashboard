import { Search } from "lucide-react"
import { Input } from "./ui/input"

export function SearchBar() {
    return (
        <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Buscar..."
                className="w-[280px] pl-9 pr-12 h-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-violet-500"
            />
            <div className="absolute right-2 flex items-center gap-0.5">
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground hidden sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>
        </div>
    )
}
