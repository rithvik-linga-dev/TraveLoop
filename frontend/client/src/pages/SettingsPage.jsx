import { Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader className="border-b border-white/10 pb-5">
          <CardTitle className="text-2xl tracking-tight text-white">Settings</CardTitle>
          <CardDescription>Manage global application preferences and account defaults.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 text-center">
            <Settings className="size-8 text-violet-300/90" aria-hidden />
            <p className="font-medium text-white">Settings workspace is ready.</p>
            <p className="text-sm text-slate-300">
              Existing trip features remain inside each trip workspace.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
