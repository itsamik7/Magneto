import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/ui/Navbar'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Route-specific Document Title Controller
function PageTitleTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    if (path === '/') {
      document.title = 'Magnetos — Your Virtual Travel Fridge'
    } else if (path === '/dashboard' || path === '/my-fridge') {
      document.title = 'My Fridge | Magnetos'
    } else if (path === '/plan-trip' || path === '/catalog' || path === '/add-magnet') {
      document.title = 'Plan a Trip | Magnetos'
    } else if (path.startsWith('/trip/')) {
      document.title = 'Trip Details | Magnetos'
    } else if (path === '/login') {
      document.title = 'Log In | Magnetos'
    } else if (path === '/signup') {
      document.title = 'Sign Up | Magnetos'
    } else if (path.startsWith('/merchant')) {
      document.title = 'Merchant Portal | Magnetos'
    } else if (path === '/admin') {
      document.title = 'Admin Portal | Magnetos'
    } else {
      document.title = 'Magnetos — Your Virtual Travel Fridge'
    }
  }, [location.pathname])

  return null
}

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { MyFridgePage } from './pages/MyFridgePage'
import { PlanTripPage } from './pages/PlanTripPage'
import { TripDetailPage } from './pages/TripDetailPage'
import { AdminPage } from './pages/AdminPage'
import { MerchantDashboardPage } from './pages/MerchantDashboardPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { MerchantProtectedRoute } from './components/layout/MerchantProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTitleTracker />
        <div className="min-h-screen flex flex-col bg-white text-[#1E293B]">
          {/* Top Navbar */}
          <Navbar />

          {/* Main App Content Area */}
          <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24 sm:pb-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Dedicated Unlisted Admin Route */}
              <Route path="/admin" element={<AdminPage />} />

              {/* Dedicated Merchant Portal Route */}
              <Route element={<MerchantProtectedRoute />}>
                <Route path="/merchant" element={<Navigate to="/merchant/dashboard" replace />} />
                <Route path="/merchant/dashboard" element={<MerchantDashboardPage />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<MyFridgePage />} />
                <Route path="/my-fridge" element={<MyFridgePage />} />
                <Route path="/plan-trip" element={<PlanTripPage />} />
                <Route path="/catalog" element={<PlanTripPage />} />
                <Route path="/add-magnet" element={<PlanTripPage />} />
                <Route path="/trip/:id" element={<TripDetailPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-[#243447]">Magnetos</span>
                <span>• Turn your travel dreams into destinations.</span>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
