import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User as UserIcon, AlertCircle, Sparkles, Menu, X } from 'lucide-react'

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
    <header className="sticky top-0 z-40 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#E5E2DC]">
      {/* Top Banner if Supabase is not configured */}
      {!isConfigured && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Supabase backend is not connected yet. Real authentication & database persistence require your Supabase URL & anon key.</span>
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
        {/* Brand Logo */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#243447] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-slate-700">
            {/* Logo Silhouette */}
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <rect x="4" y="2" width="16" height="20" rx="3" stroke="#F7F5F0" strokeWidth="2" />
              <line x1="4" y1="9" x2="20" y2="9" stroke="#3A8D8C" strokeWidth="1.5" />
              <circle cx="14" cy="15" r="3" fill="#E98267" stroke="#FFFFFF" strokeWidth="1" />
              <line x1="7" y1="4" x2="7" y2="7" stroke="#E5E2DC" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="7" y1="11" x2="7" y2="16" stroke="#E5E2DC" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#243447] flex items-center gap-1.5">
              Magneto
              <span className="w-1.5 h-1.5 rounded-full bg-[#E98267]" />
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 -mt-1">
              Travel Fridge
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-slate-700 hover:text-[#243447] transition-colors flex items-center gap-1.5"
              >
                <span>My Fridge</span>
              </Link>

              {onOpenSetupModal && !isConfigured && (
                <button
                  onClick={onOpenSetupModal}
                  className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Configure DB</span>
                </button>
              )}

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-600/10 border border-teal-500/30 text-teal-800 flex items-center justify-center font-heading font-bold text-xs">
                    <UserIcon className="w-4 h-4 text-teal-700" />
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
            <div className="flex items-center gap-4">
              {onOpenSetupModal && (
                <button
                  onClick={onOpenSetupModal}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-300 hover:border-slate-400 transition-colors"
                >
                  Supabase Setup
                </button>
              )}
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-[#243447] px-3 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E98267] hover:bg-[#d96d51] text-white text-sm font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build My Travel Fridge</span>
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
        <div className="md:hidden border-t border-[#E5E2DC] bg-[#F7F5F0] px-4 py-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-teal-600/10 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{displayName || user.email}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-800 py-1.5"
              >
                My Fridge
              </Link>
              {onOpenSetupModal && !isConfigured && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenSetupModal()
                  }}
                  className="w-full text-left text-xs font-semibold text-amber-800 bg-amber-100 py-2 px-3 rounded-lg"
                >
                  Configure Supabase
                </button>
              )}
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
                className="block text-sm font-semibold text-slate-800 py-2"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 bg-[#E98267] text-white font-bold rounded-xl text-sm"
              >
                Build My Travel Fridge
              </Link>
              {onOpenSetupModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenSetupModal()
                  }}
                  className="w-full text-center text-xs font-medium text-slate-600 py-2 border border-slate-300 rounded-xl"
                >
                  Supabase Setup Guide
                </button>
              )}
            </>
          )}
        </div>
      )}
    </header>
  )
}
