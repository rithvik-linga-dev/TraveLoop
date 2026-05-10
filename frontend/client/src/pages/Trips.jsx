import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users,
  DollarSign,
  Edit2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api, extractErrorMessage } from "@/lib/api"

const EMPTY_FORM = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
}

function TripFormDialog({ trigger, onSave, initialData, isLoading }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialData || EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData(EMPTY_FORM)
    }
    setErrors({})
  }, [open, initialData])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title?.trim()) newErrors.title = "Title is required"
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date must be after start date"
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSave(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Trip" : "Create New Trip"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the trip details below."
              : "Add a new trip to your Traveloop dashboard."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Trip Title
            </label>
            <Input
              id="title"
              placeholder="e.g., Summer Europe Adventure"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                if (errors.title) setErrors({ ...errors, title: "" })
              }}
              disabled={isLoading}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-xs font-medium text-destructive">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Add trip details and notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              className="h-24 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value })
                  if (errors.startDate) setErrors({ ...errors, startDate: "" })
                }}
                disabled={isLoading}
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={errors.startDate ? "start-date-error" : undefined}
              />
              {errors.startDate && (
                <p id="start-date-error" className="text-xs font-medium text-destructive">
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value })
                  if (errors.endDate) setErrors({ ...errors, endDate: "" })
                }}
                disabled={isLoading}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={errors.endDate ? "end-date-error" : undefined}
              />
              {errors.endDate && (
                <p id="end-date-error" className="text-xs font-medium text-destructive">
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              initialData ? "Update Trip" : "Create Trip"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({ tripId, tripTitle, onConfirm, isLoading }) {
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    await onConfirm(tripId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete trip"
          disabled={isLoading}
        >
          <Trash2 className="size-4 text-destructive" aria-hidden />
          <span className="sr-only">Delete trip</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Trip</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{tripTitle}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TripCard({ trip, onEdit, onDelete, isDeleting, onViewDetails }) {
  const startDate = trip.startDate ? new Date(trip.startDate) : null
  const endDate = trip.endDate ? new Date(trip.endDate) : null

  const formatDate = (date) => {
    if (!date) return ""
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysUntilStart = () => {
    if (!startDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const diff = Math.floor((start - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getDaysDuration = () => {
    if (!startDate || !endDate) return null
    const diff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
    return diff + 1
  }

  const daysUntilStart = getDaysUntilStart()
  const daysDuration = getDaysDuration()

  const getStatusBadge = () => {
    if (!startDate) return null

    if (daysUntilStart < 0 && (!endDate || endDate < new Date())) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
          Completed
        </span>
      )
    }

    if (daysUntilStart < 0 && endDate && endDate >= new Date()) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
          In Progress
        </span>
      )
    }

    if (daysUntilStart === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden />
          Starting Today
        </span>
      )
    }

    if (daysUntilStart === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
          Tomorrow
        </span>
      )
    }

    if (daysUntilStart > 0 && daysUntilStart <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          <span className="size-1.5 rounded-full bg-blue-500" aria-hidden />
          Upcoming
        </span>
      )
    }

    return null
  }

  return (
    <Card
      size="sm"
      className="group flex cursor-pointer flex-col overflow-hidden border-white/15 bg-gradient-to-b from-white/10 to-white/5 shadow-xl backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-500/20"
      onClick={() => onViewDetails(trip._id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base text-white transition-colors group-hover:text-cyan-300">{trip.title}</CardTitle>
            {trip.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {trip.description}
              </CardDescription>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="space-y-2 text-sm text-slate-200">
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 flex-shrink-0" aria-hidden />
              <span>
                {startDate && formatDate(startDate)}
                {startDate && endDate && " – "}
                {endDate && formatDate(endDate)}
              </span>
              {daysDuration && (
                <span className="text-xs text-muted-foreground/70">
                  ({daysDuration} day{daysDuration !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}

          {trip.collaborators && trip.collaborators.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 flex-shrink-0" aria-hidden />
              <span>{trip.collaborators.length} collaborator{trip.collaborators.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          {trip.budget && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="size-4 flex-shrink-0" aria-hidden />
              <span>
                ${trip.budget.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {trip.destination && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 flex-shrink-0" aria-hidden />
              <span>{trip.destination}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-white/10 pt-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-full items-center gap-2">
          <TripFormDialog
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                title="Edit trip"
                disabled={isDeleting}
              >
                <Edit2 className="size-4" aria-hidden />
                <span className="sr-only">Edit trip</span>
              </Button>
            }
            initialData={{
              title: trip.title,
              description: trip.description || "",
              startDate: trip.startDate ? trip.startDate.split("T")[0] : "",
              endDate: trip.endDate ? trip.endDate.split("T")[0] : "",
            }}
            onSave={async (formData) => {
              await onEdit(trip._id, formData)
            }}
            isLoading={isDeleting}
          />
          <DeleteConfirmDialog
            tripId={trip._id}
            tripTitle={trip.title}
            onConfirm={onDelete}
            isLoading={isDeleting}
          />
        </div>
      </CardFooter>
    </Card>
  )
}

export default function Trips() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchTrips = useCallback(async () => {
    try {
      setError("")
      const res = await api.get("/trips")
      const tripsData = res.data?.trips || res.data?.data || res.data || []
      setTrips(Array.isArray(tripsData) ? tripsData : [])
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const handleCreateTrip = async (formData) => {
    try {
      setSavingId("creating")
      const res = await api.post("/trips", {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
      })

      const newTrip = res.data?.trip || res.data?.data || res.data
      if (newTrip) {
        setTrips([newTrip, ...trips])
        setError("")
        toast.success("Trip created.")
      }
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSavingId(null)
    }
  }

  const handleEditTrip = async (tripId, formData) => {
    try {
      setSavingId(tripId)
      const res = await api.patch(`/trips/${tripId}`, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
      })

      const updatedTrip = res.data?.trip || res.data?.data || res.data
      if (updatedTrip) {
        setTrips(trips.map((t) => (t._id === tripId ? updatedTrip : t)))
        setError("")
        toast.success("Trip updated.")
      }
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteTrip = async (tripId) => {
    try {
      setDeletingId(tripId)
      await api.delete(`/trips/${tripId}`)
      setTrips(trips.filter((t) => t._id !== tripId))
      setError("")
      toast.success("Trip deleted.")
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewDetails = (tripId) => {
    navigate(`/trips/${tripId}`)
  }

  const filteredTrips = trips.filter((trip) => {
    const q = query.trim().toLowerCase()
    const inSearch =
      !q ||
      trip.title?.toLowerCase().includes(q) ||
      trip.description?.toLowerCase().includes(q) ||
      trip.destination?.toLowerCase().includes(q)
    if (!inSearch) return false
    if (statusFilter === "all") return true

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = trip.startDate ? new Date(trip.startDate) : null
    const end = trip.endDate ? new Date(trip.endDate) : null
    if (start) start.setHours(0, 0, 0, 0)
    if (end) end.setHours(0, 0, 0, 0)

    if (statusFilter === "upcoming") return Boolean(start && start > today)
    if (statusFilter === "ongoing") return Boolean(start && end && start <= today && end >= today)
    if (statusFilter === "completed") return Boolean(end && end < today)
    return true
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="glass-card flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Trips Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and organize all your travel plans
          </p>
        </div>

        <TripFormDialog
          trigger={
            <Button className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
              <Plus className="size-4" aria-hidden />
              New Trip
            </Button>
          }
          initialData={null}
          onSave={handleCreateTrip}
          isLoading={savingId === "creating"}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trips by title, description, destination..."
          className="rounded-xl border-white/15 bg-white/10 text-white placeholder:text-slate-400"
        />
        <div className="flex flex-wrap gap-2">
          {["all", "upcoming", "ongoing", "completed"].map((status) => (
            <Button
              key={status}
              type="button"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              {...(statusFilter === status
                ? { className: "capitalize rounded-xl bg-white text-slate-900 hover:bg-slate-100" }
                : { className: "capitalize rounded-xl border-white/15 bg-white/5 text-slate-200 hover:bg-white/10" })}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} size="sm" className="h-56 animate-pulse border-border/60 bg-muted/30" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        /* Empty State */
        <Card size="sm" className="flex min-h-96 flex-col items-center justify-center">
          <MapPin className="size-12 text-muted-foreground/40 mb-4" aria-hidden />
          <h3 className="font-heading text-lg font-semibold">
            {trips.length === 0 ? "No trips yet" : "No matching trips"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs text-center">
            {trips.length === 0
              ? "Create your first trip to start planning your next adventure"
              : "Try changing search text or filters."}
          </p>
          {trips.length === 0 ? (
            <TripFormDialog
              trigger={
                <Button className="mt-6">
                  <Plus className="size-4" aria-hidden />
                  Create First Trip
                </Button>
              }
              initialData={null}
              onSave={handleCreateTrip}
              isLoading={savingId === "creating"}
            />
          ) : (
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setQuery("")
                setStatusFilter("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        /* Trips Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => (
            <TripCard
              onViewDetails={handleViewDetails}
              key={trip._id}
              trip={trip}
              onEdit={handleEditTrip}
              onDelete={handleDeleteTrip}
              isDeleting={deletingId === trip._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
