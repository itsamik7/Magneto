import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User as UserIcon, AlertCircle, Menu, X, ArrowRight } from 'lucide-react'

interface NavbarProps {
  onOpenSetupModal?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSetupModal }) => {
  const { user, displayName, signOut, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-[#F2EFE8]/95 backdrop-blur-md border-b border-[#E2DCCE]">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo with Globe Icon & Cursive Tagline Matching Screenshot */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-[2]">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
            </svg>
          </div>
          <div>
            <span className="font-heading font-black text-xl tracking-tight text-[#1E293B]">
              Magneto
            </span>
            <span className="block text-[10px] text-[#059669] italic font-semibold -mt-1 font-serif">
              Collect. Save. Explore.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-bold text-slate-700 hover:text-[#059669] transition-colors"
              >
                My Travel Fridge
              </Link>

              <Link
                to="/catalog"
                className="text-sm font-bold text-slate-700 hover:text-[#059669] transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Magnet Catalog</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
                  100
                </span>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l border-[#E2DCCE]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-heading font-bold text-xs">
                    <UserIcon className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log Out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-bold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Build My Travel Fridge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:bg-slate-200/60 rounded-lg"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2DCCE] bg-[#F2EFE8] px-4 py-4 space-y-3">
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
                My Travel Fridge
              </Link>
              <Link
                to="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-[#059669] py-1.5"
              >
                ✨ Magnet Catalog (100 Destinations)
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
                className="block text-sm font-bold text-slate-800 py-2"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 bg-[#059669] text-white font-bold rounded-xl text-sm"
              >
                Build My Travel Fridge
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
