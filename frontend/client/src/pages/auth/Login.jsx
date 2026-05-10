import { useMemo, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Compass, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api, extractErrorMessage } from "@/lib/api"
import { isAuthenticated, setAuthToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

function validateEmail(value) {
  const v = value.trim()
  if (!v) return "Email is required."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address."
  return ""
}

function validatePassword(value) {
  if (!value) return "Password is required."
  return ""
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState(/** @type {{ email?: string; password?: string }} */ ({}))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const redirectTo = useMemo(() => {
    const from = location.state?.from?.pathname
    return typeof from === "string" && from.startsWith("/") ? from : "/dashboard"
  }, [location.state])

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError("")

    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors({
      email: next.email || undefined,
      password: next.password || undefined,
    })
    if (next.email || next.password) return

    try {
      setSubmitting(true)
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      })

      const token =
        res?.data?.token ?? res?.data?.accessToken ?? res?.data?.jwt ?? res?.data?.data?.token ?? null

      if (!token || typeof token !== "string") {
        throw new Error("Login succeeded but no token was returned.")
      }

      setAuthToken(token)
      toast.success("Welcome back!")
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message = extractErrorMessage(err)
      setFormError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "relative min-h-dvh bg-gradient-to-b from-muted/40 via-background to-background",
        "dark:from-background dark:via-background dark:to-muted/20"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 12%, transparent) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />

      <div className="relative flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md rounded-xl border-border/80 shadow-lg ring-1 ring-foreground/5">
          <CardHeader className="space-y-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 dark:bg-primary/15">
                <Compass className="size-5 text-primary" aria-hidden />
              </div>
              <div>
                <p className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Traveloop
                </p>
                <CardTitle className="text-xl normal-case tracking-tight">Sign in</CardTitle>
              </div>
            </div>
            <CardDescription>Welcome back. Continue planning with a calm, Odoo-style workspace.</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {formError ? (
                <div
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={submitting}
                  onChange={(ev) => {
                    setEmail(ev.target.value)
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  className="h-11 rounded-md border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25"
                  placeholder="you@company.com"
                />
                {errors.email ? (
                  <p id="login-email-error" className="text-xs font-medium text-destructive" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={submitting}
                  onChange={(ev) => {
                    setPassword(ev.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className="h-11 rounded-md border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25"
                  placeholder="••••••••"
                />
                {errors.password ? (
                  <p id="login-password-error" className="text-xs font-medium text-destructive" role="alert">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <Button type="submit" className="h-11 w-full rounded-md" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">New to Traveloop?</p>
            <Button variant="outline" className="h-10 w-full rounded-md sm:w-auto" asChild>
              <Link to="/register">Create an account</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

