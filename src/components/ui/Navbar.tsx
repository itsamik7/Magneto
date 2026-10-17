import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User as UserIcon, AlertCircle, Menu, X, Calendar } from 'lucide-react'

interface NavbarProps {
  onOpenSetupModal?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSetupModal }) => {
  const { user, displayName, signOut, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const isFridgeActive = location.pathname === '/dashboard' || location.pathname === '/my-fridge'
  const isPlanActive = location.pathname === '/plan-trip' || location.pathname === '/catalog' || location.pathname === '/add-magnet'

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner if Supabase is not configured */}
      {!isConfigured && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Supabase backend is not connected yet. Add your URL and publishable key to .env.</span>
            {onOpenSetupModal && (
              <button
                onClick={onOpenSetupModal}
                className="underline ml-2 font-bold hover:text-slate-900 cursor-pointer"
              >
                Setup Guide
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 relative">
        {/* Brand Logo with Horseshoe Magnet Icon & Tagline */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
            {/* Real Horseshoe Magnet Icon (Blue & Red Poles) */}
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              <path
                d="M8 12 C8 6.5 12.5 2 18 2 C23.5 2 28 6.5 28 12 L28 22 C28 23 27 24 26 24 L22 24 C21 24 20 23 20 22 L20 12 C20 10.9 19.1 10 18 10 C16.9 10 16 10.9 16 12 L16 22 C16 23 15 24 14 24 L10 24 C9 24 8 23 8 22 Z"
                fill="#2563EB"
              />
              <path
                d="M20 12 C20 10.9 19.1 10 18 10 C18 10 18 10 18 10 L18 2 C23.5 2 28 6.5 28 12 L28 22 C28 23 27 24 26 24 L22 24 C21 24 20 23 20 22 Z"
                fill="#EF4444"
              />
              <rect x="8" y="20" width="6" height="5" rx="1" fill="#93C5FD" />
              <rect x="22" y="20" width="6" height="5" rx="1" fill="#FCA5A5" />
            </svg>
          </div>
          <div>
            <span className="font-heading font-black text-xl tracking-tight text-[#1E293B]">
              Magnetos
            </span>
            <span className="hidden sm:block text-[10px] text-slate-500 font-semibold -mt-1">
              Collect Memories. Stick Forever.
            </span>
          </div>
        </Link>

        {/* Center Navigation: My Fridge & Plan a Trip Pills (Only visible when user is logged in) */}
        {user && (
          <nav className="hidden sm:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                isFridgeActive
                  ? 'bg-[#EBF2FE] text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {/* Refrigerator Icon */}
              <svg className={`w-4 h-4 ${isFridgeActive ? 'text-[#2563EB]' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="4" y="2" width="16" height="20" rx="3" strokeWidth="2" />
                <path strokeWidth="2" d="M4 10h16M8 6v2M8 14v4" />
              </svg>
              <span>My Fridge</span>
            </Link>

            <Link
              to="/plan-trip"
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                isPlanActive
                  ? 'bg-[#EBF2FE] text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {/* Calendar / Planner Icon */}
              <Calendar className={`w-4 h-4 ${isPlanActive ? 'text-[#2563EB]' : 'text-slate-500'}`} />
              <span>Plan a Trip</span>
            </Link>
          </nav>
        )}

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell (Only visible when user is logged in) */}
              <button 
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-heading font-bold text-xs shadow-xs ring-2 ring-white">
                {(displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`text-sm font-bold px-3 py-2 rounded-xl transition-colors ${
                  location.pathname === '/login'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className={`text-sm font-bold px-3 py-2 rounded-xl transition-colors ${
                  location.pathname === '/signup'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 text-slate-700 hover:bg-slate-200/60 rounded-lg"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{displayName || user.email}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-slate-800 py-1.5"
              >
                My Fridge
              </Link>
              <Link
                to="/plan-trip"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-blue-600 py-1.5"
              >
                Plan a Trip
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full text-left text-sm font-semibold text-rose-600 py-1.5 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-bold py-2 ${
                  location.pathname === '/login' ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                }`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-bold py-2 ${
                  location.pathname === '/signup' ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                }`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}

      {/* 
        MOBILE FLOATING BOTTOM NAV BAR (Phones < sm)
        Provides 1-thumb native-app switching between My Fridge & Plan a Trip
      */}
      {user && (
        <div className="sm:hidden fixed bottom-3 inset-x-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-1.5 flex items-center justify-around animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Link
            to="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              isFridgeActive
                ? 'bg-[#EBF2FE] text-[#2563EB] font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className={`w-4 h-4 ${isFridgeActive ? 'text-[#2563EB]' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="4" y="2" width="16" height="20" rx="3" strokeWidth="2" />
              <path strokeWidth="2" d="M4 10h16M8 6v2M8 14v4" />
            </svg>
            <span className="text-[10px] font-heading font-bold mt-0.5">My Fridge</span>
          </Link>

          <Link
            to="/plan-trip"
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              isPlanActive
                ? 'bg-[#EBF2FE] text-[#2563EB] font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className={`w-4 h-4 ${isPlanActive ? 'text-[#2563EB]' : 'text-slate-500'}`} />
            <span className="text-[10px] font-heading font-bold mt-0.5">Plan a Trip</span>
          </Link>
        </div>
      )}
    </header>
  )
}
