import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Calendar, DollarSign, Loader2, Map, Plus, Users } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { api, extractErrorMessage } from "@/lib/api"

const destinationMock = ["Bali", "Kyoto", "Lisbon", "Queenstown", "Santorini", "Seoul"]

export function AppPage() {
  const [trips, setTrips] = useState([])
  const [moduleData, setModuleData] = useState({ budgets: {}, activities: [], notes: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const run = async () => {
      try {
        const tripsRes = await api.get("/trips")
        const tripsData = tripsRes.data?.trips || tripsRes.data?.data || tripsRes.data || []
        const normalizedTrips = Array.isArray(tripsData) ? tripsData : []
        setTrips(normalizedTrips)

        const moduleResults = await Promise.all(
          normalizedTrips.slice(0, 8).map(async (trip) => {
            const tripId = trip._id
            const result = { tripId, budget: null, activities: [], notes: [] }

            try {
              const budgetRes = await api.get(`/trips/${tripId}/budget`)
              result.budget = budgetRes.data?.budget || budgetRes.data?.data || budgetRes.data || null
            } catch {
              result.budget = null
            }

            try {
              const notesRes = await api.get(`/trips/${tripId}/notes`)
              const notes = notesRes.data?.notes || notesRes.data?.data || notesRes.data || []
              result.notes = Array.isArray(notes) ? notes.map((note) => ({ ...note, tripTitle: trip.title, tripId })) : []
            } catch {
              result.notes = []
            }

            try {
              const stopsRes = await api.get(`/trips/${tripId}/itinerary`)
              const stops = stopsRes.data?.stops || stopsRes.data?.data || stopsRes.data || []
              const pairs = await Promise.all(
                (Array.isArray(stops) ? stops : []).map(async (stop) => {
                  const activitiesRes = await api.get(`/trips/${tripId}/itinerary/${stop._id}/activities`)
                  const activities = activitiesRes.data?.activities || activitiesRes.data?.data || activitiesRes.data || []
                  return Array.isArray(activities)
                    ? activities.map((activity) => ({ ...activity, tripTitle: trip.title, tripId, stopName: stop.city }))
                    : []
                })
              )
              result.activities = pairs.flat()
            } catch {
              result.activities = []
            }

            return result
          })
        )

        setModuleData({
          budgets: Object.fromEntries(moduleResults.map((item) => [item.tripId, item.budget])),
          activities: moduleResults.flatMap((item) => item.activities),
          notes: moduleResults.flatMap((item) => item.notes),
        })
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const metrics = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const totalTrips = trips.length
    const upcomingTrips = trips.filter((trip) => {
      if (!trip.startDate) return false
      const start = new Date(trip.startDate)
      start.setHours(0, 0, 0, 0)
      return start >= now
    }).length

    const collaboratorSummary = trips.reduce((sum, t) => sum + (t.collaborators?.length || 0), 0)
    const projectedBudget = trips.reduce((sum, t) => sum + (Number(moduleData.budgets[t._id]?.totalCost || t.budget || t.totalBudget) || 0), 0)
    const activeTrips = trips.filter((trip) => {
      const nowDate = new Date()
      const start = trip.startDate ? new Date(trip.startDate) : null
      const end = trip.endDate ? new Date(trip.endDate) : null
      return start && end && start <= nowDate && end >= nowDate
    }).length

    const recentActivities = [...trips]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 5)
    const upcomingActivities = [...moduleData.activities]
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      .slice(0, 5)
    const recentNotes = [...moduleData.notes]
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
      .slice(0, 5)

    return {
      totalTrips,
      upcomingTrips,
      activeTrips,
      collaboratorSummary,
      projectedBudget,
      recentActivities,
      upcomingActivities,
      recentNotes,
    }
  }, [moduleData, trips])

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <Card className="overflow-hidden border-white/15 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/20 shadow-2xl backdrop-blur-xl">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-200/90 uppercase">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Design unforgettable trips with your team.</h1>
            <p className="mt-2 text-sm text-slate-100/85">Every itinerary, budget, and collaboration update in one premium workspace.</p>
          </div>
          <Button asChild className="h-11 rounded-xl bg-white text-slate-900 hover:bg-slate-100">
            <Link to="/trips">
              <Plus className="size-4" />
              Plan New Trip
            </Link>
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Trips", value: metrics.totalTrips, icon: Map },
          { label: "Active Trips", value: metrics.activeTrips, icon: Calendar },
          { label: "Upcoming", value: metrics.upcomingTrips, icon: ArrowRight },
          { label: "Collaborators", value: metrics.collaboratorSummary, icon: Users },
          { label: "Budget", value: `$${metrics.projectedBudget.toLocaleString()}`, icon: DollarSign },
        ].map((item) => (
          <Card key={item.label} className="glass-card rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs tracking-wide text-slate-300">{item.label}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <item.icon className="size-4 text-cyan-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card rounded-2xl lg:col-span-2">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-white">Recent Trips</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {metrics.recentActivities.slice(0, 4).map((trip) => (
                <Link key={trip._id} to={`/trips/${trip._id}`} className="rounded-xl border border-white/15 bg-white/5 p-3 transition hover:-translate-y-0.5 hover:bg-white/10">
                  <p className="font-medium text-white">{trip.title}</p>
                  <p className="text-xs text-slate-300">Updated {new Date(trip.updatedAt || trip.createdAt).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-white">Recommended Destinations</p>
            <div className="mt-3 space-y-2">
              {destinationMock.map((place) => <p key={place} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200">{place}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-white">Budget Highlights</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trips.slice(0, 6).map((trip, idx) => ({ i: idx + 1, budget: Number(moduleData.budgets[trip._id]?.totalCost || trip.budget || 0) }))}>
                  <Tooltip />
                  <Area type="monotone" dataKey="budget" stroke="#67e8f9" fill="url(#dashboardBudget)" />
                  <defs>
                    <linearGradient id="dashboardBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#67e8f9" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-white">Upcoming Activities</p>
            <div className="mt-3 space-y-3">
              {metrics.upcomingActivities.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">No activities planned yet.</p>
              ) : metrics.upcomingActivities.map((activity) => (
                <div key={activity._id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <p><span className="font-semibold">{activity.title}</span> in {activity.stopName || activity.location || "Trip stop"}</p>
                  <p className="mt-1 text-xs text-slate-300">{activity.tripTitle} | {activity.category || "General"} | ${Number(activity.cost || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card rounded-2xl">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-white">Recent Notes</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {metrics.recentNotes.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">No notes captured yet.</p>
            ) : metrics.recentNotes.map((note) => (
              <Link key={note._id} to={`/trips/${note.tripId}?tab=notes`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 transition hover:bg-white/10">
                <p className="font-semibold text-white">{note.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">{note.content || "No content"}</p>
                <p className="mt-2 text-xs text-slate-400">{note.tripTitle} {note.tag ? `| #${note.tag}` : ""}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
