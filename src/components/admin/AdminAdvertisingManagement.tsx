import React, { useState, useEffect, useCallback } from 'react'
import type {
  MerchantProfile,
  AdvertisingCampaign,
  AdvertisingSlot,
  AdvertisingPlan,
  PaymentTransaction,
  AdvertisingPlacementType,
} from '../../types/advertising'
import {
  getAllCampaigns,
  getAllMerchants,
  getAdvertisingSlots,
  getAdvertisingPlans,
  saveAdvertisingSlot,
  saveAdvertisingPlan,
  adminApproveCampaign,
  adminRejectCampaign,
  adminSetCampaignStatus,
  updateMerchantProfile,
  ADVERTISING_UPDATED_EVENT,
} from '../../services/advertisingService'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Plus,
  Store,
  Layers,
  CreditCard,
  Building2,
  BarChart3,
  Eye,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react'

export const AdminAdvertisingManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'inventory' | 'plans' | 'merchants'>('campaigns')

  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [merchants, setMerchants] = useState<MerchantProfile[]>([])
  const [slots, setSlots] = useState<AdvertisingSlot[]>([])
  const [plans, setPlans] = useState<AdvertisingPlan[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Reject modal
  const [rejectingCampaign, setRejectingCampaign] = useState<AdvertisingCampaign | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Add/Edit Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdvertisingPlan | null>(null)
  const [planFormName, setPlanFormName] = useState('')
  const [planFormPlacement, setPlanFormPlacement] = useState<AdvertisingPlacementType>('fridge_magnet')
  const [planFormTier, setPlanFormTier] = useState<'standard' | 'featured' | 'premium'>('standard')
  const [planFormPrice, setPlanFormPrice] = useState<number>(4999)
  const [planFormDuration, setPlanFormDuration] = useState<number>(30)

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadAllData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadAllData()
    const handleUpdate = () => loadAllData()
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
  }, [loadAllData])

  // Approve Campaign
  const handleApprove = async (campaignId: string) => {
    await adminApproveCampaign(campaignId)
    setToastMsg({ type: 'success', text: 'Campaign approved and activated!' })
    loadAllData()
  }

  // Reject Campaign
  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingCampaign) return

    await adminRejectCampaign(rejectingCampaign.id, rejectionReason.trim() || 'Creative or link does not meet platform guidelines.')
    setToastMsg({ type: 'success', text: `Campaign "${rejectingCampaign.name}" was rejected.` })
    setRejectingCampaign(null)
    setRejectionReason('')
    loadAllData()
  }

  // Toggle Slot Active
  const handleToggleSlotActive = async (slot: AdvertisingSlot) => {
    await saveAdvertisingSlot({ ...slot, isActive: !slot.isActive })
    setToastMsg({
      type: 'success',
      text: `Slot "${slot.name}" is now ${!slot.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
    })
    loadAllData()
  }

  // Save Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = editingPlan ? editingPlan.id : `plan_${Date.now()}`
    await saveAdvertisingPlan({
      id,
      name: planFormName.trim(),
      placementId: planFormPlacement,
      tier: planFormTier,
      priceInrMinor: planFormPrice * 100,
      billingCurrency: 'INR',
      durationDays: planFormDuration,
      creativeSlots: planFormTier === 'premium' ? 4 : planFormTier === 'featured' ? 2 : 1,
      inventoryCapacity: 1,
      supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
      maxFileSizeMb: 25,
      priorityWeight: planFormTier === 'premium' ? 5 : planFormTier === 'featured' ? 2 : 1,
      features: ['Placement guarantee', 'Full analytics reporting', 'Live preview validation'],
      isActive: true,
      createdAt: editingPlan ? editingPlan.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setToastMsg({ type: 'success', text: 'Advertising plan saved!' })
    setIsPlanModalOpen(false)
    setEditingPlan(null)
    loadAllData()
  }

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.brandName.toLowerCase().includes(q) ||
        c.productName.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)}>×</button>
        </div>
      )}

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Pending Approvals</span>
          <p className="font-heading font-black text-2xl text-amber-600 mt-1">
            {campaigns.filter((c) => c.status === 'pending_approval').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Active Public Ads</span>
          <p className="font-heading font-black text-2xl text-emerald-600 mt-1">
            {campaigns.filter((c) => c.status === 'active').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Registered Merchants</span>
          <p className="font-heading font-black text-2xl text-blue-600 mt-1">
            {merchants.length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Configured Inventory Slots</span>
          <p className="font-heading font-black text-2xl text-slate-900 mt-1">
            {slots.length}
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
        {[
          { id: 'campaigns', label: 'Campaign Moderation', icon: Layers, count: campaigns.filter((c) => c.status === 'pending_approval').length },
          { id: 'inventory', label: 'Inventory & Slots', icon: Store, count: slots.length },
          { id: 'plans', label: 'Subscription Plans & Pricing', icon: CreditCard, count: plans.length },
          { id: 'merchants', label: 'Merchants & Advertisers', icon: Building2, count: merchants.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isSelected = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: CAMPAIGN MODERATION */}
      {/* ================================================================= */}
      {activeSubTab === 'campaigns' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns, brands, or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Campaign & Brand</th>
                  <th className="py-3 px-4">Placement</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-200">
                          <img src={camp.creativeUrl} alt={camp.name} className="h-full object-contain" />
                        </div>
                        <div>
                          <span className="font-heading font-black text-slate-900 block leading-tight">
                            {camp.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {camp.brandName} • {camp.productName}
                          </span>
                          <a
                            href={camp.destinationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <span>{camp.destinationUrl}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-slate-700 uppercase">
                        {camp.placementId.replace('_', ' ')}
                      </span>
                      {camp.shelf && (
                        <span className="block text-[10px] text-slate-400 capitalize">
                          Shelf: {camp.shelf.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-bold block">{camp.merchant?.businessName || 'Merchant'}</span>
                      <span className="text-[10px] text-slate-400">{camp.merchant?.businessEmail}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          camp.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : camp.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : camp.status === 'paused'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {camp.status.replace('_', ' ')}
                      </span>
                      {camp.rejectionReason && (
                        <span className="block text-[10px] text-rose-600 mt-1 max-w-[180px] truncate" title={camp.rejectionReason}>
                          Reason: {camp.rejectionReason}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {camp.status === 'pending_approval' ? (
                          <>
                            <button
                              onClick={() => handleApprove(camp.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Approve and activate advertisement"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingCampaign(camp)
                                setRejectionReason('')
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Reject with explanation"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : camp.status === 'active' ? (
                          <button
                            onClick={() => adminSetCampaignStatus(camp.id, 'paused')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </button>
                        ) : camp.status === 'paused' ? (
                          <button
                            onClick={() => adminSetCampaignStatus(camp.id, 'active')}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Resume</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(camp.id)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px]"
                          >
                            Re-Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: INVENTORY & SLOTS */}
      {/* ================================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Governed Advertising Inventory Slots
              </h3>
              <p className="text-xs text-slate-500">
                Define and regulate eligible slots, shelf limits, and active status across placements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                  slot.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {slot.placementId.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">ID: {slot.id}</span>
                  </div>

                  <h4 className="font-heading font-black text-sm text-slate-900 mt-2">
                    {slot.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {slot.locationDescription}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                    {slot.shelf && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                        Shelf: {slot.shelf}
                      </span>
                    )}
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                      Capacity: {slot.capacity}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                      Max: {slot.maxFileSizeMb}MB
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase ${
                      slot.isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {slot.isActive ? '● ACTIVE INVENTORY' : '○ DISABLED'}
                  </span>
                  <button
                    onClick={() => handleToggleSlotActive(slot)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {slot.isActive ? 'Disable Slot' : 'Enable Slot'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: SUBSCRIPTION PLANS & PRICING */}
      {/* ================================================================= */}
      {activeSubTab === 'plans' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-base text-slate-900">
                Configured Commercial Plans
              </h3>
              <p className="text-xs text-slate-500">
                Manage commercial rates, billing durations, and included creative capacities.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPlan(null)
                setPlanFormName('')
                setPlanFormPrice(4999)
                setPlanFormDuration(30)
                setIsPlanModalOpen(true)
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {plan.tier}
                    </span>
                    <span className="font-heading font-black text-base text-slate-900">
                      ₹ {(plan.priceInrMinor / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="font-heading font-black text-sm text-slate-900 mt-2">
                    {plan.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {plan.placementId.replace('_', ' ')} • {plan.durationDays} Days
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    ACTIVE OFFERING
                  </span>
                  <button
                    onClick={() => {
                      setEditingPlan(plan)
                      setPlanFormName(plan.name)
                      setPlanFormPlacement(plan.placementId)
                      setPlanFormTier(plan.tier as any)
                      setPlanFormPrice(plan.priceInrMinor / 100)
                      setPlanFormDuration(plan.durationDays)
                      setIsPlanModalOpen(true)
                    }}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Edit Rates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 4: REGISTERED MERCHANTS */}
      {/* ================================================================= */}
      {activeSubTab === 'merchants' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-base text-slate-900">
              Registered Merchant Businesses
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              {merchants.length} Registered Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Business & Contact</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Email / Phone</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Website</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-heading font-black text-slate-900 block">
                        {m.businessName}
                      </span>
                      <span className="text-[11px] text-slate-500">{m.contactPerson}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{m.businessCategory}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="block">{m.businessEmail}</span>
                      <span className="text-[10px] text-slate-400">{m.phoneNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {m.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {m.businessWebsite ? (
                        <a
                          href={m.businessWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECT CAMPAIGN MODAL */}
      {rejectingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
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

            <p className="text-xs text-slate-600 leading-relaxed">
              Please provide feedback explaining why this creative or link cannot be approved so the merchant can correct and resubmit.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason / Guidance
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Destination URL must point to product purchase page without redirect chains..."
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

      {/* ADD / EDIT PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSavePlan}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-black text-base text-slate-900">
                {editingPlan ? 'Configure Advertising Plan' : 'Create Advertising Plan'}
              </h4>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={planFormName}
                onChange={(e) => setPlanFormName(e.target.value)}
                placeholder="e.g. Featured Fridge Eyeline Plan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Placement *</label>
                <select
                  value={planFormPlacement}
                  onChange={(e) => setPlanFormPlacement(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="fridge_magnet">Sponsored Fridge Magnet</option>
                  <option value="magnet_banner">Magnet Details Banner (Legacy)</option>
                  <option value="fridge_product">Fridge Interior Shelf (Legacy)</option>
                  <option value="led_display">Digital LED Screen (Legacy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tier *</label>
                <select
                  value={planFormTier}
                  onChange={(e) => setPlanFormTier(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="standard">Standard</option>
                  <option value="featured">Featured</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={planFormPrice}
                  onChange={(e) => setPlanFormPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days) *</label>
                <input
                  type="number"
                  required
                  min={7}
                  value={planFormDuration}
                  onChange={(e) => setPlanFormDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-xs"
              >
                Save Plan Configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
