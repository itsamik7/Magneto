import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MerchantProfile, AdvertisingCampaign, AdvertisingPlan, PaymentTransaction } from '../../types/advertising'
import {
  getAllMerchants,
  getAllCampaigns,
  getAdvertisingPlans,
  getMerchantSubscriptions,
  getMerchantPayments,
  updateMerchantProfile,
  ADVERTISING_UPDATED_EVENT,
} from '../../services/advertisingService'
import {
  startAdminSupportSession,
  verifyMerchant,
  updateMerchantAccountStatus,
  updateMerchantPricingPlan,
  toggleMerchantAds,
  getPlatformSettings,
} from '../../services/adminService'
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Eye,
  CreditCard,
  Layers,
  ChevronRight,
  Clock,
  X,
  Edit,
  Mail,
  Phone,
  Globe,
  Sparkles,
  Lock,
} from 'lucide-react'

interface AdminMerchantManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminMerchantManagement: React.FC<AdminMerchantManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const navigate = useNavigate()

  const [merchants, setMerchants] = useState<MerchantProfile[]>([])
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [plans, setPlans] = useState<AdvertisingPlan[]>([])
  const [pausedMerchantIds, setPausedMerchantIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [verificationFilter, setVerificationFilter] = useState<string>('all')
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all')

  // Support-View Impersonation Modal
  const [impersonatingMerchant, setImpersonatingMerchant] = useState<MerchantProfile | null>(null)
  const [impersonationMode, setImpersonationMode] = useState<'read_only' | 'authorized_write'>('read_only')

  // Merchant Details & Edit Modal
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantProfile | null>(null)
  const [editBusinessName, setEditBusinessName] = useState('')
  const [editContactPerson, setEditContactPerson] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editWebsite, setEditWebsite] = useState('')

  // Plan Assignment Modal
  const [assignPlanMerchant, setAssignPlanMerchant] = useState<MerchantProfile | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [additionalDays, setAdditionalDays] = useState<number>(30)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadAll = async () => {
    try {
      const [mList, cList, pList, sett] = await Promise.all([
        getAllMerchants(),
        getAllCampaigns(),
        getAdvertisingPlans(),
        getPlatformSettings(),
      ])
      setMerchants(mList)
      setCampaigns(cList)
      setPlans(pList)
      setPausedMerchantIds(sett.pausedMerchantIds || [])
    } catch (e: any) {
      console.error('Failed to load merchant data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const handleUpdate = () => loadAll()
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
  }, [])

  // Start Audited Admin Support-View Session
  const handleStartImpersonation = async () => {
    if (!impersonatingMerchant) return

    try {
      await startAdminSupportSession(impersonatingMerchant, impersonationMode, {
        email: currentAdminEmail,
        role: currentAdminRole,
      })
      navigate('/merchant/dashboard')
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to start support session' })
    }
  }

  // Toggle Verification Status
  const handleToggleVerification = async (m: MerchantProfile) => {
    const nextStatus = m.verificationStatus === 'verified' ? 'pending' : 'verified'
    try {
      await verifyMerchant(m.id, nextStatus, {
        email: currentAdminEmail,
        role: currentAdminRole,
      })
      setToast({
        type: 'success',
        text: `Merchant "${m.businessName}" verification set to ${nextStatus.toUpperCase()}.`,
      })
      loadAll()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Toggle Merchant Account Status (Suspend / Reactivate)
  const handleToggleAccountStatus = async (m: MerchantProfile) => {
    const isSuspended = m.accountStatus === 'suspended'
    const nextStatus = isSuspended ? 'active' : 'suspended'
    const reason = isSuspended
      ? 'Reactivated by Super Admin'
      : window.prompt('Please enter operational reason for suspending this merchant account:')

    if (!isSuspended && !reason) return

    try {
      await updateMerchantAccountStatus(m.id, nextStatus, reason || undefined, {
        email: currentAdminEmail,
        role: currentAdminRole,
      })
      setToast({
        type: 'success',
        text: `Merchant account "${m.businessName}" set to ${nextStatus.toUpperCase()}.`,
      })
      loadAll()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Pause / Resume all advertisements of a specific merchant
  const handleToggleMerchantAds = async (m: MerchantProfile) => {
    const isPaused = pausedMerchantIds.includes(m.id)
    try {
      await toggleMerchantAds(m.id, !isPaused, {
        email: currentAdminEmail,
        role: currentAdminRole,
      })
      setToast({
        type: 'success',
        text: `All advertisements for "${m.businessName}" are now ${!isPaused ? 'PAUSED' : 'RESUMED'}.`,
      })
      loadAll()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Save Merchant Profile Edit
  const handleSaveMerchantEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMerchant) return

    try {
      await updateMerchantProfile(selectedMerchant.id, {
        businessName: editBusinessName.trim(),
        contactPerson: editContactPerson.trim(),
        businessEmail: editEmail.trim(),
        phoneNumber: editPhone.trim(),
        businessCategory: editCategory.trim(),
        businessWebsite: editWebsite.trim() || null,
      })
      setToast({ type: 'success', text: `Merchant profile "${editBusinessName}" updated.` })
      setSelectedMerchant(null)
      loadAll()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Assign Custom Plan & Discount
  const handleExecuteAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignPlanMerchant || !selectedPlanId) return

    try {
      await updateMerchantPricingPlan(
        assignPlanMerchant.id,
        selectedPlanId,
        discountPercent,
        additionalDays,
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setToast({
        type: 'success',
        text: `Assigned customized subscription plan to "${assignPlanMerchant.businessName}".`,
      })
      setAssignPlanMerchant(null)
      loadAll()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Filtered merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      if (verificationFilter !== 'all' && m.verificationStatus !== verificationFilter) return false
      if (accountStatusFilter !== 'all' && (m.accountStatus || 'active') !== accountStatusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          m.businessName.toLowerCase().includes(q) ||
          m.contactPerson.toLowerCase().includes(q) ||
          m.businessEmail.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [merchants, verificationFilter, accountStatusFilter, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            Merchant & Advertiser Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage merchant businesses, approve registrations, verify status, assign commercial plans, or inspect via audited support view.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {merchants.length} Registered Merchants
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchants by business name, contact, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Account:</span>
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Merchant Directory Cards / Table */}
      <div className="space-y-4">
        {filteredMerchants.map((m) => {
          const merchantCampaigns = campaigns.filter((c) => c.merchantId === m.id)
          const activeCount = merchantCampaigns.filter((c) => c.status === 'active').length
          const isSuspended = m.accountStatus === 'suspended'
          const areAdsPaused = pausedMerchantIds.includes(m.id)

          return (
            <div
              key={m.id}
              className={`p-5 rounded-3xl border transition-all ${
                isSuspended
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Merchant Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-heading font-black text-sm shadow-xs flex-shrink-0 overflow-hidden">
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt={m.businessName} className="w-full h-full object-cover" />
                    ) : (
                      m.businessName[0]?.toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading font-black text-base text-slate-900 truncate">
                        {m.businessName}
                      </h3>

                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          m.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.verificationStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.verificationStatus}
                      </span>

                      {isSuspended && (
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                          Suspended
                        </span>
                      )}

                      {areAdsPaused && (
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          Ads Suppressed
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.contactPerson}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.businessEmail}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.phoneNumber}</span>
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                        {m.businessCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>ID: {m.id}</span>
                      <span>•</span>
                      <span>Registered: {new Date(m.createdAt).toLocaleDateString()}</span>
                      {m.businessWebsite && (
                        <>
                          <span>•</span>
                          <a
                            href={m.businessWebsite}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Key Metrics & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
                  <div className="grid grid-cols-2 gap-3 text-right text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-left sm:text-right">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Campaigns</span>
                      <span className="font-heading font-black text-slate-900 block">
                        {activeCount} Active / {merchantCampaigns.length} Total
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-left sm:text-right">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Custom Discount</span>
                      <span className="font-heading font-black text-blue-700 block">
                        {m.customDiscountPercentage ? `${m.customDiscountPercentage}%` : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* CRITICAL REQUIREMENT: Direct Merchant Dashboard Access */}
                    <button
                      type="button"
                      onClick={() => setImpersonatingMerchant(m)}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      title="Inspect merchant dashboard with secure admin support mode"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Open Merchant Dashboard</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMerchant(m)
                        setEditBusinessName(m.businessName)
                        setEditContactPerson(m.contactPerson)
                        setEditEmail(m.businessEmail)
                        setEditPhone(m.phoneNumber)
                        setEditCategory(m.businessCategory)
                        setEditWebsite(m.businessWebsite || '')
                      }}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
                      title="Edit Business Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignPlanMerchant(m)
                        setSelectedPlanId(plans[0]?.id || '')
                        setDiscountPercent(m.customDiscountPercentage || 0)
                      }}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 cursor-pointer"
                      title="Assign Subscription Plan & Pricing"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleMerchantAds(m)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        areAdsPaused
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={areAdsPaused ? 'Restore Merchant Advertisements' : 'Pause All Ads Belonging to this Merchant'}
                    >
                      {areAdsPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleAccountStatus(m)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isSuspended
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                      }`}
                      title={isSuspended ? 'Reactivate Merchant Account' : 'Suspend Merchant Account'}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 
        ========================================================================
        MODAL: START AUDITED ADMIN SUPPORT-VIEW SESSION
        ========================================================================
      */}
      {impersonatingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-lg text-slate-900">
                Open Merchant Dashboard
              </h3>
              <p className="text-xs text-slate-600">
                Inspecting <strong className="text-slate-900">{impersonatingMerchant.businessName}</strong> ({impersonatingMerchant.id}).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1 leading-relaxed">
              <strong>Security & Auditing:</strong>
              <p className="text-[11px] text-blue-800">
                You will access this dashboard as administrator <strong>{currentAdminEmail}</strong>. Sensitive merchant passwords and credentials are never exposed. A clear top banner with "Return to Super Admin" will accompany your session.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Session Inspection Mode:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImpersonationMode('read_only')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    impersonationMode === 'read_only'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="font-heading font-bold text-xs text-slate-900 block">
                    Read-Only Mode
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Safe inspection of plans, billing, and preview.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImpersonationMode('authorized_write')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    impersonationMode === 'authorized_write'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="font-heading font-bold text-xs text-slate-900 block">
                    Authorized Action
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Allow administrative changes on behalf of merchant.
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImpersonatingMerchant(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartImpersonation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Launch Support View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: EDIT MERCHANT BUSINESS DETAILS
        ========================================================================
      */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveMerchantEdit}
            className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">
                Edit Merchant: {selectedMerchant.businessName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMerchant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={editContactPerson}
                  onChange={(e) => setEditContactPerson(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Category *</label>
                <input
                  type="text"
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMerchant(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs"
              >
                Save Business Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: ASSIGN PLAN & CUSTOM DISCOUNT
        ========================================================================
      */}
      {assignPlanMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleExecuteAssignPlan}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">
                Assign Subscription Plan
              </h3>
              <button
                type="button"
                onClick={() => setAssignPlanMerchant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Assign or upgrade advertising subscription plan for <strong>{assignPlanMerchant.businessName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Subscription Plan *
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹ {(p.priceInrMinor / 100).toLocaleString('en-IN')} ({p.durationDays} days)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Discount (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Validity Extension (Days)
                </label>
                <input
                  type="number"
                  min={7}
                  max={365}
                  value={additionalDays}
                  onChange={(e) => setAdditionalDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignPlanMerchant(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs"
              >
                Assign & Activate Plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
