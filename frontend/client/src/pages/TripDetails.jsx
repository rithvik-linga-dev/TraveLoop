import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  DollarSign,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { PieChart, Pie, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api, extractErrorMessage } from "@/lib/api"

const SELECT_CLASS = "h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white"
const PRIMARY_ACTION_CLASS = "rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90"

function formatDate(dateLike) {
  if (!dateLike) return "N/A"
  return new Date(dateLike).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function toDateInput(dateLike) {
  if (!dateLike) return ""
  return new Date(dateLike).toISOString().slice(0, 10)
}

function money(value) {
  return `$${Number(value || 0).toLocaleString()}`
}

function OverviewTab({ trip, budget, stats, onGoTab }) {
  const collaboratorCount = stats.collaborators
  const total = Number(budget?.totalCost) || 0
  const spent = Number(budget?.activityCost) || 0
  const remaining = Math.max(total - spent, 0)

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-2xl">{trip.title}</CardTitle>
          <CardDescription>{trip.description || "No description provided yet."}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Dates</p>
              <p className="mt-2 text-sm font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Collaborators</p>
              <p className="mt-2 text-lg font-semibold">{collaboratorCount}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Budget Total</p>
              <p className="mt-2 text-lg font-semibold">${total.toLocaleString()}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Remaining</p>
              <p className="mt-2 text-lg font-semibold">${remaining.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Stops</p>
              <p className="mt-2 text-lg font-semibold">{stats.stops}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Activities</p>
              <p className="mt-2 text-lg font-semibold">{stats.activities}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Packed</p>
              <p className="mt-2 text-lg font-semibold">{stats.packedPercent}%</p>
            </div>
            <div className="rounded-md border border-border/70 bg-card/70 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Notes</p>
              <p className="mt-2 text-lg font-semibold">{stats.notes}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["itinerary", "activities", "budget", "packing", "notes", "collaborators"].map((tab) => (
              <Button key={tab} variant="outline" size="sm" onClick={() => onGoTab(tab)} className="rounded-xl capitalize">
                {tab}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Spent on activities: {money(spent)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ItineraryTab({ tripId, stops, refreshStops, loading }) {
  const [form, setForm] = useState({ city: "", country: "", arrivalDate: "", departureDate: "", notes: "" })
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setForm({ city: "", country: "", arrivalDate: "", departureDate: "", notes: "" })
    setEditingId(null)
  }

  const saveStop = async () => {
    try {
      setSaving(true)
      if (editingId) {
        await api.patch(`/trips/${tripId}/itinerary/${editingId}`, form)
      } else {
        await api.post(`/trips/${tripId}/itinerary`, form)
      }
      resetForm()
      await refreshStops()
      toast.success(editingId ? "Stop updated." : "Stop added.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteStop = async (stopId) => {
    try {
      await api.delete(`/trips/${tripId}/itinerary/${stopId}`)
      await refreshStops()
      toast.success("Stop deleted.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const startEdit = (stop) => {
    setEditingId(stop._id)
    setForm({
      city: stop.city || "",
      country: stop.country || "",
      arrivalDate: toDateInput(stop.arrivalDate),
      departureDate: toDateInput(stop.departureDate),
      notes: stop.notes || "",
    })
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Itinerary Timeline</CardTitle>
          <CardDescription>Create and organize destination stops across your tour flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
            <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country" />
            <Input type="date" value={form.arrivalDate} onChange={(e) => setForm((p) => ({ ...p, arrivalDate: e.target.value }))} />
            <Input type="date" value={form.departureDate} onChange={(e) => setForm((p) => ({ ...p, departureDate: e.target.value }))} />
          </div>
          <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveStop} disabled={saving} className={PRIMARY_ACTION_CLASS}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {editingId ? "Update stop" : "Add stop"}
            </Button>
            {editingId ? <Button variant="outline" onClick={resetForm}>Cancel edit</Button> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading stops...</div>
          ) : stops.length === 0 ? (
            <p className="text-sm text-muted-foreground">No itinerary stops yet.</p>
          ) : (
            <div className="relative space-y-3 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-px before:bg-border/70">
              {stops.map((stop) => (
                <div key={stop._id} className="relative pl-8">
                  <span className="absolute left-[7px] top-4 size-3 rounded-full border-2 border-primary bg-background" aria-hidden />
                  <div className="rounded-md border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{stop.city}, {stop.country}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(stop.arrivalDate)} - {formatDate(stop.departureDate)}</p>
                      {stop.notes ? <p className="mt-1 text-sm text-muted-foreground">{stop.notes}</p> : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(stop)}><Pencil className="size-4" /></Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => deleteStop(stop._id)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ActivitiesTab({ tripId, stops, activitiesByStop, refreshActivities }) {
  const [form, setForm] = useState({ stopId: "", title: "", category: "", cost: "", duration: "", location: "", description: "" })
  const [editingActivityId, setEditingActivityId] = useState(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [costFilter, setCostFilter] = useState("all")
  const [durationFilter, setDurationFilter] = useState("all")
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stops.flatMap((stop) =>
      (activitiesByStop[stop._id] || [])
        .filter((a) => !q || a.title?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q))
        .filter((a) => (typeFilter === "all" ? true : (a.category || "General") === typeFilter))
        .filter((a) => {
          if (costFilter === "all") return true
          const cost = Number(a.cost || 0)
          if (costFilter === "low") return cost < 50
          if (costFilter === "mid") return cost >= 50 && cost <= 150
          return cost > 150
        })
        .filter((a) => {
          if (durationFilter === "all") return true
          const d = String(a.duration || "").toLowerCase()
          if (durationFilter === "short") return d.includes("1") || d.includes("2") || d.includes("3")
          if (durationFilter === "medium") return d.includes("4") || d.includes("5") || d.includes("6")
          return d.includes("day") || d.includes("7") || d.includes("8") || d.includes("9")
        })
        .map((activity) => ({ activity, stop }))
    )
  }, [activitiesByStop, costFilter, durationFilter, search, stops, typeFilter])

  const categoryOptions = useMemo(
    () =>
      ["all", ...new Set(stops.flatMap((stop) => (activitiesByStop[stop._id] || []).map((a) => a.category || "General")))],
    [activitiesByStop, stops]
  )

  const resetForm = () => {
    setForm({ stopId: "", title: "", category: "", cost: "", duration: "", location: "", description: "" })
    setEditingActivityId(null)
  }

  const saveActivity = async () => {
    if (!form.stopId) return toast.error("Select a stop first.")
    try {
      setSaving(true)
      const payload = {
        title: form.title,
        category: form.category,
        cost: Number(form.cost) || 0,
        duration: form.duration,
        location: form.location,
        description: form.description,
      }
      if (editingActivityId) {
        await api.patch(`/trips/${tripId}/itinerary/${form.stopId}/activities/${editingActivityId}`, payload)
      } else {
        await api.post(`/trips/${tripId}/itinerary/${form.stopId}/activities`, payload)
      }
      resetForm()
      await refreshActivities()
      toast.success(editingActivityId ? "Activity updated." : "Activity added.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteActivity = async (stopId, activityId) => {
    try {
      await api.delete(`/trips/${tripId}/itinerary/${stopId}/activities/${activityId}`)
      await refreshActivities()
      toast.success("Activity deleted.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const startEdit = (stopId, activity) => {
    setEditingActivityId(activity._id)
    setForm({
      stopId,
      title: activity.title || "",
      category: activity.category || "",
      cost: String(Number(activity.cost) || 0),
      duration: activity.duration || "",
      location: activity.location || "",
      description: activity.description || "",
    })
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card rounded-2xl">
        <CardHeader><CardTitle>Activities</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select className={SELECT_CLASS} value={form.stopId} onChange={(e) => setForm((p) => ({ ...p, stopId: e.target.value }))}>
              <option value="">Select stop</option>
              {stops.map((s) => <option key={s._id} value={s._id}>{s.city}, {s.country}</option>)}
            </select>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Activity title" />
            <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" />
            <Input type="number" min="0" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} placeholder="Cost" />
            <Input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="Duration" />
            <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
          </div>
          <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveActivity} disabled={saving} className={PRIMARY_ACTION_CLASS}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {editingActivityId ? "Update activity" : "Add activity"}
            </Button>
            {editingActivityId ? <Button variant="outline" onClick={resetForm}>Cancel edit</Button> : null}
            <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities..." />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={SELECT_CLASS}>
              {categoryOptions.map((option) => <option key={option} value={option}>{option === "all" ? "All Types" : option}</option>)}
            </select>
            <select value={costFilter} onChange={(e) => setCostFilter(e.target.value)} className={SELECT_CLASS}>
              <option value="all">All Costs</option>
              <option value="low">Low (&lt; $50)</option>
              <option value="mid">Mid ($50 - $150)</option>
              <option value="high">High (&gt; $150)</option>
            </select>
            <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} className={SELECT_CLASS}>
              <option value="all">All Durations</option>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card rounded-2xl">
        <CardContent className="pt-4">
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No activities found.</p> : (
            <div className="space-y-2">
              {filtered.map(({ stop, activity }) => (
                <div key={activity._id} className="rounded-xl border border-white/15 bg-white/5 p-3 transition hover:bg-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{activity.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">{activity.category || "General"}</span>
                        <span className="text-xs text-slate-300">{stop.city}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{money(activity.cost)} | {activity.duration || "No duration"} | {activity.location || "No location"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => setSelectedActivity({ ...activity, stopName: `${stop.city}, ${stop.country}` })}><Eye className="size-4" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(stop._id, activity)}><Pencil className="size-4" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => deleteActivity(stop._id, activity._id)}><Trash2 className="size-4 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={Boolean(selectedActivity)} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedActivity?.title}</DialogTitle>
          </DialogHeader>
          {selectedActivity ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Category:</span> {selectedActivity.category || "General"}</p>
              <p><span className="font-medium">Location:</span> {selectedActivity.location || selectedActivity.stopName}</p>
              <p><span className="font-medium">Duration:</span> {selectedActivity.duration || "N/A"}</p>
              <p><span className="font-medium">Cost:</span> {money(selectedActivity.cost)}</p>
              <p><span className="font-medium">Description:</span> {selectedActivity.description || "No details provided."}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BudgetTab({ tripId, budget, refreshBudget }) {
  const [form, setForm] = useState(null)
  const budgetForm = form || {
    transportCost: String(Number(budget?.transportCost) || 0),
    stayCost: String(Number(budget?.stayCost) || 0),
    foodCost: String(Number(budget?.foodCost) || 0),
    miscellaneousCost: String(Number(budget?.miscellaneousCost) || 0),
  }

  const saveBudget = async () => {
    const payload = {
      transportCost: Number(budgetForm.transportCost) || 0,
      stayCost: Number(budgetForm.stayCost) || 0,
      foodCost: Number(budgetForm.foodCost) || 0,
      miscellaneousCost: Number(budgetForm.miscellaneousCost) || 0,
    }
    try {
      if (budget) await api.patch(`/trips/${tripId}/budget`, payload)
      else await api.post(`/trips/${tripId}/budget`, payload)
      setForm(null)
      await refreshBudget()
      toast.success("Budget saved.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const chartData = [
    { name: "Transport", value: Number(budget?.transportCost) || 0, color: "#4f46e5" },
    { name: "Stay", value: Number(budget?.stayCost) || 0, color: "#0ea5e9" },
    { name: "Food", value: Number(budget?.foodCost) || 0, color: "#10b981" },
    { name: "Misc", value: Number(budget?.miscellaneousCost) || 0, color: "#f97316" },
    { name: "Activities", value: Number(budget?.activityCost) || 0, color: "#a855f7" },
  ]
  const total = Number(budget?.totalCost) || 0
  const maxSlice = Math.max(...chartData.map((item) => item.value), 1)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {chartData.map((item) => (
          <Card key={item.name} className="border-border/70">
            <CardContent className="p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{item.name}</p>
              <p className="mt-2 text-lg font-semibold">{money(item.value)}</p>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${Math.round((item.value / maxSlice) * 100)}%`, backgroundColor: item.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-border/70">
        <CardHeader><CardTitle>Budget Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" min="0" value={budgetForm.transportCost} onChange={(e) => setForm({ ...budgetForm, transportCost: e.target.value })} placeholder="Transport" />
            <Input type="number" min="0" value={budgetForm.stayCost} onChange={(e) => setForm({ ...budgetForm, stayCost: e.target.value })} placeholder="Stay" />
            <Input type="number" min="0" value={budgetForm.foodCost} onChange={(e) => setForm({ ...budgetForm, foodCost: e.target.value })} placeholder="Food" />
            <Input type="number" min="0" value={budgetForm.miscellaneousCost} onChange={(e) => setForm({ ...budgetForm, miscellaneousCost: e.target.value })} placeholder="Miscellaneous" />
          </div>
          <Button onClick={saveBudget}><DollarSign className="size-4" /> {budget ? "Update budget" : "Create budget"}</Button>
          <p className="text-sm text-muted-foreground">Total budget: {money(total)}</p>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardHeader><CardTitle>Cost Distribution</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90}>
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function PackingTab({ tripId, items, refreshPacking }) {
  const [form, setForm] = useState({ title: "", quantity: "1", category: "" })
  const [editingId, setEditingId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState("all")

  const categoryOptions = useMemo(() => ["all", ...new Set(items.map((item) => item.category?.trim() || "General"))], [items])
  const visibleItems = useMemo(
    () => items.filter((item) => categoryFilter === "all" || (item.category?.trim() || "General") === categoryFilter),
    [categoryFilter, items]
  )
  const packedCount = items.filter((i) => i.packed).length
  const progress = items.length === 0 ? 0 : Math.round((packedCount / items.length) * 100)
  const grouped = useMemo(() => {
    return visibleItems.reduce((acc, item) => {
      const key = item.category?.trim() || "General"
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    }, {})
  }, [visibleItems])

  const resetForm = () => {
    setForm({ title: "", quantity: "1", category: "" })
    setEditingId(null)
  }

  const saveItem = async () => {
    try {
      const payload = { ...form, quantity: Number(form.quantity) || 1 }
      if (editingId) await api.patch(`/trips/${tripId}/packing/${editingId}`, payload)
      else await api.post(`/trips/${tripId}/packing`, payload)
      resetForm()
      await refreshPacking()
      toast.success(editingId ? "Packing item updated." : "Packing item added.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const togglePacked = async (item) => {
    try {
      await api.patch(`/trips/${tripId}/packing/${item._id}`, { packed: !item.packed })
      await refreshPacking()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const deleteItem = async (id) => {
    try {
      await api.delete(`/trips/${tripId}/packing/${id}`)
      await refreshPacking()
      toast.success("Packing item deleted.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id)
    setForm({ title: item.title || "", quantity: String(item.quantity || 1), category: item.category || "" })
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Packing Checklist</CardTitle>
          <CardDescription>{packedCount}/{items.length} packed ({progress}%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Item" />
            <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="Qty" />
            <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" />
            <select className={SELECT_CLASS} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categoryOptions.map((category) => <option key={category} value={category}>{category === "all" ? "All categories" : category}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveItem}><Plus className="size-4" /> {editingId ? "Update item" : "Add item"}</Button>
            {editingId ? <Button variant="outline" onClick={resetForm}>Cancel edit</Button> : null}
          </div>
        </CardContent>
      </Card>

      {Object.keys(grouped).length === 0 ? <p className="text-sm text-muted-foreground">No packing items yet.</p> : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <Card key={category} className="border-border/70">
              <CardHeader className="pb-3"><CardTitle className="text-base">{category}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {categoryItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-md border border-border/60 p-2">
                    <button className="flex items-center gap-2 text-left" onClick={() => togglePacked(item)}>
                      <span className={`inline-flex size-5 items-center justify-center rounded border ${item.packed ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {item.packed ? <Check className="size-3" /> : null}
                      </span>
                      <span className={item.packed ? "line-through text-muted-foreground" : ""}>{item.title} x{item.quantity}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(item)}><Pencil className="size-4" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => deleteItem(item._id)}><Trash2 className="size-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function NotesTab({ tripId, notes, refreshNotes }) {
  const [query, setQuery] = useState("")
  const [sortDir, setSortDir] = useState("newest")
  const [form, setForm] = useState({ title: "", content: "", tag: "", date: "" })
  const [editingId, setEditingId] = useState(null)
  const filtered = notes.filter((n) => {
    const q = query.trim().toLowerCase()
    return !q || n.title?.toLowerCase().includes(q) || n.tag?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
  }).sort((a, b) => {
    const diff = new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
    return sortDir === "newest" ? diff : -diff
  })

  const resetForm = () => {
    setForm({ title: "", content: "", tag: "", date: "" })
    setEditingId(null)
  }

  const saveNote = async () => {
    try {
      const payload = { ...form }
      if (!payload.date) delete payload.date
      if (editingId) await api.patch(`/trips/${tripId}/notes/${editingId}`, payload)
      else await api.post(`/trips/${tripId}/notes`, payload)
      resetForm()
      await refreshNotes()
      toast.success(editingId ? "Note updated." : "Note created.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const deleteNote = async (id) => {
    try {
      await api.delete(`/trips/${tripId}/notes/${id}`)
      await refreshNotes()
      toast.success("Note deleted.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const startEdit = (note) => {
    setEditingId(note._id)
    setForm({ title: note.title || "", content: note.content || "", tag: note.tag || "", date: toDateInput(note.date) })
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
            <Input value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} placeholder="Tag" />
            <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes..." />
          </div>
          <Input value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Content" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveNote}><Plus className="size-4" /> {editingId ? "Update note" : "Add note"}</Button>
            {editingId ? <Button variant="outline" onClick={resetForm}>Cancel edit</Button> : null}
            <select className={SELECT_CLASS} value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardContent className="pt-4 space-y-2">
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No notes found.</p> : filtered.map((note) => (
            <div key={note._id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">{note.tag ? `#${note.tag}` : "Untagged"} | {formatDate(note.date)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{note.content}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => startEdit(note)}><Pencil className="size-4" /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => deleteNote(note._id)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function CollaboratorsTab({ tripId, collaboratorsState, refreshCollaborators }) {
  const [email, setEmail] = useState("")

  const invite = async () => {
    try {
      await api.post(`/trips/${tripId}/collaborators`, { email })
      setEmail("")
      await refreshCollaborators()
      toast.success("Collaborator invited.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/trips/${tripId}/collaborators/${id}`)
      await refreshCollaborators()
      toast.success("Collaborator removed.")
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader><CardTitle>Collaborators</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-md" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Invite by email" />
            <Button onClick={invite}><Plus className="size-4" /> Invite</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardContent className="pt-4 space-y-2">
          {collaboratorsState.owner ? (
            <div className="rounded-md border border-border/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">OW</div>
                <div>
                  <p className="font-medium">{collaboratorsState.owner.name || collaboratorsState.owner.email}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </div>
            </div>
          ) : null}
          {collaboratorsState.collaborators?.length === 0 ? <p className="text-sm text-muted-foreground">No collaborators yet.</p> : collaboratorsState.collaborators?.map((person) => (
            <div key={person._id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">{(person.name || person.email || "C").slice(0, 2).toUpperCase()}</div>
                  <div>
                    <p className="font-medium">{person.name || person.email}</p>
                    <p className="text-xs text-muted-foreground">Collaborator</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(person._id)}>Remove</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TripDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [trip, setTrip] = useState(null)
  const [budget, setBudget] = useState(null)
  const [stops, setStops] = useState([])
  const [activitiesByStop, setActivitiesByStop] = useState({})
  const [packingItems, setPackingItems] = useState([])
  const [notes, setNotes] = useState([])
  const [collaboratorsState, setCollaboratorsState] = useState({ owner: null, collaborators: [] })
  const [loading, setLoading] = useState(true)
  const [loadingStops, setLoadingStops] = useState(false)
  const [error, setError] = useState("")
  const allowedTabs = ["overview", "itinerary", "activities", "budget", "packing", "notes", "collaborators"]
  const currentTab = allowedTabs.includes(searchParams.get("tab")) ? searchParams.get("tab") : "overview"
  const activitiesCount = useMemo(
    () => Object.values(activitiesByStop).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0),
    [activitiesByStop]
  )
  const packedPercent = packingItems.length === 0 ? 0 : Math.round((packingItems.filter((item) => item.packed).length / packingItems.length) * 100)
  const overviewStats = {
    stops: stops.length,
    activities: activitiesCount,
    packedPercent,
    notes: notes.length,
    collaborators: collaboratorsState.collaborators?.length || trip?.collaborators?.length || 0,
  }

  const goToTab = (tab) => {
    if (allowedTabs.includes(tab)) setSearchParams({ tab }, { replace: true })
  }

  const refreshBudget = useCallback(async () => {
    try {
      const res = await api.get(`/trips/${id}/budget`)
      setBudget(res.data?.budget || res.data?.data || res.data || null)
    } catch {
      setBudget(null)
    }
  }, [id])

  const refreshStops = useCallback(async () => {
    setLoadingStops(true)
    try {
      const res = await api.get(`/trips/${id}/itinerary`)
      const data = res.data?.stops || res.data?.data || res.data || []
      setStops(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoadingStops(false)
    }
  }, [id])

  const refreshActivities = useCallback(async () => {
    try {
      const stopRes = await api.get(`/trips/${id}/itinerary`)
      const rawStops = stopRes.data?.stops || stopRes.data?.data || stopRes.data || []
      const stopsData = Array.isArray(rawStops) ? rawStops : []
      setStops(stopsData)
      const pairs = await Promise.all(
        stopsData.map(async (stop) => {
          const res = await api.get(`/trips/${id}/itinerary/${stop._id}/activities`)
          const activities = res.data?.activities || res.data?.data || res.data || []
          return [stop._id, Array.isArray(activities) ? activities : []]
        })
      )
      setActivitiesByStop(Object.fromEntries(pairs))
      await refreshBudget()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }, [id, refreshBudget])

  const refreshPacking = useCallback(async () => {
    try {
      const res = await api.get(`/trips/${id}/packing`)
      const data = res.data?.packingItems || res.data?.data || res.data || []
      setPackingItems(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }, [id])

  const refreshNotes = useCallback(async () => {
    try {
      const res = await api.get(`/trips/${id}/notes`)
      const data = res.data?.notes || res.data?.data || res.data || []
      setNotes(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }, [id])

  const refreshCollaborators = useCallback(async () => {
    try {
      const res = await api.get(`/trips/${id}/collaborators`)
      setCollaboratorsState({
        owner: res.data?.owner || null,
        collaborators: res.data?.collaborators || [],
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }, [id])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const tripRes = await api.get(`/trips/${id}`)
        const tripData = tripRes.data?.trip || tripRes.data?.data || tripRes.data
        if (!tripData) {
          setError("Trip not found.")
          return
        }
        setTrip(tripData)
        await Promise.all([
          refreshBudget(),
          refreshStops(),
          refreshActivities(),
          refreshPacking(),
          refreshNotes(),
          refreshCollaborators(),
        ])
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    if (id) run()
  }, [id, refreshActivities, refreshBudget, refreshCollaborators, refreshNotes, refreshPacking, refreshStops])

  if (loading) {
    return <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Loading trip workspace...</div>
  }

  if (error || !trip) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/trips")} className="gap-2"><ArrowLeft className="size-4" /> Back to Trips</Button>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-5">
            <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error || "Trip not found."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      <Card className="overflow-hidden border-white/15 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-cyan-500/25 shadow-2xl">
        <CardContent className="p-0">
          <div className="relative overflow-hidden p-6">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-100/90 uppercase">Trip Workspace</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{trip.title}</h1>
                <p className="mt-1 text-sm text-slate-100/85">{trip.description || "Collaborative travel planning hub for your team."}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/trips")} className="gap-2 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"><ArrowLeft className="size-4" /> Back to Trips</Button>
            </div>
            <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white">
                <p className="text-xs text-slate-200">Collaborators</p>
                <p className="mt-1 text-lg font-semibold">{collaboratorsState.collaborators?.length || 0}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white">
                <p className="text-xs text-slate-200">Budget</p>
                <p className="mt-1 text-lg font-semibold">${Number(budget?.totalCost || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white">
                <p className="text-xs text-slate-200">Progress</p>
                <p className="mt-1 text-lg font-semibold">{stops.length} itinerary stops</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white">
                <p className="text-xs text-slate-200">Activities</p>
                <p className="mt-1 text-lg font-semibold">{activitiesCount} planned</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={currentTab}
        onValueChange={(nextTab) => {
          if (!allowedTabs.includes(nextTab)) return
          setSearchParams({ tab: nextTab }, { replace: true })
        }}
      >
        <TabsList variant="line" className="flex w-full justify-start overflow-x-auto rounded-2xl border border-white/15 bg-white/5 p-1 shadow-xl backdrop-blur">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="packing">Packing</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5"><OverviewTab trip={trip} budget={budget} stats={overviewStats} onGoTab={goToTab} /></TabsContent>
        <TabsContent value="itinerary" className="mt-5"><ItineraryTab tripId={id} stops={stops} refreshStops={refreshStops} loading={loadingStops} /></TabsContent>
        <TabsContent value="activities" className="mt-5"><ActivitiesTab tripId={id} stops={stops} activitiesByStop={activitiesByStop} refreshActivities={refreshActivities} /></TabsContent>
        <TabsContent value="budget" className="mt-5"><BudgetTab tripId={id} budget={budget} refreshBudget={refreshBudget} /></TabsContent>
        <TabsContent value="packing" className="mt-5"><PackingTab tripId={id} items={packingItems} refreshPacking={refreshPacking} /></TabsContent>
        <TabsContent value="notes" className="mt-5"><NotesTab tripId={id} notes={notes} refreshNotes={refreshNotes} /></TabsContent>
        <TabsContent value="collaborators" className="mt-5"><CollaboratorsTab tripId={id} collaboratorsState={collaboratorsState} refreshCollaborators={refreshCollaborators} /></TabsContent>
      </Tabs>
    </div>
  )
}
