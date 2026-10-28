import React, { useState, useEffect } from 'react'
import type { AdvertisingPlan, PlanTier } from '../../types/advertising'
import {
  getAdvertisingPlans,
  saveAdvertisingPlan,
  ADVERTISING_UPDATED_EVENT,
} from '../../services/advertisingService'
import { recordAuditLog } from '../../services/adminService'
import {
  Sparkles,
  Plus,
  Edit2,
  Copy,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Archive,
} from 'lucide-react'

interface AdminSubscriptionManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminSubscriptionManagement: React.FC<AdminSubscriptionManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [plans, setPlans] = useState<AdvertisingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Plan creation / edit modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdvertisingPlan | null>(null)
  const [name, setName] = useState('')
  const [tier, setTier] = useState<PlanTier>('standard')
  const [priceInr, setPriceInr] = useState<number>(2999)
  const [durationDays, setDurationDays] = useState<number>(30)
  const [creativeSlots, setCreativeSlots] = useState<number>(1)
  const [features, setFeatures] = useState<string>(
    'Virtual Fridge Door Magnet, 30 Days Continuous Placement, Direct Destination URL CTA, Real-Time Clicks Tracking'
  )
  const [isActive, setIsActive] = useState<boolean>(true)
  const [priorityWeight, setPriorityWeight] = useState<number>(2)

  // Pricing Safeguard Policy
  const [pricingPolicy, setPricingPolicy] = useState<'new_only' | 'renewal' | 'immediate'>('new_only')

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadPlans = async () => {
    try {
      // Load all magnet plans
      const pList = await getAdvertisingPlans('fridge_magnet')
      setPlans(pList)
    } catch (e: any) {
      console.error('Error loading plans:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
    const handleUpdate = () => loadPlans()
    window.addEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(ADVERTISING_UPDATED_EVENT, handleUpdate)
  }, [])

  // Open Create Plan
  const openCreatePlan = () => {
    setEditingPlan(null)
    setName('')
    setTier('standard')
    setPriceInr(2999)
    setDurationDays(30)
    setCreativeSlots(1)
    setFeatures(
      'Virtual Fridge Door Magnet, 30 Days Continuous Placement, Direct Destination URL CTA, Real-Time Clicks Tracking, Sponsored Badge'
    )
    setIsActive(true)
    setPriorityWeight(1)
    setPricingPolicy('new_only')
    setIsPlanModalOpen(true)
  }

  // Open Edit Plan
  const openEditPlan = (plan: AdvertisingPlan) => {
    setEditingPlan(plan)
    setName(plan.name)
    setTier(plan.tier)
    setPriceInr(Math.round(plan.priceInrMinor / 100))
    setDurationDays(plan.durationDays)
    setCreativeSlots(plan.creativeSlots)
    setFeatures(plan.features.join(', '))
    setIsActive(plan.isActive)
    setPriorityWeight(plan.priorityWeight || 1)
    setPricingPolicy(plan.priceSafeguardPolicy || 'new_only')
    setIsPlanModalOpen(true)
  }

  // Duplicate Plan
  const handleDuplicatePlan = async (plan: AdvertisingPlan) => {
    try {
      const duplicated: AdvertisingPlan = {
        ...plan,
        id: `plan_magnet_${Date.now()}`,
        name: `${plan.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await saveAdvertisingPlan(duplicated)
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: 'DUPLICATE_PLAN',
        entityType: 'subscription_plan',
        entityId: duplicated.id,
        details: { duplicatedFrom: plan.id, newPlanId: duplicated.id },
      })
      setToast({ type: 'success', text: `Plan duplicated as "${duplicated.name}".` })
      loadPlans()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Save or Update Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setToast({ type: 'error', text: 'Plan name is required.' })
      return
    }

    try {
      const planId = editingPlan ? editingPlan.id : `plan_magnet_${Date.now()}`
      const splitFeatures = features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)

      const updatedPlan: AdvertisingPlan = {
        id: planId,
        name: name.trim(),
        placementId: 'fridge_magnet',
        tier,
        priceInrMinor: Math.round(priceInr * 100),
        billingCurrency: 'INR',
        durationDays: Number(durationDays),
        creativeSlots: Number(creativeSlots),
        inventoryCapacity: 1,
        billingInterval: 'one_time',
        supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
        maxFileSizeMb: 15,
        priorityWeight: Number(priorityWeight),
        features: splitFeatures,
        isActive,
        isArchived: false,
        priceSafeguardPolicy: pricingPolicy,
        createdAt: editingPlan ? editingPlan.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveAdvertisingPlan(updatedPlan)
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: editingPlan ? 'UPDATE_PLAN' : 'CREATE_PLAN',
        entityType: 'subscription_plan',
        entityId: planId,
        details: {
          planId,
          name,
          priceInr,
          durationDays,
          pricingPolicy,
          previousPriceInr: editingPlan ? Math.round(editingPlan.priceInrMinor / 100) : null,
        },
      })

      setToast({
        type: 'success',
        text: `Magnet plan "${name}" successfully ${editingPlan ? 'updated' : 'created'}.`,
      })
      setIsPlanModalOpen(false)
      loadPlans()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to save plan.' })
    }
  }

  // Quick Toggle Active State
  const handleToggleActive = async (plan: AdvertisingPlan) => {
    try {
      const nextActive = !plan.isActive
      await saveAdvertisingPlan({
        ...plan,
        isActive: nextActive,
        updatedAt: new Date().toISOString(),
      })
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: 'TOGGLE_PLAN_ACTIVE',
        entityType: 'subscription_plan',
        entityId: plan.id,
        details: { planId: plan.id, isActive: nextActive },
      })
      setToast({
        type: 'success',
        text: `Plan "${plan.name}" is now ${nextActive ? 'ACTIVE' : 'DEACTIVATED'}.`,
      })
      loadPlans()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            Magnet Advertising Plans & Pricing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure subscription tiers, durations, INR pricing, and grandfathered renewal policies for virtual fridge magnets.
          </p>
        </div>

        <button
          onClick={openCreatePlan}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Magnet Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          return (
            <div
              key={plan.id}
              className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                plan.isActive
                  ? 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md'
                  : 'bg-slate-50 border-dashed border-slate-300 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {plan.tier}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
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
                  Includes: {plan.creativeSlots} magnet placement(s)
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {plan.priceSafeguardPolicy && (
                  <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-medium">
                    Policy: <strong className="text-slate-700 capitalize">{plan.priceSafeguardPolicy.replace('_', ' ')}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditPlan(plan)}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDuplicatePlan(plan)}
                  className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                  title="Duplicate Plan"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleToggleActive(plan)}
                  className={`p-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    plan.isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={plan.isActive ? 'Deactivate' : 'Activate'}
                >
                  {plan.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Plan Edit / Create Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-heading font-black text-sm">
                {editingPlan ? 'Edit Magnet Advertising Plan' : 'Create New Magnet Advertising Plan'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Magnet Placement (30 Days)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plan Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as PlanTier)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white capitalize"
                  >
                    <option value="standard">Standard</option>
                    <option value="featured">Featured</option>
                    <option value="premium">Premium</option>
                    <option value="exclusive">Exclusive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Magnet Slots</label>
                  <input
                    type="number"
                    min={1}
                    value={creativeSlots}
                    onChange={(e) => setCreativeSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Features (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Virtual Fridge Door Magnet, Direct Click CTA, Real-Time Analytics"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pricing Safeguard Policy
                </label>
                <select
                  value={pricingPolicy}
                  onChange={(e) => setPricingPolicy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="new_only">New Subscriptions Only (Grandfather existing merchants)</option>
                  <option value="renewal">Apply at Next Renewal</option>
                  <option value="immediate">Immediate Adjustment</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">Active and visible to merchants</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black rounded-xl shadow-xs cursor-pointer"
                >
                  Save Magnet Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
