import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Compass, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api, extractErrorMessage } from "@/lib/api"
import { isAuthenticated, setAuthToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

function validateName(value) {
  const v = value.trim()
  if (!v) return "Name is required."
  if (v.length < 2) return "Name should be at least 2 characters."
  return ""
}

function validateEmail(value) {
  const v = value.trim()
  if (!v) return "Email is required."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address."
  return ""
}

function validatePassword(value) {
  if (!value) return "Password is required."
  if (value.length < 8) return "Use at least 8 characters."
  return ""
}

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState(/** @type {{ name?: string; email?: string; password?: string }} */ ({}))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError("")

    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors({
      name: next.name || undefined,
      email: next.email || undefined,
      password: next.password || undefined,
    })
    if (next.name || next.email || next.password) return

    try {
      setSubmitting(true)
      const res = await api.post("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
      })

      const token =
        res?.data?.token ?? res?.data?.accessToken ?? res?.data?.jwt ?? res?.data?.data?.token ?? null

      if (!token || typeof token !== "string") {
        throw new Error("Signup succeeded but no token was returned.")
      }

      setAuthToken(token)
      toast.success("Account created successfully.")
      navigate("/dashboard", { replace: true })
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
                <CardTitle className="text-xl normal-case tracking-tight">Create account</CardTitle>
              </div>
            </div>
            <CardDescription>Create your workspace and start planning trips with your team.</CardDescription>
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
                <label htmlFor="register-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  disabled={submitting}
                  onChange={(ev) => {
                    setName(ev.target.value)
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                  }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "register-name-error" : undefined}
                  className="h-11 rounded-md border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25"
                  placeholder="Alex Morgan"
                />
                {errors.name ? (
                  <p id="register-name-error" className="text-xs font-medium text-destructive" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="register-email"
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
                  aria-describedby={errors.email ? "register-email-error" : undefined}
                  className="h-11 rounded-md border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25"
                  placeholder="you@company.com"
                />
                {errors.email ? (
                  <p id="register-email-error" className="text-xs font-medium text-destructive" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={submitting}
                  onChange={(ev) => {
                    setPassword(ev.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "register-password-error" : undefined}
                  className="h-11 rounded-md border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/25"
                  placeholder="At least 8 characters"
                />
                {errors.password ? (
                  <p id="register-password-error" className="text-xs font-medium text-destructive" role="alert">
                    {errors.password}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Use 8+ characters for a stronger account.</p>
                )}
              </div>

              <Button type="submit" className="h-11 w-full rounded-md" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Already have an account?</p>
            <Button variant="outline" className="h-10 w-full rounded-md sm:w-auto" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

