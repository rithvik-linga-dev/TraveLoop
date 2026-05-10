import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { MainLayout } from "@/components/layout/MainLayout"
import { AppPage } from "@/pages/AppPage"
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage"
import Trips from "@/pages/Trips"
import TripDetails from "@/pages/TripDetails"
import NotificationsPage from "@/pages/NotificationsPage"
import SettingsPage from "@/pages/SettingsPage"
import ProfilePage from "@/pages/ProfilePage"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<AppPage />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/:id" element={<TripDetails />} />
            <Route path="/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/itinerary" element={<Navigate to="/trips" replace />} />
            <Route path="/activities" element={<Navigate to="/trips" replace />} />
            <Route path="/budget" element={<Navigate to="/trips" replace />} />
            <Route path="/packing" element={<Navigate to="/trips" replace />} />
            <Route path="/notes" element={<Navigate to="/trips" replace />} />
            <Route path="/collaborators" element={<Navigate to="/trips" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
