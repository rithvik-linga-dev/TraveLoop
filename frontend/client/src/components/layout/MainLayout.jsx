import { useState } from "react"
import { Outlet } from "react-router-dom"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"

export function MainLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="relative flex min-h-dvh bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),_transparent_35%),radial-gradient(circle_at_85%_10%,_rgba(6,182,212,0.18),_transparent_30%),radial-gradient(circle_at_50%_100%,_rgba(244,114,182,0.15),_transparent_35%)]" />
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="border-r border-white/10 bg-transparent p-0 sm:max-w-[min(85vw,16rem)]"
          showCloseButton
        >
          <Sidebar className="h-full w-full border-0" onNavClick={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
