import { useEffect, useMemo, useState } from "react"
import { Activity, MapPin, Plane, Users } from "lucide-react"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { api, extractErrorMessage } from "@/lib/api"

const cityPalette = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fb923c"]

export default function AdminAnalyticsPage() {
  const [trips, setTrips] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/trips")
        const tripsData = res.data?.trips || res.data?.data || res.data || []
        setTrips(Array.isArray(tripsData) ? tripsData : [])
      } catch (err) {
        setError(extractErrorMessage(err))
      }
    }
    run()
  }, [])

  const metrics = useMemo(() => {
    const total = trips.length
    const collaborators = trips.reduce((sum, trip) => sum + (trip.collaborators?.length || 0), 0)
    const budget = trips.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0)
    const cities = trips
      .map((trip) => trip.destination || "Unassigned")
      .reduce((acc, city) => ({ ...acc, [city]: (acc[city] || 0) + 1 }), {})
    const topCities = Object.entries(cities).map(([name, value]) => ({ name, value })).slice(0, 6)
    const growth = trips.slice(0, 8).map((trip, idx) => ({ label: `T${idx + 1}`, trips: idx + 1, budget: Number(trip.budget || 0) }))
    return { total, collaborators, budget, topCities, growth }
  }, [trips])

  return (
    <div className="space-y-5 pb-6">
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-white">Admin Analytics</h1>
          <p className="mt-1 text-sm text-slate-300">Track travel operations, collaboration trends, and engagement metrics.</p>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Platform Trips", value: metrics.total, icon: Plane },
          { label: "Engaged Users", value: metrics.collaborators, icon: Users },
          { label: "Tracked Budget", value: `$${metrics.budget.toLocaleString()}`, icon: Activity },
          { label: "Top Cities", value: metrics.topCities.length, icon: MapPin },
        ].map((item) => (
          <Card key={item.label} className="glass-card rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs text-slate-300">{item.label}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <item.icon className="size-4 text-cyan-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <p className="font-medium text-white">Trip Growth</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.growth}>
                  <XAxis dataKey="label" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip />
                  <Line type="monotone" dataKey="trips" stroke="#22d3ee" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <p className="font-medium text-white">Activity Popularity (Budget Proxy)</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.growth}>
                  <XAxis dataKey="label" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip />
                  <Bar dataKey="budget" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card rounded-2xl">
        <CardContent className="p-5">
          <p className="font-medium text-white">Top Cities</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.topCities} dataKey="value" nameKey="name" outerRadius={90}>
                  {metrics.topCities.map((entry, idx) => <Cell key={entry.name} fill={cityPalette[idx % cityPalette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
