import { LogOut, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearAuthToken } from "@/lib/auth"

export default function ProfilePage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuthToken()
    toast.success("Signed out successfully.")
    navigate("/login", { replace: true })
  }

  return (
    <div className="space-y-6 pb-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader className="border-b border-white/10 pb-5">
          <CardTitle className="text-2xl tracking-tight text-white">Profile</CardTitle>
          <CardDescription>Manage your account and session.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 rounded-xl border border-white/15 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
                <User className="size-5 text-white" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-white">Jamie Lee</p>
                <p className="text-sm text-slate-300">jamie@example.com</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
