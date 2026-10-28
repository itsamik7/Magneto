import React, { useState, useEffect, useMemo } from 'react'
import type { DateRangeFilter, PlatformSettings, AuditLog } from '../../types/admin'
import {
  getSuperAdminOverviewStats,
  getPlatformSettings,
  toggleGlobalAdvertising,
  getAuditLogs,
  PLATFORM_SETTINGS_UPDATED_EVENT,
  AUDIT_LOG_ADDED_EVENT,
} from '../../services/adminService'
import type { AdvertisingCampaign, MerchantProfile } from '../../types/advertising'
import { getAllCampaigns, getAllMerchants, ADVERTISING_UPDATED_EVENT } from '../../services/advertisingService'
import {
  Users,
  Store,
  Layers,
  CreditCard,
  Eye,
  MousePointer,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Activity,
  FileText,
  RotateCcw,
  Compass,
} from 'lucide-react'

interface SuperAdminOverviewProps {
  onNavigateTab: (tabId: string) => void
  currentAdminEmail: string
  currentAdminRole: string
}

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({
  onNavigateTab,
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [stats, setStats] = useState<any>(null)
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [merchants, setMerchants] = useState<MerchantProfile[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Date Filter
  const [dateFilter, setDateFilter] = useState<'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom'>('last_30_days')

  // Platform Ad Kill Switch Confirmation Modal
  const [isConfirmingGlobalPause, setIsConfirmingGlobalPause] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [isTogglingGlobalAd, setIsTogglingGlobalAd] = useState(false)

  const loadAll = async () => {
    try {
      const [st, sett, campList, merchList, logs] = await Promise.all([
        getSuperAdminOverviewStats({ preset: dateFilter }),
        getPlatformSettings(),
        getAllCampaigns(),
        getAllMerchants(),
        getAuditLogs(),
      ])
      setStats(st)
      setSettings(sett)
      setCampaigns(campList)
      setMerchants(merchList)
      setRecentLogs(logs.slice(0, 6))
    } catch (e) {
      console.error('Error loading overview data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const handleSettingsUpdate = () => loadAll()
    const handleAdUpdate = () => loadAll()
    const handleLogAdded = () => loadAll()

    window.addEventListener(PLATFORM_SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleAdUpdate)
    window.addEventListener(AUDIT_LOG_ADDED_EVENT, handleLogAdded)

    return () => {
      window.removeEventListener(PLATFORM_SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
      window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleAdUpdate)
      window.removeEventListener(AUDIT_LOG_ADDED_EVENT, handleLogAdded)
    }
  }, [dateFilter])

  // Execute Platform Master Kill Switch
  const handleToggleGlobalAds = async (targetEnabled: boolean) => {
    setIsTogglingGlobalAd(true)
    try {
      await toggleGlobalAdvertising(
        targetEnabled,
        { email: currentAdminEmail, role: currentAdminRole },
        pauseReason.trim() || undefined
      )
      setIsConfirmingGlobalPause(false)
      setPauseReason('')
      await loadAll()
    } catch (err: any) {
      alert(`Error toggling global ads: ${err.message}`)
    } finally {
      setIsTogglingGlobalAd(false)
    }
  }

  // Active top campaigns
  const topCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => c.status === 'active')
      .slice(0, 5)
  }, [campaigns])

  if (isLoading || !stats) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
        <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Aggregating Platform Metrics & Database Statistics...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 
        ========================================================================
        1. MASTER SYSTEM STATUS & GLOBAL ADVERTISING CONTROL BAR
        ========================================================================
      */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          settings?.globalAdvertisingEnabled
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700 shadow-lg'
            : 'bg-rose-50 border-rose-200 text-rose-950 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                settings?.globalAdvertisingEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-rose-100 text-rose-600 border border-rose-300'
              }`}
            >
              {settings?.globalAdvertisingEnabled ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                    settings?.globalAdvertisingEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-rose-200 text-rose-900 border border-rose-300'
                  }`}
                >
                  {settings?.globalAdvertisingEnabled
                    ? '● PLATFORM-WIDE ADS: ACTIVE'
                    : '■ PLATFORM-WIDE ADS: PAUSED (KILL SWITCH)'}
                </span>

                {settings?.platformMaintenanceMode && (
                  <span className="text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Maintenance Mode Active
                  </span>
                )}
              </div>

              <h2 className="font-heading font-black text-lg mt-1 tracking-tight">
                {settings?.globalAdvertisingEnabled
                  ? 'Platform Advertisements are Live across All Placements'
                  : 'Platform Advertisements are Globally Disabled by Platform Owner'}
              </h2>
              <p
                className={`text-xs mt-0.5 leading-relaxed ${
                  settings?.globalAdvertisingEnabled ? 'text-slate-300' : 'text-rose-700'
                }`}
              >
                {settings?.globalAdvertisingEnabled
                  ? 'All approved merchant magnet campaigns are serving normally on the virtual fridge door surface.'
                  : 'Advertisements are currently suppressed across the entire user-facing website. Master kill switch enforced at service layer.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto flex-shrink-0">
            {settings?.globalAdvertisingEnabled ? (
              <button
                type="button"
                onClick={() => setIsConfirmingGlobalPause(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Pause All Advertisements</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleGlobalAds(true)}
                disabled={isTogglingGlobalAd}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Resume All Advertisements</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                settings?.globalAdvertisingEnabled
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-rose-300 text-rose-800 hover:bg-rose-100'
              }`}
            >
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        2. DATE RANGE PRESET SELECTOR & QUICK BAR
        ========================================================================
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Metrics Time Horizon:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['today', 'last_7_days', 'last_30_days', 'this_month'] as const).map((preset) => {
              const labels: Record<string, string> = {
                today: 'Today',
                last_7_days: 'Last 7 Days',
                last_30_days: 'Last 30 Days',
                this_month: 'This Month',
              }
              const isSelected = dateFilter === preset
              return (
                <button
                  key={preset}
                  onClick={() => setDateFilter(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {labels[preset]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('moderation')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Moderation Queue ({stats.pendingApprovalAds + stats.pendingMerchants})</span>
          </button>
          <button
            onClick={loadAll}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        3. REAL DATABASE METRICS GRID
        ========================================================================
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Registered Travelers
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-slate-900 mt-2">
            {stats.totalUsers}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{stats.activeUsers} active accounts</span>
            <span className="text-blue-600 font-bold group-hover:underline">Manage →</span>
          </div>
        </div>

        {/* Metric 2: Merchants */}
        <div
          onClick={() => onNavigateTab('merchants')}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Merchants & Advertisers
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-indigo-600 mt-2">
            {stats.totalMerchants}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{stats.verifiedMerchants} verified • {stats.pendingMerchants} pending</span>
            <span className="text-indigo-600 font-bold group-hover:underline">Directory →</span>
          </div>
        </div>

        {/* Metric 3: Active Campaigns */}
        <div
          onClick={() => onNavigateTab('advertisements')}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Magnet Ads
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-emerald-600 mt-2">
            {stats.activeAds}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{stats.pausedAds} paused • {stats.pendingApprovalAds} awaiting review</span>
            <span className="text-emerald-600 font-bold group-hover:underline">Review →</span>
          </div>
        </div>

        {/* Metric 4: Platform Revenue */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Magnet Plans Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-slate-900 mt-2">
            ₹ {(stats.netRevenueMinor / 100).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>Gross: ₹ {(stats.grossSalesMinor / 100).toLocaleString('en-IN')}</span>
            <span className="text-amber-600 font-bold group-hover:underline">Ledger →</span>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        4. ENGAGEMENT & DELIVERY STRIP
        ========================================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ad Impressions Delivered
            </span>
            <span className="font-heading font-black text-xl text-slate-900">
              {stats.totalImpressions.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <MousePointer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Ad Clicks Generated
            </span>
            <span className="font-heading font-black text-xl text-slate-900">
              {stats.totalClicks.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Platform-Wide CTR
            </span>
            <span className="font-heading font-black text-xl text-purple-700">
              {stats.platformCtr}%
            </span>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        5. TWO-COLUMN OPERATIONAL DASHBOARD
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Live Campaigns and Top Merchants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Performing Advertisements */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Top Active Magnet Advertisements
                </h3>
                <p className="text-xs text-slate-500">
                  Currently displayed on the virtual fridge door surface.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('advertisements')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                All Magnet Ads →
              </button>
            </div>

            {topCampaigns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No active advertisements currently published.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topCampaigns.map((camp) => (
                  <div key={camp.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        <img src={camp.creativeUrl} alt={camp.name} className="h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-black text-xs text-slate-900 truncate block">
                          {camp.name}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {camp.brandName} • {camp.placementId.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                      <a
                        href={camp.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        title="Visit destination URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Operations Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('merchants')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Store className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="font-heading font-bold text-xs text-slate-900">
                Inspect Merchant Dashboard
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Start audited support-view session
              </p>
            </button>

            <button
              onClick={() => onNavigateTab('subscriptions')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all hover:scale-[1.01] cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="font-heading font-bold text-xs text-slate-900">
                Configure Pricing Plans
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Update commercial rates & quotas
              </p>
            </button>

            <button
              onClick={() => onNavigateTab('placements')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Compass className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="font-heading font-bold text-xs text-slate-900">
                Fridge Door Slots
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Manage door slots, coordinates & exclusivity
              </p>
            </button>
          </div>
        </div>

        {/* Right Column: Recent Audit Log Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-slate-900">
                Administrative Audit Trail
              </h3>
              <button
                onClick={() => onNavigateTab('audit_logs')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Full Logs →
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Chronological log of platform-level events.
            </p>

            <div className="mt-4 space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px] truncate">
                    {log.entityType.toUpperCase()}: {log.entityId || 'Platform'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    By {log.actorEmail} ({log.actorRole})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Append-only secure ledger</span>
            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="text-blue-600 font-bold hover:underline"
            >
              Search Activity
            </button>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        CONFIRMATION MODAL: PLATFORM MASTER AD KILL SWITCH
        ========================================================================
      */}
      {isConfirmingGlobalPause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-lg text-slate-900">
                Confirm Platform-Wide Advertisement Pause
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This is a high-impact operation. Pausing advertisements platform-wide will immediately stop all active campaigns from appearing across the entire user-facing website.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl text-[11px] text-rose-800 border border-rose-200/80">
              <strong>Audit Notice:</strong> This action will record your administrator identity (
              <strong>{currentAdminEmail}</strong>), timestamp, and rationale in the permanent audit log.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operational Rationale / Reason *
              </label>
              <textarea
                rows={2}
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Scheduled holiday campaign reset, critical policy audit, or merchant maintenance..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingGlobalPause(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleGlobalAds(false)}
                disabled={isTogglingGlobalAd}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Confirm Global Pause</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
