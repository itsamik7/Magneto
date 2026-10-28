import React from 'react'
import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Store, ShieldAlert, ArrowRight } from 'lucide-react'

import { getAdminSupportSession } from '../../services/adminService'

export const MerchantProtectedRoute: React.FC = () => {
  const { user, merchantProfile, userRole, isLoading } = useAuth()
  const supportSession = getAdminSupportSession()

  if (isLoading && !supportSession) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Store className="w-10 h-10 text-blue-600 animate-pulse" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
          Loading Merchant Portal...
        </p>
      </div>
    )
  }

  // If in audited Super Admin support view mode, grant immediate access!
  if (supportSession) {
    return <Outlet />
  }

  // Not signed in -> redirect to login with merchant query parameter
  if (!user) {
    return <Navigate to="/login?type=merchant" replace />
  }

  // User is signed in, but neither a merchant nor an admin
  if (userRole === 'normal' && !merchantProfile) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Store className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              Merchant Account Required
            </span>
            <h1 className="font-heading font-black text-2xl text-slate-900">
              Merchant Portal Access
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              You are currently signed in with a Personal Travel Account (<strong>{user.email}</strong>).
              To access advertising campaigns, 3D fridge placements, and live preview controls, please activate your Merchant Account.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup?type=merchant"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <span>Register Merchant Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs"
            >
              Back to Personal Fridge
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
