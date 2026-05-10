import { Bell } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotificationsPage() {
  return (
    <div className="space-y-6 pb-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader className="border-b border-white/10 pb-5">
          <CardTitle className="text-2xl tracking-tight text-white">Notifications</CardTitle>
          <CardDescription>Global updates across all trip workspaces.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 text-center">
            <Bell className="size-8 text-cyan-300/80" aria-hidden />
            <p className="font-medium text-white">You&apos;re all caught up.</p>
            <p className="text-sm text-slate-300">
              New cross-workspace notifications will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
