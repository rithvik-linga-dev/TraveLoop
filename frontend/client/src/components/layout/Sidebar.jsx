import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ChartSpline,
  Bell,
  Settings,
  User,
  LogOut,
  Compass,
} from "lucide-react"
import { toast } from "sonner"

import { clearAuthToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trips", label: "Trips", icon: BriefcaseBusiness },
  { to: "/analytics", label: "Analytics/Admin", icon: ChartSpline },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: User },
]

/**
 * @param {{ className?: string; onNavClick?: () => void }} props
 */
export function Sidebar({ className, onNavClick }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuthToken()
    toast.success("Signed out successfully.")
    onNavClick?.()
    navigate("/login", { replace: true })
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-zinc-950 text-zinc-100",
        className
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-cyan-500/15 px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 shadow-lg ring-1 ring-white/20 backdrop-blur">
          <Compass className="size-4 text-cyan-300" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-[0.2em] text-white uppercase">
            Traveloop
          </p>
          <p className="truncate text-[11px] text-zinc-300/80">Travel OS</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main">
        <p className="px-3 py-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Workspace
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl border border-transparent py-2.5 pr-3 pl-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/10 hover:text-zinc-100",
                isActive && "border-white/15 bg-gradient-to-r from-violet-500/25 to-cyan-500/20 text-white shadow-lg"
              )
            }
          >
            <Icon
              className="size-[18px] shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-200 [[aria-current=page]_&]:text-cyan-300"
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-zinc-100"
        >
          <LogOut className="size-[18px] text-zinc-500 group-hover:text-zinc-300" aria-hidden />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export { navItems }
