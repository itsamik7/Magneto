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
import { DashboardPage } from './pages/DashboardPage'
import { TripDetailPage } from './pages/TripDetailPage'

export default function App() {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#202833]">
          {/* Top Navbar */}
          <Navbar onOpenSetupModal={() => setIsSetupModalOpen(true)} />

          {/* Main App Content Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/trip/:id" element={<TripDetailPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#E5E2DC] bg-[#F7F5F0] py-8 text-xs text-slate-500">
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
                <span>v1.0.0 Minimal Working Prototype</span>
              </div>
            </div>
          </footer>

          {/* Global Supabase Setup Modal */}
          <SupabaseSetupModal
            isOpen={isSetupModalOpen}
            onClose={() => setIsSetupModalOpen(false)}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
