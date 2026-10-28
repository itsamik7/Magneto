import React, { useState, useEffect, useMemo } from 'react'
import type { AdvertisingCampaign, MerchantProfile, CampaignStatus, AdvertisingSlot, AdvertisingPlan } from '../../types/advertising'
import {
  getAllCampaigns,
  getAllMerchants,
  getAdvertisingSlots,
  getAdvertisingPlans,
  adminApproveCampaign,
  adminRejectCampaign,
  adminRequestChanges,
  adminExpireCampaign,
  adminSetCampaignStatus,
  adminUpdateCampaignFull,
  adminDeleteCampaignPermanent,
  ADVERTISING_UPDATED_EVENT,
} from '../../services/advertisingService'
import {
  recordAuditLog,
  getPlatformSettings,
  toggleGlobalAdvertising,
} from '../../services/adminService'
import { AdminAdPreviewModal } from './AdminAdPreviewModal'
import {
  Layers,
  Search,
  Filter,
  Check,
  X,
  Eye,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  CreditCard,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Compass,
} from 'lucide-react'

interface AdminCampaignsManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminCampaignsManagement: React.FC<AdminCampaignsManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [merchants, setMerchants] = useState<MerchantProfile[]>([])
  const [slots, setSlots] = useState<AdvertisingSlot[]>([])
  const [plans, setPlans] = useState<AdvertisingPlan[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [slotFilter, setSlotFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Live Preview modal
  const [previewingCampaign, setPreviewingCampaign] = useState<AdvertisingCampaign | null>(null)

  // Rejection modal
  const [rejectingCampaign, setRejectingCampaign] = useState<AdvertisingCampaign | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Request Changes modal
  const [requestingChangesCampaign, setRequestingChangesCampaign] = useState<AdvertisingCampaign | null>(null)
  const [changeRequestNote, setChangeRequestNote] = useState('')

  // Edit Campaign Modal
  const [editingCampaign, setEditingCampaign] = useState<AdvertisingCampaign | null>(null)
  const [editName, setEditName] = useState('')
  const [editBrandName, setEditBrandName] = useState('')
  const [editProductName, setEditProductName] = useState('')
  const [editDestinationUrl, setEditDestinationUrl] = useState('')
  const [editCtaText, setEditCtaText] = useState('')
  const [editCreativeUrl, setEditCreativeUrl] = useState('')
  const [editSlotId, setEditSlotId] = useState('')
  const [editPositionX, setEditPositionX] = useState<number>(50)
  const [editPositionY, setEditPositionY] = useState<number>(45)
  const [editPriority, setEditPriority] = useState<number>(1)
  const [editBudgetMinor, setEditBudgetMinor] = useState<number>(0)
  const [editInternalNotes, setEditInternalNotes] = useState('')

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const [cList, mList, sList, pList] = await Promise.all([
        getAllCampaigns(),
        getAllMerchants(),
        getAdvertisingSlots(),
        getAdvertisingPlans(),
      ])
      setCampaigns(cList)
      setMerchants(mList)
      setSlots(sList)
      setPlans(pList)
    } catch (e: any) {
      console.error('Failed to load campaigns:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
  }, [])

  // Approve Campaign
  const handleApprove = async (campaign: AdvertisingCampaign) => {
    try {
      await adminApproveCampaign(campaign.id)
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: 'APPROVE_ADVERTISEMENT_CAMPAIGN',
        entityType: 'advertisement',
        entityId: campaign.id,
        details: { campaignName: campaign.name, brandName: campaign.brandName },
        beforeState: { status: campaign.status },
        afterState: { status: 'active' },
      })
      setToast({ type: 'success', text: `Magnet campaign "${campaign.name}" approved and published live to virtual fridge!` })
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Confirm Rejection
  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingCampaign) return

    try {
      await adminRejectCampaign(
        rejectingCampaign.id,
        rejectionReason.trim() || 'Magnet artwork or destination link does not meet platform safety guidelines.'
      )
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: 'REJECT_ADVERTISEMENT_CAMPAIGN',
        entityType: 'advertisement',
        entityId: rejectingCampaign.id,
        details: { campaignName: rejectingCampaign.name, reason: rejectionReason },
        beforeState: { status: rejectingCampaign.status },
        afterState: { status: 'rejected' },
      })
      setToast({ type: 'success', text: `Campaign "${rejectingCampaign.name}" rejected.` })
      setRejectingCampaign(null)
      setRejectionReason('')
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Confirm Request Changes
  const handleRequestChangesConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestingChangesCampaign) return

    try {
      await adminRequestChanges(
        requestingChangesCampaign.id,
        changeRequestNote.trim() || 'Please revise artwork resolution or destination URL.'
      )
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: 'REQUEST_CHANGES_ADVERTISEMENT_CAMPAIGN',
        entityType: 'advertisement',
        entityId: requestingChangesCampaign.id,
        details: { campaignName: requestingChangesCampaign.name, note: changeRequestNote },
        beforeState: { status: requestingChangesCampaign.status },
        afterState: { status: 'rejected', changeRequestNote },
      })
      setToast({ type: 'success', text: `Revision requested for "${requestingChangesCampaign.name}". Merchant notified.` })
      setRequestingChangesCampaign(null)
      setChangeRequestNote('')
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Toggle Pause / Resume
  const handleToggleStatus = async (campaign: AdvertisingCampaign) => {
    const nextStatus: CampaignStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      await adminSetCampaignStatus(campaign.id, nextStatus)
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: nextStatus === 'active' ? 'RESUME_ADVERTISEMENT' : 'PAUSE_ADVERTISEMENT',
        entityType: 'advertisement',
        entityId: campaign.id,
        details: { campaignName: campaign.name },
        beforeState: { status: campaign.status },
        afterState: { status: nextStatus },
      })
      setToast({
        type: 'success',
        text: `Campaign "${campaign.name}" status changed to ${nextStatus.toUpperCase()}.`,
      })
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Expire Campaign immediately
  const handleExpireCampaign = async (campaign: AdvertisingCampaign) => {
    if (window.confirm(`Expire campaign "${campaign.name}" immediately? It will stop appearing on the virtual fridge.`)) {
      try {
        await adminExpireCampaign(campaign.id)
        await recordAuditLog({
          actorEmail: currentAdminEmail,
          actorRole: currentAdminRole,
          action: 'EXPIRE_ADVERTISEMENT_CAMPAIGN',
          entityType: 'advertisement',
          entityId: campaign.id,
          details: { campaignName: campaign.name },
        })
        setToast({ type: 'success', text: `Campaign "${campaign.name}" marked as expired.` })
        loadData()
      } catch (err: any) {
        setToast({ type: 'error', text: err.message })
      }
    }
  }

  // Permanent Delete / Terminate
  const handleDelete = async (campaign: AdvertisingCampaign) => {
    if (window.confirm(`Permanently remove campaign "${campaign.name}"? This action cannot be undone.`)) {
      try {
        await adminDeleteCampaignPermanent(campaign.id)
        await recordAuditLog({
          actorEmail: currentAdminEmail,
          actorRole: currentAdminRole,
          action: 'TERMINATE_CAMPAIGN_PERMANENT',
          entityType: 'advertisement',
          entityId: campaign.id,
          details: { campaignName: campaign.name },
        })
        setToast({ type: 'success', text: `Campaign "${campaign.name}" permanently deleted.` })
        loadData()
      } catch (err: any) {
        setToast({ type: 'error', text: err.message })
      }
    }
  }

  // Open Edit Modal
  const openEditModal = (c: AdvertisingCampaign) => {
    setEditingCampaign(c)
    setEditName(c.name)
    setEditBrandName(c.brandName)
    setEditProductName(c.productName)
    setEditDestinationUrl(c.destinationUrl)
    setEditCtaText(c.ctaText || 'Shop Now')
    setEditCreativeUrl(c.creativeUrl)
    setEditSlotId(c.slotId || 'door_center_showcase')
    setEditPositionX(c.positionX ?? 50)
    setEditPositionY(c.positionY ?? 45)
    setEditPriority(c.priorityWeight || 1)
    setEditBudgetMinor(c.budgetLimitMinor || 0)
    setEditInternalNotes(c.internalNotes || '')
  }

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return

    try {
      await adminUpdateCampaignFull(editingCampaign.id, {
        name: editName.trim(),
        brandName: editBrandName.trim(),
        productName: editProductName.trim(),
        destinationUrl: editDestinationUrl.trim(),
        ctaText: editCtaText.trim(),
        creativeUrl: editCreativeUrl.trim(),
        slotId: editSlotId,
        positionX: editPositionX,
        positionY: editPositionY,
        priorityWeight: editPriority,
        budgetLimitMinor: editBudgetMinor || undefined,
        internalNotes: editInternalNotes.trim() || undefined,
      })

      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: 'UPDATE_CAMPAIGN_DETAILS',
        entityType: 'advertisement',
        entityId: editingCampaign.id,
        details: { campaignName: editName },
      })

      setToast({ type: 'success', text: `Campaign "${editName}" updated successfully.` })
      setEditingCampaign(null)
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  const counts = useMemo(() => {
    return {
      all: campaigns.length,
      pending: campaigns.filter((c) => c.status === 'pending_approval').length,
      active: campaigns.filter((c) => c.status === 'active').length,
      paused: campaigns.filter((c) => c.status === 'paused').length,
      rejected: campaigns.filter((c) => c.status === 'rejected').length,
      expired: campaigns.filter((c) => c.status === 'expired').length,
    }
  }, [campaigns])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (slotFilter !== 'all' && c.slotId !== slotFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const merchant = merchants.find((m) => m.id === c.merchantId)
        return (
          c.name.toLowerCase().includes(q) ||
          c.brandName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.destinationUrl.toLowerCase().includes(q) ||
          (merchant?.businessName || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [campaigns, merchants, statusFilter, slotFilter, searchQuery])

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
          <button onClick={() => setToast(null)} className="font-bold text-lg leading-none cursor-pointer">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-indigo-100 text-indigo-700">
              Virtual Fridge Magnet Ads
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Single Supported Ad Format</span>
          </div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight mt-1">
            Magnet Advertisement Approvals & Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Govern, moderate, preview, schedule, and approve sponsored travel magnets displayed on the virtual fridge door surface.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{counts.pending} Awaiting Review</span>
            </span>
          )}
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {campaigns.length} Total Campaigns
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Magnet Ads', count: counts.all, color: 'text-slate-600' },
          { id: 'pending_approval', label: 'Pending Review', count: counts.pending, color: 'text-amber-700 bg-amber-100' },
          { id: 'active', label: 'Active Live', count: counts.active, color: 'text-emerald-700 bg-emerald-100' },
          { id: 'paused', label: 'Paused', count: counts.paused, color: 'text-slate-700 bg-slate-100' },
          { id: 'rejected', label: 'Rejected / Changes', count: counts.rejected, color: 'text-rose-700 bg-rose-100' },
          { id: 'expired', label: 'Expired', count: counts.expired, color: 'text-zinc-600 bg-zinc-100' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  isActive ? 'bg-white/20 text-white' : tab.color
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by campaign, brand, product, destination URL, or merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Door Slot:</span>
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none"
            >
              <option value="all">All Door Slots</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.defaultPositionX}%, {s.defaultPositionY ?? 45}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Magnet Artwork & Creative</th>
                <th className="py-3 px-4">Door Slot & Pos</th>
                <th className="py-3 px-4">Merchant Business</th>
                <th className="py-3 px-4">Plan & Schedule</th>
                <th className="py-3 px-4">Status & Quality</th>
                <th className="py-3 px-4 text-right">Super Admin Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No magnet advertisements found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => {
                  const merchant = merchants.find((m) => m.id === camp.merchantId)
                  const slot = slots.find((s) => s.id === camp.slotId)
                  const plan = plans.find((p) => p.id === camp.subscriptionId)

                  const now = Date.now()
                  const endMs = new Date(camp.endDate).getTime()
                  const daysLeft = Math.max(0, Math.ceil((endMs - now) / (1000 * 60 * 60 * 24)))

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Creative */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center relative group shadow-2xs">
                            <img
                              src={camp.creativeUrl}
                              alt={camp.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300'
                              }}
                            />
                            <button
                              onClick={() => setPreviewingCampaign(camp)}
                              className="absolute inset-0 bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-[9px] font-bold"
                              title="Open Virtual Fridge Preview"
                            >
                              <Eye className="w-4 h-4 mb-0.5" />
                              <span>Fridge</span>
                            </button>
                          </div>
                          <div className="min-w-0">
                            <span className="font-heading font-black text-slate-900 block truncate text-xs">
                              {camp.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate font-medium">
                              {camp.brandName} • {camp.productName}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={camp.destinationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                <span className="truncate max-w-[160px]">{camp.destinationUrl}</span>
                                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                              </a>
                              {camp.ctaText && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-bold text-slate-600">
                                  {camp.ctaText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Slot & Coordinates */}
                      <td className="py-3 px-4">
                        <span className="font-heading font-bold text-[11px] text-slate-800 block truncate max-w-[140px]">
                          {slot?.name || camp.slotId || 'Door Center Showcase'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                          <span>X: {camp.positionX ?? slot?.defaultPositionX ?? 50}%</span>
                          <span>•</span>
                          <span>Y: {camp.positionY ?? slot?.defaultPositionY ?? 45}%</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Priority: {camp.priorityWeight || 1}
                        </span>
                      </td>

                      {/* 3. Merchant */}
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-bold block truncate max-w-[140px]">
                          {merchant?.businessName || 'Merchant'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">
                          {merchant?.businessEmail || 'N/A'}
                        </span>
                        <span
                          className={`inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                            merchant?.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {merchant?.verificationStatus || 'unverified'}
                        </span>
                      </td>

                      {/* 4. Plan & Dates */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-heading font-black text-[11px] text-slate-800 block truncate">
                          {plan?.name || 'Magnet Plan'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {new Date(camp.startDate).toLocaleDateString()} – {new Date(camp.endDate).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              daysLeft > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                              camp.isPaid !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {camp.isPaid !== false ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Status & Quality notes */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                            camp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : camp.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : camp.status === 'paused'
                              ? 'bg-slate-200 text-slate-700'
                              : camp.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {camp.status.replace('_', ' ')}
                        </span>

                        {camp.changeRequestNote && (
                          <div className="mt-1 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 max-w-[180px]">
                            <strong className="block text-[9px] uppercase font-black text-amber-800">Changes Requested:</strong>
                            <p className="line-clamp-2" title={camp.changeRequestNote}>{camp.changeRequestNote}</p>
                          </div>
                        )}

                        {camp.rejectionReason && !camp.changeRequestNote && (
                          <div className="mt-1 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-900 max-w-[180px]">
                            <strong className="block text-[9px] uppercase font-black text-rose-800">Rejected:</strong>
                            <p className="line-clamp-2" title={camp.rejectionReason}>{camp.rejectionReason}</p>
                          </div>
                        )}
                      </td>

                      {/* 6. Moderation Controls */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Virtual Fridge Preview Action */}
                          <button
                            type="button"
                            onClick={() => setPreviewingCampaign(camp)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="Preview live on virtual fridge door"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Preview</span>
                          </button>

                          {/* Controls for Pending Approval */}
                          {camp.status === 'pending_approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(camp)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Approve and place on virtual fridge"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRequestingChangesCampaign(camp)
                                  setChangeRequestNote('')
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Request changes from merchant"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Changes</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingCampaign(camp)
                                  setRejectionReason('')
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Reject campaign with reason"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Pause / Resume for Active or Paused */}
                          {camp.status === 'active' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(camp)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700 cursor-pointer"
                                title="Pause magnet ad immediately"
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExpireCampaign(camp)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-zinc-100 text-slate-500 hover:text-zinc-800 cursor-pointer"
                                title="Expire Campaign Now"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {camp.status === 'paused' && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(camp)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 cursor-pointer"
                              title="Resume magnet ad on fridge"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Full Campaign Configuration */}
                          <button
                            type="button"
                            onClick={() => openEditModal(camp)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Edit Magnet Coordinates & Settings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Permanent Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(camp)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Permanently Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 
        ========================================================================
        MODAL: LIVE VIRTUAL FRIDGE CONSUMER PREVIEW
        ========================================================================
      */}
      {previewingCampaign && (
        <AdminAdPreviewModal
          campaign={previewingCampaign}
          onClose={() => setPreviewingCampaign(null)}
        />
      )}

      {/* 
        ========================================================================
        MODAL: REQUEST CHANGES / REVISION
        ========================================================================
      */}
      {requestingChangesCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleRequestChangesConfirm}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <h4 className="font-heading font-black text-base text-slate-900">
                  Request Changes: {requestingChangesCampaign.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRequestingChangesCampaign(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Provide clear feedback to the merchant. Their campaign will return to their dashboard with revision notes so they can correct artwork or destination links and resubmit.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Requested Adjustments & Guidance *
              </label>
              <textarea
                required
                rows={4}
                value={changeRequestNote}
                onChange={(e) => setChangeRequestNote(e.target.value)}
                placeholder="e.g. Please provide a 1:1 square magnet graphic with transparent or clean die-cut borders, and update the destination link to point to an active product landing page..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestingChangesCampaign(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-heading font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Send Change Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: REJECT CAMPAIGN
        ========================================================================
      */}
      {rejectingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleRejectConfirm}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h4 className="font-heading font-black text-base text-slate-900">
                  Reject Magnet Campaign: {rejectingCampaign.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRejectingCampaign(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please provide clear operational feedback explaining why this magnet creative or destination link violates platform policies.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Moderation Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Prohibited category, trademark infringement, broken destination link, or misleading promotional text..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCampaign(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: FULL SUPER ADMIN MAGNET CAMPAIGN EDIT
        ========================================================================
      */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">
                Edit Magnet Ad Settings: {editingCampaign.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Destination URL (safe external link) *</label>
              <input
                type="url"
                required
                value={editDestinationUrl}
                onChange={(e) => setEditDestinationUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Call-To-Action (CTA)</label>
                <input
                  type="text"
                  value={editCtaText}
                  onChange={(e) => setEditCtaText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Weight (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editPriority}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Virtual Fridge Door Placement Slot & Coordinates */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Virtual Fridge Door Positioning
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Door Placement Slot</label>
                <select
                  value={editSlotId}
                  onChange={(e) => {
                    const selId = e.target.value
                    setEditSlotId(selId)
                    const matched = slots.find((s) => s.id === selId)
                    if (matched) {
                      setEditPositionX(matched.defaultPositionX ?? 50)
                      setEditPositionY(matched.defaultPositionY ?? 45)
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                >
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.defaultPositionX}%, {s.defaultPositionY ?? 45}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Door X% (10-90%)</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={editPositionX}
                    onChange={(e) => setEditPositionX(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Door Y% (10-90%)</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={editPositionY}
                    onChange={(e) => setEditPositionY(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Magnet Artwork URL (1:1 Ratio) *</label>
              <input
                type="text"
                required
                value={editCreativeUrl}
                onChange={(e) => setEditCreativeUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Administrator Notes</label>
              <textarea
                rows={2}
                value={editInternalNotes}
                onChange={(e) => setEditInternalNotes(e.target.value)}
                placeholder="Internal platform notes..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Save Magnet Configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
