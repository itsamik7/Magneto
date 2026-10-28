import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { AdminRole } from '../types/admin'
import { ADMIN_ROLE_PERMISSIONS } from '../types/admin'
import {
  verifyUserAdminRole,
  adminSignIn,
  adminSignInWithGoogle,
  adminSignOut,
  getAdminSetupInstructions,
  getPlatformSettings,
  getSuperAdminOverviewStats,
  PLATFORM_SETTINGS_UPDATED_EVENT,
} from '../services/adminService'
import { SuperAdminOverview } from '../components/admin/SuperAdminOverview'
import { AdminUserManagement } from '../components/admin/AdminUserManagement'
import { AdminMerchantManagement } from '../components/admin/AdminMerchantManagement'
import { AdminCampaignsManagement } from '../components/admin/AdminCampaignsManagement'
import { AdminPlacementManagement } from '../components/admin/AdminPlacementManagement'
import { AdminSubscriptionManagement } from '../components/admin/AdminSubscriptionManagement'
import { AdminBillingManagement } from '../components/admin/AdminBillingManagement'
import { AdminAnalyticsReporting } from '../components/admin/AdminAnalyticsReporting'
import { AdminSupportModeration } from '../components/admin/AdminSupportModeration'
import { AdminRolesManagement } from '../components/admin/AdminRolesManagement'
import { AdminAuditLogs } from '../components/admin/AdminAuditLogs'
import { AdminSystemSettings } from '../components/admin/AdminSystemSettings'
import { AdminFridgeInventory } from '../components/admin/AdminFridgeInventory'

