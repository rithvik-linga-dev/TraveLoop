import { Bell, Menu, Search, User, LogOut, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { clearAuthToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

/**
 * @param {{ className?: string; onOpenMobileNav?: () => void }} props
 */
export function Navbar({ className, onOpenMobileNav }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuthToken()
    toast.success("Signed out successfully.")
    navigate("/login", { replace: true })
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/65 px-4 backdrop-blur-xl md:gap-4 md:px-6",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="size-[18px]" />
      </Button>

      <div className="relative min-w-0 flex-1 md:max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search trips, places, people…"
          className="h-10 rounded-xl border-white/10 bg-white/5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="relative rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              You&apos;re all caught up.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-white/15 bg-white/5 px-2 text-slate-200 hover:bg-white/10 sm:pr-3"
              aria-label="Account menu"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-semibold text-white">
                JL
              </span>
              <span className="hidden max-w-[8rem] truncate text-left font-medium normal-case tracking-normal sm:inline">
                Jamie Lee
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal normal-case">
              <span className="block text-sm font-medium">Jamie Lee</span>
              <span className="block truncate text-[11px] font-normal tracking-normal text-muted-foreground normal-case">
                jamie@example.com
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
