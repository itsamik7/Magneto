import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/ui/Navbar'
import { SupabaseSetupModal } from './components/ui/SupabaseSetupModal'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { MyFridgePage } from './pages/MyFridgePage'
import { PlanTripPage } from './pages/PlanTripPage'
import { TripDetailPage } from './pages/TripDetailPage'

export default function App() {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white text-[#1E293B]">
          {/* Top Navbar */}
          <Navbar onOpenSetupModal={() => setIsSetupModalOpen(true)} />

          {/* Main App Content Area */}
          <main className="flex-1 max-w-[1720px] w-full mx-auto px-2 sm:px-6 py-4">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

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
                <span className="font-heading font-extrabold text-[#243447]">Magneto</span>
                <span>• Turn your travel dreams into destinations.</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="hover:text-slate-800 transition-colors"
                >
                  Supabase Setup
                </button>
                <span>v2.0.0 Global Souvenir Collection</span>
              </div>
            </div>
          </footer>

          {/* Supabase Migration & Credentials Setup Modal */}
          <SupabaseSetupModal
            isOpen={isSetupModalOpen}
            onClose={() => setIsSetupModalOpen(false)}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
