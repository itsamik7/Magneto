import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type {
  MerchantProfile,
  AdvertisingPlan,
  AdvertisingSlot,
  AdvertisingCreative,
  AdvertisingCampaign,
  MerchantSubscription,
  PaymentTransaction,
  MerchantMetrics,
  CampaignStatus,
} from '../types/advertising'
import {
  getMerchantProfile,
  getAdvertisingSlots,
  getAdvertisingPlans,
  getMerchantSubscriptions,
  getMerchantCreatives,
  getMerchantCampaigns,
  getMerchantPayments,
  getMerchantAnalytics,
  deleteCreativeAsset,
  addCreativeAsset,
  updateCampaign,
  adminSetCampaignStatus,
  populateSandboxMerchantData,
  getAllMerchants,
  ADVERTISING_UPDATED_EVENT,
} from '../services/advertisingService'
import {
  getAdminSupportSession,
  endAdminSupportSession,
  setSupportSessionMode,
  ADMIN_SUPPORT_SESSION_EVENT,
} from '../services/adminService'
import { MerchantCheckoutModal } from '../components/advertising/MerchantCheckoutModal'
import { CampaignCreationModal } from '../components/advertising/CampaignCreationModal'
import { MerchantLivePreview } from '../components/advertising/MerchantLivePreview'
import {
  LayoutDashboard,
  CreditCard,
  Layers,
  Image as ImageIcon,
  Eye,
  Receipt,
  BarChart3,
  Building2,
  Plus,
  Sparkles,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MousePointer,
  RefreshCw,
  Trash2,
  Edit,
  Clock,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  X,
  Lock,
} from 'lucide-react'

type DashboardTab =
  | 'overview'
  | 'plans'
  | 'campaigns'
  | 'creatives'
  | 'preview'
  | 'billing'
  | 'analytics'
  | 'profile'