import {
  LayoutDashboard,
  Users,
  Store,
  Layers,
  Box,
  Tags,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Settings,
  Compass,
  LogOut,
  HelpCircle,
  Copy,
  Check,
  X,
  Search,
  Bell,
  ExternalLink,
  Power,
  Menu,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export const AdminPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Authorization state
  const [isAdminChecking, setIsAdminChecking] = useState<boolean>(true)
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false)
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null)
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Notification / Status pill state
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0)
  const [isGlobalAdsEnabled, setIsGlobalAdsEnabled] = useState<boolean>(true)

  // Admin login form state (for unauthenticated visitors)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Setup guide modal
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // 1. Verify Admin Role on Mount / Auth state changes
  useEffect(() => {
    let active = true
    setIsAdminChecking(true)

    verifyUserAdminRole(user).then((res) => {
      if (!active) return
      setIsAuthorizedAdmin(res.isAdmin)
      setAdminRole(res.role ?? null)
      setIsAdminChecking(false)
    })

    return () => {
      active = false
    }
  }, [user])

  // 2. Load overview notification signals
  useEffect(() => {
    if (isAuthorizedAdmin) {
      const loadSignals = async () => {
        try {
          const [settings, stats] = await Promise.all([
            getPlatformSettings(),
            getSuperAdminOverviewStats(),
          ])
          setIsGlobalAdsEnabled(settings.globalAdvertisingEnabled)
          const totalPending =
            (stats.pendingMerchants || 0) +
            (stats.pendingApprovalAds || 0) +
            (stats.openTickets || 0)
          setPendingReviewsCount(totalPending)
        } catch {
          // Fallback
        }
      }
      loadSignals()

      const handleSettingsUpdate = () => loadSignals()
      window.addEventListener(PLATFORM_SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
      return () => window.removeEventListener(PLATFORM_SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
    }
  }, [isAuthorizedAdmin])

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      const result = await adminSignIn(loginEmail, loginPassword)
      if (result.success && result.user) {
        const verifyRes = await verifyUserAdminRole(result.user)
        setIsAuthorizedAdmin(verifyRes.isAdmin)
        setAdminRole(verifyRes.role ?? null)
        if (!verifyRes.isAdmin) {
          setLoginError(
            verifyRes.error ||
              'Access denied: This user account does not possess administrator credentials in user_roles.'
          )
        }
      } else {
        setLoginError(result.error || 'Authentication failed. Please verify credentials.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in error'
      setLoginError(msg)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle Google Admin Login (OAuth)
  const handleGoogleAdminLogin = async () => {
    setLoginError(null)
    setIsLoggingIn(true)
    try {
      const res = await adminSignInWithGoogle()
      if (!res.success) {
        setLoginError(res.error || 'Google Sign-in failed. Please try again.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed'
      setLoginError(msg)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle Admin Sign Out
  const handleAdminSignOut = async () => {
    await adminSignOut()
    setIsAuthorizedAdmin(false)
    setAdminRole(null)
    navigate('/')
  }

  // Copy SQL Snippet helper
  const handleCopySql = () => {
    const guide = getAdminSetupInstructions()
    navigator.clipboard.writeText(guide.sqlSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // --------------------------------------------------------------------------
  // STATE A: Loading checking admin status
  // --------------------------------------------------------------------------
  if (isAdminChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse mb-4">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="font-heading font-black text-lg text-slate-800">
          Verifying Administrator Privileges
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Validating administrator role and security credentials...
        </p>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE B: Unauthenticated visitor -> Dedicated Admin Login Portal
  // --------------------------------------------------------------------------
  if (!user && !isAuthorizedAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
              Magnetos Control Centre
            </h1>
            <p className="text-xs text-slate-500">
              Sign in with administrative privileges to manage platform operations.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{loginError}</div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isLoggingIn}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
              or administrator email
            </span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="1amiteshk@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Role...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Control Centre</span>
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setIsSetupGuideOpen(true)}
                className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Admin Provisioning Guide</span>
              </button>
              <Link to="/" className="hover:text-slate-800 transition-colors">
                Return to Site
              </Link>
            </div>
          </form>

          {isSetupGuideOpen && renderSetupGuideModal()}
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE C: Authenticated User, but NON-ADMIN -> 403 Access Denied
  // --------------------------------------------------------------------------
  if (user && !isAuthorizedAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-rose-200 shadow-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              HTTP 403 Forbidden
            </span>
            <h1 className="font-heading font-black text-2xl text-slate-900">
              Administrator Access Denied
            </h1>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            You are signed in as <strong className="text-slate-800">{user.email}</strong>, but this
            account does not possess an assigned administrator role in the{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">public.user_roles</code> table.
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Security Precaution</span>
            </p>
            <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
              To grant this account administrative access, execute the authorization grant in your
              Supabase SQL Editor as documented in the setup guide.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>View Setup Instructions</span>
            </button>

            <button
              onClick={handleAdminSignOut}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs"
            >
              Sign Out
            </button>
          </div>
        </div>

        {isSetupGuideOpen && renderSetupGuideModal()}
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE D: Fully Authorized Administrator -> Full SaaS Super Admin Control Centre
  // --------------------------------------------------------------------------
  const currentEmail = user?.email || 'admin@magnetos.in'
  const currentRole = adminRole || 'super_admin'
  const roleLabel = ADMIN_ROLE_PERMISSIONS[currentRole]?.label || 'Super Administrator'

  const navigationSections = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users Management', icon: Users },
    { id: 'merchants', label: 'Merchants & Advertisers', icon: Store },
    { id: 'advertisements', label: 'Magnet Advertisements', icon: Layers },
    { id: 'placements', label: 'Fridge Door Slots', icon: Box },
    { id: 'subscriptions', label: 'Magnet Advertising Plans', icon: Tags },
    { id: 'billing', label: 'Payments & Financials', icon: CreditCard },
    { id: 'analytics', label: 'Analytics & Reporting', icon: TrendingUp },
    { id: 'moderation', label: 'Support & Moderation', icon: ShieldAlert, badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined },
    { id: 'roles', label: 'Admin Roles (RBAC)', icon: ShieldCheck },
    { id: 'audit_logs', label: 'Audit Log Ledger', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'inventory_fridge', label: 'Fridge Magnet Catalogue', icon: Compass },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-sm shadow-indigo-200">
              M
            </div>
            <div>
              <span className="font-heading font-black text-slate-900 text-sm tracking-tight block">
                Magnetos
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block -mt-1">
                Control Centre
              </span>
            </div>
          </Link>
        </div>

        {/* Global Status & Quick Controls */}
        <div className="flex items-center gap-3">
          {/* Master Kill Switch Indicator */}
          <div
            onClick={() => setActiveTab('settings')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
              isGlobalAdsEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 animate-pulse'
            }`}
            title="Click to view Master Advertising Settings"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Ads: {isGlobalAdsEnabled ? 'Online' : 'Paused Platform-Wide'}</span>
          </div>

          {/* Pending Reviews Notification Bell */}
          <button
            onClick={() => setActiveTab('moderation')}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title={`${pendingReviewsCount} pending approvals / moderation items`}
          >
            <Bell className="w-4 h-4" />
            {pendingReviewsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {/* Public Website Shortcut */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Preview Live Consumer Website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Site</span>
          </Link>

          {/* Admin Profile & Role Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {currentEmail.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-semibold text-slate-900 truncate max-w-[150px]">
                {currentEmail}
              </span>
              <span className="block text-[10px] font-medium text-indigo-600 -mt-0.5">
                {roleLabel}
              </span>
            </div>
            <button
              onClick={handleAdminSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex-1 overflow-y-auto space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations Hub
            </div>

            {navigationSections.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono">v2.4.0 Production</span>
              <button
                onClick={() => setIsSetupGuideOpen(true)}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Help
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* MAIN OPERATIONS WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {activeTab === 'overview' && (
            <SuperAdminOverview
              onNavigateTab={(tab) => setActiveTab(tab)}
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'users' && (
            <AdminUserManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'merchants' && (
            <AdminMerchantManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'advertisements' && (
            <AdminCampaignsManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'placements' && (
            <AdminPlacementManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'subscriptions' && (
            <AdminSubscriptionManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'billing' && (
            <AdminBillingManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsReporting
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'moderation' && (
            <AdminSupportModeration
              onNavigateTab={(tab) => setActiveTab(tab)}
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'roles' && (
            <AdminRolesManagement
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AdminAuditLogs
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSystemSettings
              currentAdminEmail={currentEmail}
              currentAdminRole={currentRole}
            />
          )}

          {activeTab === 'inventory_fridge' && <AdminFridgeInventory />}
        </main>
      </div>

      {/* SETUP GUIDE MODAL */}
      {isSetupGuideOpen && renderSetupGuideModal()}
    </div>
  )

  function renderSetupGuideModal() {
    const guide = getAdminSetupInstructions()
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-heading font-black text-base">{guide.title}</h3>
            </div>
            <button
              onClick={() => setIsSetupGuideOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
            <p className="leading-relaxed">{guide.description}</p>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Step-by-Step Instructions:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 leading-snug">
                {guide.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  PostgreSQL Grant Command:
                </span>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                {guide.sqlSnippet}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsSetupGuideOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
