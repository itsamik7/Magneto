import React, { useState, useEffect } from 'react'
import type { SupportTicket } from '../../types/admin'
import {
  getSupportTickets,
  updateSupportTicket,
  SUPPORT_TICKETS_UPDATED_EVENT,
} from '../../services/adminService'
import type { AdvertisingCampaign, MerchantProfile } from '../../types/advertising'
import {
  getAllCampaigns,
  getAllMerchants,
  adminApproveCampaign,
  adminRejectCampaign,
  ADVERTISING_UPDATED_EVENT,
} from '../../services/advertisingService'
import { AdminAdPreviewModal } from './AdminAdPreviewModal'
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Check,
  X,
  MessageSquare,
  Search,
  Filter,
  Layers,
  Store,
} from 'lucide-react'

interface AdminSupportModerationProps {
  currentAdminEmail: string
  currentAdminRole: string
  onNavigateTab: (tabId: string) => void
}

export const AdminSupportModeration: React.FC<AdminSupportModerationProps> = ({
  currentAdminEmail,
  currentAdminRole,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'merchants' | 'tickets'>('campaigns')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [merchants, setMerchants] = useState<MerchantProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Live preview modal state
  const [previewingCampaign, setPreviewingCampaign] = useState<AdvertisingCampaign | null>(null)

  // Rejection reason state
  const [rejectingCampaign, setRejectingCampaign] = useState<AdvertisingCampaign | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const [tList, cList, mList] = await Promise.all([
        getSupportTickets(),
        getAllCampaigns(),
        getAllMerchants(),
      ])
      setTickets(tList)
      setCampaigns(cList)
      setMerchants(mList)
    } catch (e: any) {
      console.error('Failed to load moderation data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener(SUPPORT_TICKETS_UPDATED_EVENT, handleUpdate)
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    return () => {
      window.removeEventListener(SUPPORT_TICKETS_UPDATED_EVENT, handleUpdate)
      window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    }
  }, [])

  // Approve Pending Campaign
  const handleApproveCampaign = async (c: AdvertisingCampaign) => {
    try {
      await adminApproveCampaign(c.id)
      setToast({ type: 'success', text: `Campaign "${c.name}" approved!` })
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Reject Pending Campaign
  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingCampaign) return

    try {
      await adminRejectCampaign(rejectingCampaign.id, rejectionReason.trim() || 'Creative violates guidelines.')
      setToast({ type: 'success', text: `Campaign "${rejectingCampaign.name}" rejected.` })
      setRejectingCampaign(null)
      setRejectionReason('')
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Update Support Ticket Status
  const handleUpdateTicketStatus = async (ticket: SupportTicket, status: SupportTicket['status']) => {
    try {
      await updateSupportTicket(ticket.id, { status }, {
        email: currentAdminEmail,
        role: currentAdminRole,
      })
      setToast({ type: 'success', text: `Ticket #${ticket.id.slice(-6)} marked as ${status.toUpperCase()}.` })
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  const pendingCampaigns = campaigns.filter((c) => c.status === 'pending_approval')
  const pendingMerchants = merchants.filter((m) => m.verificationStatus === 'pending')

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
            Support, Moderation & Safety Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review pending merchant advertisements, business verifications, safety reports, and support tickets.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('campaigns')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeSubTab === 'campaigns'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ad Approvals ({pendingCampaigns.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('merchants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeSubTab === 'merchants'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Merchants ({pendingMerchants.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tickets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeSubTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tickets ({tickets.filter((t) => t.status === 'open').length})</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Pending Campaign Approvals */}
      {activeSubTab === 'campaigns' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-base text-slate-900">
              Pending Advertisement Creative Approvals ({pendingCampaigns.length})
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              Require Super Admin verification before publication
            </span>
          </div>

          {pendingCampaigns.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-800">Moderation Queue is Clean!</p>
              <p>No advertisements are awaiting review at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingCampaigns.map((camp) => (
                <div key={camp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                      <img src={camp.creativeUrl} alt={camp.name} className="h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Pending Approval
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {camp.placementId.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-heading font-black text-sm text-slate-900 mt-1 truncate">
                        {camp.name}
                      </h4>
                      <span className="text-xs text-slate-500 truncate block">
                        Brand: <strong>{camp.brandName}</strong> • Product: <strong>{camp.productName}</strong>
                      </span>
                      <a
                        href={camp.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>{camp.destinationUrl}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPreviewingCampaign(camp)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Preview live on virtual fridge"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleApproveCampaign(camp)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectingCampaign(camp)
                        setRejectionReason('')
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Pending Merchant Verifications */}
      {activeSubTab === 'merchants' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-base text-slate-900">
              Pending Merchant Registrations ({pendingMerchants.length})
            </h3>
            <button
              onClick={() => onNavigateTab('merchants')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Merchant Directory →
            </button>
          </div>

          {pendingMerchants.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-800">All Merchants Verified</p>
              <p>No new merchant registration requests currently pending review.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingMerchants.map((m) => (
                <div key={m.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-heading font-black text-sm text-slate-900">
                      {m.businessName}
                    </h4>
                    <span className="text-xs text-slate-500 block">
                      Contact: {m.contactPerson} • Email: {m.businessEmail} • Phone: {m.phoneNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Category: {m.businessCategory} • Registered {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigateTab('merchants')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Review in Directory
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Support Tickets & Abuse Reports */}
      {activeSubTab === 'tickets' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-base text-slate-900">
              Operational Tickets & Safety Reports ({tickets.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>

                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {t.ticketType.replace('_', ' ')}
                    </span>

                    <span className="text-slate-400 text-[10px]">
                      #{t.id.slice(-6)}
                    </span>
                  </div>

                  <h4 className="font-heading font-black text-sm text-slate-900">
                    {t.subject}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    {t.description}
                  </p>
                  {t.internalNotes && (
                    <span className="text-[11px] text-slate-500 italic block">
                      Note: {t.internalNotes}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                  {t.status !== 'resolved' ? (
                    <button
                      onClick={() => handleUpdateTicketStatus(t, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateTicketStatus(t, 'open')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Re-Open
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleRejectConfirm}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-black text-base text-slate-900">
                Reject Campaign: {rejectingCampaign.name}
              </h4>
              <button
                type="button"
                onClick={() => setRejectingCampaign(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what must be corrected..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCampaign(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewingCampaign && (
        <AdminAdPreviewModal
          campaign={previewingCampaign}
          onClose={() => setPreviewingCampaign(null)}
        />
      )}
    </div>
  )
}