export const MerchantDashboardPage: React.FC = () => {
  const { user, merchantProfile: authProfile, refreshMerchantProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [profile, setProfile] = useState<MerchantProfile | null>(authProfile)
  const [supportSession, setSupportSession] = useState(getAdminSupportSession())

  // Data states
  const [plans, setPlans] = useState<AdvertisingPlan[]>([])
  const [slots, setSlots] = useState<AdvertisingSlot[]>([])
  const [subscriptions, setSubscriptions] = useState<MerchantSubscription[]>([])
  const [creatives, setCreatives] = useState<AdvertisingCreative[]>([])
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [metrics, setMetrics] = useState<MerchantMetrics>({
    activeCampaigns: 0,
    totalPlacements: 0,
    subscriptionStatus: 'None',
    totalSpendMinor: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    productInteractions: 0,
  })

  // Modals & Selection
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<AdvertisingPlan | null>(null)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [initialPlanForCampaign, setInitialPlanForCampaign] = useState<string | undefined>(undefined)
  const [selectedPreviewCampaignId, setSelectedPreviewCampaignId] = useState<string>('')

  // Campaigns Filter
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('all')

  // Creative upload form
  const [isUploadingCreative, setIsUploadingCreative] = useState(false)
  const [newCreativeName, setNewCreativeName] = useState('')
  const [newCreativeUrl, setNewCreativeUrl] = useState('')

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Initialize or fetch merchant profile
  useEffect(() => {
    const init = async () => {
      // 1. If in admin support view mode, load target merchant
      const session = getAdminSupportSession()
      setSupportSession(session)
      if (session) {
        const allMerchants = await getAllMerchants()
        const target = allMerchants.find((m) => m.id === session.merchantId)
        if (target) {
          setProfile(target)
          return
        }
      }

      // 2. Otherwise load authenticated merchant
      if (!user) return
      let p = await getMerchantProfile(user.id)
      if (!p) {
        p = populateSandboxMerchantData(user.id)
        await refreshMerchantProfile()
      }
      setProfile(p)
    }
    init()

    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ session: any }>
      setSupportSession(customEvent.detail?.session ?? getAdminSupportSession())
    }
    window.addEventListener(ADMIN_SUPPORT_SESSION_EVENT, handleSessionChange)
    return () => window.removeEventListener(ADMIN_SUPPORT_SESSION_EVENT, handleSessionChange)
  }, [user, refreshMerchantProfile])

  // Load all merchant data
  const loadData = useCallback(async () => {
    if (!profile) return
    const [pList, sList, subList, cList, campList, payList, mData] = await Promise.all([
      getAdvertisingPlans('fridge_magnet'),
      getAdvertisingSlots('fridge_magnet'),
      getMerchantSubscriptions(profile.id),
      getMerchantCreatives(profile.id, 'fridge_magnet'),
      getMerchantCampaigns(profile.id),
      getMerchantPayments(profile.id),
      getMerchantAnalytics(profile.id),
    ])

    setPlans(pList)
    setSlots(sList)
    setSubscriptions(subList)
    setCreatives(cList)
    setCampaigns(campList)
    setPayments(payList)
    setMetrics(mData)

    if (campList.length > 0 && !selectedPreviewCampaignId) {
      setSelectedPreviewCampaignId(campList[0].id)
    }
  }, [profile, selectedPreviewCampaignId])

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
  }, [loadData])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Active Subscription
  const activeSubscription = useMemo(() => {
    return subscriptions.find((s) => s.status === 'active') || null
  }, [subscriptions])

  // Counts for overview
  const activeCampaignsCount = useMemo(() => {
    return campaigns.filter((c) => c.status === 'active').length
  }, [campaigns])

  const pendingApprovalCount = useMemo(() => {
    return campaigns.filter((c) => c.status === 'pending_approval' || c.status === 'pending_payment').length
  }, [campaigns])

  const rejectedCampaigns = useMemo(() => {
    return campaigns.filter((c) => c.status === 'rejected')
  }, [campaigns])

  const draftCampaignsCount = useMemo(() => {
    return campaigns.filter((c) => c.status === 'draft').length
  }, [campaigns])

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (campaignStatusFilter === 'all') return campaigns
    return campaigns.filter((c) => c.status === campaignStatusFilter)
  }, [campaigns, campaignStatusFilter])

  // Handle plan purchase open
  const handleOpenCheckout = (plan: AdvertisingPlan) => {
    if (supportSession?.mode === 'read_only') {
      setToastMsg({
        type: 'error',
        text: 'Action restricted: You are inspecting this dashboard in Read-Only Mode. Switch to Authorized Edit mode at the top to make purchases.',
      })
      return
    }
    setSelectedCheckoutPlan(plan)
    setIsCheckoutOpen(true)
  }

  // Handle campaign pause/resume
  const handleToggleCampaignStatus = async (campaign: AdvertisingCampaign) => {
    if (supportSession?.mode === 'read_only') {
      setToastMsg({
        type: 'error',
        text: 'Action restricted: You are inspecting this dashboard in Read-Only Mode.',
      })
      return
    }

    try {
      const nextStatus = campaign.status === 'active' ? 'paused' : 'active'
      await adminSetCampaignStatus(campaign.id, nextStatus)
      await loadData()
      setToastMsg({
        type: 'success',
        text: `Magnet campaign is now ${nextStatus}.`,
      })
    } catch {
      setToastMsg({ type: 'error', text: 'Failed to update campaign status.' })
    }
  }

  // Handle creative upload
  const handleCreateCreative = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!newCreativeUrl.trim()) return

    try {
      await addCreativeAsset({
        merchantId: profile.id,
        name: newCreativeName.trim() || 'Magnet Artwork Asset',
        creativeType: 'image',
        placementCategory: 'fridge_magnet',
        fileUrl: newCreativeUrl.trim(),
        fileSizeBytes: 1024 * 512,
        mimeType: 'image/png',
      })

      setNewCreativeName('')
      setNewCreativeUrl('')
      setIsUploadingCreative(false)
      await loadData()
      setToastMsg({ type: 'success', text: 'Magnet artwork saved to your library.' })
    } catch {
      setToastMsg({ type: 'error', text: 'Failed to save artwork asset.' })
    }
  }

  const handleDeleteCreative = async (id: string) => {
    if (!profile) return
    try {
      await deleteCreativeAsset(id, profile.id)
      await loadData()
      setToastMsg({ type: 'success', text: 'Asset removed from library.' })
    } catch {
      setToastMsg({ type: 'error', text: 'Failed to delete asset.' })
    }
  }

  const previewCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedPreviewCampaignId) || campaigns[0] || null
  }, [campaigns, selectedPreviewCampaignId])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* 
        ========================================================================
        ADMIN SUPPORT SESSION BANNER (when platform owner is assisting)
        ========================================================================
      */}
      {supportSession && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-amber-600 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Support Session Active:</strong> Inspecting advertiser account{' '}
              <code className="bg-amber-600/30 px-1 py-0.5 rounded font-mono">
                {profile?.businessName || supportSession.merchantId}
              </code>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                supportSession.mode === 'authorized_write'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {supportSession.mode === 'authorized_write' ? 'Authorized Edit Mode' : 'Read-Only Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {supportSession.mode === 'read_only' ? (
              <button
                onClick={() => setSupportSessionMode('authorized_write')}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Switch to Authorized Edit
              </button>
            ) : (
              <button
                onClick={() => setSupportSessionMode('read_only')}
                className="px-2.5 py-1 bg-amber-600 text-slate-950 rounded-lg text-[11px] hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Switch to Read-Only
              </button>
            )}
            <button
              onClick={() => {
                endAdminSupportSession()
                navigate('/admin')
              }}
              className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-[11px] font-black hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              Exit to Super Admin
            </button>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        TOP NAVIGATION HEADER
        ========================================================================
      */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-heading font-black text-xl text-slate-900 tracking-tight">
                Magnetos
              </span>
            </Link>
            <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-heading font-black text-[11px] tracking-wide uppercase border border-blue-200/70 hidden sm:inline-block">
              Magnet Advertiser Portal
            </span>
          </div>

          {/* Business Profile & Logout Header Section */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-heading font-black text-slate-900 block leading-tight">
                {profile?.businessName || 'Advertiser Account'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate block max-w-[180px]">
                {profile?.contactPerson || profile?.businessEmail || 'Merchant'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        MAIN APPLICATION BODY: SIDEBAR + CONTENT
        ========================================================================
      */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200/90 p-4 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Advertiser Controls
            </span>

            {[
              { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'plans', label: 'Magnet Advertising Plans', icon: Sparkles },
              { id: 'campaigns', label: 'My Magnet Advertisements', icon: Layers },
              { id: 'creatives', label: 'Magnet Artwork', icon: ImageIcon },
              { id: 'preview', label: 'Live Fridge Preview', icon: Eye },
              { id: 'billing', label: 'Subscription & Billing', icon: Receipt },
              { id: 'analytics', label: 'Campaign Analytics', icon: BarChart3 },
              { id: 'profile', label: 'Business Profile', icon: Building2 },
            ].map((item) => {
              const Icon = item.icon
              const isSelected = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as DashboardTab)}
                  className={`w-full px-3 py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'campaigns' && campaigns.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {campaigns.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick Support / Personal Fridge Link at sidebar bottom */}
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
            <Link
              to="/dashboard"
              className="w-full px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors flex items-center justify-between"
            >
              <span>View Personal Fridge</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Fridge Magnet Advertising</span>
              <span>Exclusive placement format across all consumer virtual refrigerators.</span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Toast Notification */}
          {toastMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{toastMsg.text}</span>
              <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* =============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Header Title with Primary Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Virtual Fridge Magnet Network</span>
                  </div>
                  <h1 className="font-heading font-black text-2xl tracking-tight text-white">
                    Magnet Advertising Control Centre
                  </h1>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Promote your brand with sponsored souvenir magnets placed directly on user virtual fridges.
                    Monitor campaign duration, approval states, impressions, and live user clicks.
                  </p>
                </div>

                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black text-xs rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Purchase Magnet Advertisement</span>
                </button>
              </div>

              {/* Rejection Notification Banner (if any campaign rejected) */}
              {rejectedCampaigns.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-black text-xs">
                        Action Required: {rejectedCampaigns.length} Advertisement(s) Require Revision
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Super Admin requested changes: &quot;{rejectedCampaigns[0].rejectionReason || 'Please review creative guidelines and resubmit.'}&quot;
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCampaignStatusFilter('rejected')
                      setActiveTab('campaigns')
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 text-white font-heading font-bold text-xs rounded-xl shadow-xs hover:bg-rose-700 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    View & Edit Drafts
                  </button>
                </div>
              )}

              {/* 8 Required Real Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* 1. Active Magnet Ads */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Magnet Ads
                  </span>
                  <p className="font-heading font-black text-2xl text-emerald-600">
                    {activeCampaignsCount}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Live on user fridges
                  </span>
                </div>

                {/* 2. Pending Approval */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pending Approval
                  </span>
                  <p className="font-heading font-black text-2xl text-amber-600">
                    {pendingApprovalCount}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    In admin review queue
                  </span>
                </div>

                {/* 3. Rejected Advertisements */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Rejected Ads
                  </span>
                  <p className="font-heading font-black text-2xl text-rose-600">
                    {rejectedCampaigns.length}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Requires revision
                  </span>
                </div>

                {/* 4. Draft Advertisements */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Draft Advertisements
                  </span>
                  <p className="font-heading font-black text-2xl text-slate-700">
                    {draftCampaignsCount}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Unsubmitted drafts
                  </span>
                </div>

                {/* 5. Current Subscription Plan */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Plan
                  </span>
                  <p className="font-heading font-black text-base text-blue-600 truncate mt-1">
                    {activeSubscription?.plan?.name || 'No Active Plan'}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    {activeSubscription ? 'Entitlement Active' : 'Select a plan below'}
                  </span>
                </div>

                {/* 6. Subscription Expiry Date */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subscription Expiry
                  </span>
                  <p className="font-heading font-black text-base text-slate-900 mt-1">
                    {activeSubscription
                      ? new Date(activeSubscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    {activeSubscription ? 'Valid period' : 'Inactive'}
                  </span>
                </div>

                {/* 7. Total Magnet Impressions */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Magnet Impressions
                  </span>
                  <p className="font-heading font-black text-2xl text-slate-900">
                    {metrics.impressions.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Actual consumer views
                  </span>
                </div>

                {/* 8. Magnet Clicks & CTR */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Magnet Clicks & CTR
                  </span>
                  <p className="font-heading font-black text-2xl text-indigo-600">
                    {metrics.clicks.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    CTR: {metrics.ctr}%
                  </span>
                </div>

              </div>

              {/* Active & Recent Campaigns Section */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-base text-slate-900">
                      Your Magnet Campaigns
                    </h3>
                    <p className="text-xs text-slate-500">
                      Overview of your latest magnet advertisements and delivery statuses
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    View All ({campaigns.length}) →
                  </button>
                </div>

                {campaigns.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-heading font-black text-sm text-slate-900">
                      No Magnet Advertisements Yet
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Choose an advertising plan and launch your brand magnet on consumer virtual fridges.
                    </p>
                    <button
                      onClick={() => setIsCampaignModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-heading font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Purchase Magnet Advertisement</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.slice(0, 5).map((camp) => (
                      <div
                        key={camp.id}
                        className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Magnet Preview Thumbnail */}
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-amber-400/80 flex-shrink-0 flex items-center justify-center shadow-xs relative">
                            <img src={camp.creativeUrl} alt={camp.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/40 pointer-events-none" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                  camp.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : camp.status === 'pending_approval'
                                    ? 'bg-amber-100 text-amber-800'
                                    : camp.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : camp.status === 'paused'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {camp.status.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Fridge Magnet
                              </span>
                            </div>
                            <h4 className="font-heading font-black text-sm text-slate-900 truncate mt-0.5">
                              {camp.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {camp.brandName} • {camp.productName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedPreviewCampaignId(camp.id)
                              setActiveTab('preview')
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview on Fridge</span>
                          </button>
                          {camp.status === 'active' && (
                            <button
                              onClick={() => handleToggleCampaignStatus(camp)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-amber-50 text-slate-500 hover:text-amber-700 cursor-pointer"
                              title="Pause Advertisement"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}
                          {camp.status === 'paused' && (
                            <button
                              onClick={() => handleToggleCampaignStatus(camp)}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 cursor-pointer"
                              title="Resume Advertisement"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: MAGNET ADVERTISING PLANS */}
          {/* =============================================================== */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                    Magnet Advertising Plans
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a plan configured by Super Admin to sponsor virtual fridge magnets seen by active trip planners.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((plan) => {
                  const isPurchased = subscriptions.some(
                    (s) => s.planId === plan.id && s.status === 'active'
                  )

                  return (
                    <div
                      key={plan.id}
                      className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            {plan.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            Fridge Magnet
                          </span>
                        </div>

                        <h4 className="font-heading font-black text-base text-slate-900 mt-3 leading-tight">
                          {plan.name}
                        </h4>

                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="font-heading font-black text-2xl text-slate-900">
                            ₹ {(plan.priceInrMinor / 100).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500">/ {plan.durationDays} days</span>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 font-medium">
                          Capacity: {plan.creativeSlots} magnet placement(s)
                        </div>

                        <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                        {isPurchased ? (
                          <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 text-center font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Subscribed & Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenCheckout(plan)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
                          >
                            Subscribe & Pay
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setInitialPlanForCampaign(plan.id)
                            setIsCampaignModalOpen(true)
                          }}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                        >
                          Configure Magnet Campaign
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: MY MAGNET ADVERTISEMENTS */}
          {/* =============================================================== */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                    My Magnet Advertisements
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage submissions, review states, schedule dates, and actual consumer click-through performance.
                  </p>
                </div>

                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Purchase Magnet Advertisement</span>
                </button>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['all', 'active', 'pending_approval', 'pending_payment', 'approved', 'scheduled', 'paused', 'rejected', 'expired'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setCampaignStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs transition-colors cursor-pointer capitalize whitespace-nowrap ${
                      campaignStatusFilter === st
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {filteredCampaigns.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-heading font-black text-base text-slate-800">
                    No Magnet Campaigns Found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {campaignStatusFilter === 'all'
                      ? 'Launch your first sponsored magnet campaign across the virtual fridge.'
                      : `No campaigns currently matching status "${campaignStatusFilter}".`}
                  </p>
                  <button
                    onClick={() => setIsCampaignModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Create Magnet Advertisement
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((camp) => {
                    const daysRemaining = Math.max(
                      0,
                      Math.ceil((new Date(camp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    )

                    return (
                      <div
                        key={camp.id}
                        className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow space-y-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          {/* Magnet Artwork & Info */}
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-amber-400 shadow-sm flex items-center justify-center relative flex-shrink-0">
                              <img src={camp.creativeUrl} alt={camp.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/40 pointer-events-none" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                                    camp.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : camp.status === 'pending_approval'
                                      ? 'bg-amber-100 text-amber-800'
                                      : camp.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : camp.status === 'paused'
                                      ? 'bg-slate-200 text-slate-700'
                                      : camp.status === 'approved'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {camp.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                  <span>{camp.status.replace('_', ' ')}</span>
                                </span>

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  camp.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {camp.isPaid ? 'Payment Confirmed' : 'Payment Pending'}
                                </span>
                              </div>

                              <h4 className="font-heading font-black text-base text-slate-900 mt-1">
                                {camp.name}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Brand: <strong className="text-slate-700">{camp.brandName}</strong> • Offer: <strong className="text-slate-700">{camp.productName}</strong>
                              </p>
                              {camp.destinationUrl && (
                                <a
                                  href={camp.destinationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 hover:underline mt-0.5"
                                >
                                  <span>{camp.destinationUrl}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Metrics & Schedule */}
                          <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                              <span className="font-heading font-bold text-slate-900">
                                {new Date(camp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {' → '}
                                {new Date(camp.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="block text-[10px] text-blue-600 font-semibold mt-0.5">
                                {camp.status === 'active' ? `${daysRemaining} days remaining` : camp.status}
                              </span>
                            </div>

                            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Impressions</span>
                              <span className="font-heading font-black text-slate-900 text-sm">
                                {metrics.impressions}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Clicks</span>
                              <span className="font-heading font-black text-emerald-600 text-sm">
                                {metrics.clicks}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">CTR</span>
                              <span className="font-heading font-black text-blue-600 text-sm">
                                {metrics.ctr}%
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Rejection / Change Request Notice */}
                        {camp.status === 'rejected' && (
                          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
                            <div className="flex items-center gap-2 font-heading font-black text-rose-800">
                              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                              <span>Admin Rejection / Change Request Reason:</span>
                            </div>
                            <p className="text-xs text-rose-700 pl-6 leading-relaxed">
                              {camp.rejectionReason || camp.changeRequestNote || 'Please review creative dimensions and destination URL before resubmitting.'}
                            </p>
                          </div>
                        )}

                        {/* Campaign Actions Bar */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-mono">
                            Slot: {camp.slotId || 'Door Top Right (Eye Level)'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPreviewCampaignId(camp.id)
                                setActiveTab('preview')
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview on Fridge</span>
                            </button>

                            {camp.status === 'active' && (
                              <button
                                onClick={() => handleToggleCampaignStatus(camp)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                Pause Advertisement
                              </button>
                            )}

                            {camp.status === 'paused' && (
                              <button
                                onClick={() => handleToggleCampaignStatus(camp)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                Resume Advertisement
                              </button>
                            )}

                            {camp.status === 'rejected' && (
                              <button
                                onClick={() => setIsCampaignModalOpen(true)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-heading font-bold shadow-xs cursor-pointer"
                              >
                                Edit & Resubmit
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: MAGNET ARTWORK ASSETS */}
          {/* =============================================================== */}
          {activeTab === 'creatives' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                    Magnet Artwork Assets
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload and manage high-resolution 1:1 image badges for your sponsored fridge magnets.
                  </p>
                </div>

                <button
                  onClick={() => setIsUploadingCreative(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Magnet Artwork</span>
                </button>
              </div>

              {/* Upload Modal Form */}
              {isUploadingCreative && (
                <form
                  onSubmit={handleCreateCreative}
                  className="p-5 bg-white rounded-3xl border-2 border-blue-600 shadow-md space-y-4"
                >
                  <h4 className="font-heading font-black text-sm text-slate-900">
                    Add Magnet Artwork to Library
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name *</label>
                      <input
                        type="text"
                        required
                        value={newCreativeName}
                        onChange={(e) => setNewCreativeName(e.target.value)}
                        placeholder="e.g. Summer Travel Badge Artwork"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Asset Image URL *</label>
                      <input
                        type="text"
                        required
                        value={newCreativeUrl}
                        onChange={(e) => setNewCreativeUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or /assets/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadingCreative(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Artwork
                    </button>
                  </div>
                </form>
              )}

              {/* Artwork Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {creatives.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative border border-slate-200/80">
                        <img src={c.fileUrl} alt={c.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 text-[9px] font-mono font-bold uppercase bg-slate-950/70 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                          Magnet Badge
                        </span>
                      </div>

                      <h4 className="font-heading font-black text-sm text-slate-900 mt-2 truncate">
                        {c.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(c.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => handleDeleteCreative(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: LIVE VIRTUAL FRIDGE PREVIEW */}
          {/* =============================================================== */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                    Virtual Fridge Door Preview
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect your sponsored magnet in place on the consumer refrigerator door surface.
                  </p>
                </div>

                {campaigns.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Preview Campaign:</span>
                    <select
                      value={selectedPreviewCampaignId}
                      onChange={(e) => setSelectedPreviewCampaignId(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.brandName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <MerchantLivePreview
                activeCampaigns={campaigns}
                draftCampaign={
                  previewCampaign || {
                    name: 'Sponsored Travel Magnet',
                    brandName: profile?.businessName || 'Your Brand',
                    productName: 'Featured Travel Offer',
                    description: 'Exclusive deal for travelers.',
                    destinationUrl: profile?.businessWebsite || 'https://magnetos.in',
                    ctaText: 'Shop Now',
                    creativeUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
                    positionX: 72,
                    positionY: 22,
                    displayScale: 1.05,
                  }
                }
              />
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 6: SUBSCRIPTION & BILLING */}
          {/* =============================================================== */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Subscription & Verified Invoices
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage active magnet advertising entitlements and view verified transaction receipts.
                </p>
              </div>

              {/* Current Active Plan Card */}
              <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                    Active Entitlement
                  </span>
                  <h3 className="font-heading font-black text-xl text-white mt-0.5">
                    {activeSubscription?.plan?.name || 'No Active Subscription'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {activeSubscription
                      ? `Valid until ${new Date(activeSubscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}`
                      : 'Purchase a magnet advertising plan to activate continuous door placement.'}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('plans')}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black text-xs rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer flex-shrink-0"
                >
                  {activeSubscription ? 'Renew / Change Plan' : 'View Magnet Plans'}
                </button>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-slate-200 font-heading font-black text-sm text-slate-900">
                  Transaction Ledger & Receipts
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {p.gatewayOrderId}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                            <td className="py-3 px-4 font-heading font-black text-slate-900">
                              ₹ {(p.amountMinor / 100).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                SUCCESS
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {new Date(p.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 7: CAMPAIGN ANALYTICS */}
          {/* =============================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Magnet Campaign Performance
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Actual user impressions and safe click-through events tracked across normal consumer sessions.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Magnet Impressions</span>
                  <p className="font-heading font-black text-2xl text-slate-900 mt-1">
                    {metrics.impressions}
                  </p>
                  <span className="text-[10px] text-slate-500">Rendered on virtual fridge door</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Direct Magnet Clicks</span>
                  <p className="font-heading font-black text-2xl text-emerald-600 mt-1">
                    {metrics.clicks}
                  </p>
                  <span className="text-[10px] text-slate-500">Redirected to destination URL</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Click-Through Rate (CTR)</span>
                  <p className="font-heading font-black text-2xl text-blue-600 mt-1">
                    {metrics.ctr}%
                  </p>
                  <span className="text-[10px] text-slate-500">Direct conversion ratio</span>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 8: BUSINESS PROFILE */}
          {/* =============================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  Business & Advertiser Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage company contact information and verified brand credentials.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Business Name
                  </label>
                  <p className="font-heading font-black text-base text-slate-900">
                    {profile?.businessName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Contact Person
                    </label>
                    <p className="font-bold text-slate-800">{profile?.contactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Business Category
                    </label>
                    <p className="font-bold text-slate-800">{profile?.businessCategory}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Registered Email
                    </label>
                    <p className="font-bold text-slate-800">{profile?.businessEmail}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <p className="font-bold text-slate-800">{profile?.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Campaign Creation / Configuration Modal */}
      <CampaignCreationModal
        merchantId={profile?.id || 'm_default'}
        plans={plans}
        subscriptions={subscriptions}
        creatives={creatives}
        isOpen={isCampaignModalOpen}
        onClose={() => {
          setIsCampaignModalOpen(false)
          setInitialPlanForCampaign(undefined)
        }}
        onSuccess={async (camp) => {
          await loadData()
          setToastMsg({
            type: 'success',
            text: `Campaign "${camp.name}" submitted successfully for Super Admin approval.`,
          })
        }}
        onOpenCheckout={(plan) => {
          setIsCampaignModalOpen(false)
          handleOpenCheckout(plan)
        }}
        initialPlanId={initialPlanForCampaign}
      />

      {/* Merchant Subscription Checkout Modal */}
      <MerchantCheckoutModal
        plan={selectedCheckoutPlan}
        merchantId={profile?.id || 'm_default'}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={async () => {
          await loadData()
          setToastMsg({
            type: 'success',
            text: 'Subscription payment verified! You can now configure your magnet advertisement.',
          })
        }}
      />

    </div>
  )
}
