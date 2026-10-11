// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './i18n/LanguageContext'

import Navbar from './components/Navbar'

import Home from './pages/Home'
import FarmerHome from './pages/FarmerHome'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

function LoadingScreen() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-forest-600 border-t-transparent animate-spin" />
        <p className="text-forest-400 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/home" replace />
  }

  return children
}

function PublicLanding() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/home" replace />
  }

  return <Home />
}

export default function App() {
  return (
    <div className="relative min-h-screen bg-forest-950">
      <Navbar />

      <Routes>
        <Route path="/" element={<PublicLanding />} />

        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <FarmerHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
