import { SearchBar } from "./SearchBar"
import { NotificationBell } from "./NotificationBell"
import { MessageIcon } from "./MessageIcon"
import { UserMenu } from "./UserMenu"
import { useData } from "../context/DataContext"

export function Header() {
    const { storeName, logoUrl } = useData()

    return (
        <header className="fixed top-0 right-0 left-0 md:left-64 h-[70px] bg-white border-b border-gray-200 z-40 transition-all duration-300">
            <div className="flex items-center justify-between h-full px-4 md:px-6">
                {/* Left side - Logo on mobile, Search on desktop */}
                <div className="flex items-center gap-4">
                    {/* Mobile logo - shown only on mobile */}
                    <div className="flex md:hidden items-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt={storeName} className="h-8 object-contain" />
                        ) : (
                            <span className="text-lg font-bold text-violet-600">Noord</span>
                        )}
                    </div>

                    {/* Search bar - hidden on mobile */}
                    <div className="hidden md:block">
                        <SearchBar />
                    </div>
                </div>

                {/* Right side - Notifications & User */}
                <div className="flex items-center gap-2 md:gap-4">
                    <MessageIcon />
                    <NotificationBell />

                    {/* Separator - hidden on mobile */}
                    <div className="hidden md:block w-px h-8 bg-gray-200" />

                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
