import React, { useState, useEffect } from 'react'
import type { AdvertisingPlacement, AdvertisingSlot } from '../../types/advertising'
import {
  getAdvertisingPlacements,
  getAdvertisingSlots,
  saveAdvertisingSlot,
  getAllCampaigns,
  ADVERTISING_UPDATED_EVENT,
} from '../../services/advertisingService'
import {
  getPlatformSettings,
  togglePlacementStatus,
  recordAuditLog,
} from '../../services/adminService'
import {
  Sparkles,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Layers,
  MapPin,
  Lock,
} from 'lucide-react'

interface AdminPlacementManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminPlacementManagement: React.FC<AdminPlacementManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [slots, setSlots] = useState<AdvertisingSlot[]>([])
  const [disabledPlacements, setDisabledPlacements] = useState<string[]>([])
  const [activeCampaignsCountBySlot, setActiveCampaignsCountBySlot] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Edit or Add Slot Modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<AdvertisingSlot | null>(null)
  const [slotId, setSlotId] = useState('')
  const [slotName, setSlotName] = useState('')
  const [slotLocationDesc, setSlotLocationDesc] = useState('')
  const [slotPosX, setSlotPosX] = useState<number>(72)
  const [slotPosY, setSlotPosY] = useState<number>(22)
  const [slotScale, setSlotScale] = useState<number>(1.05)
  const [slotFormat, setSlotFormat] = useState<'standard' | 'showcase' | 'horizontal' | 'compact'>('standard')
  const [slotCapacity, setSlotCapacity] = useState<number>(1)
  const [slotIsExclusive, setSlotIsExclusive] = useState<boolean>(true)
  const [slotIsActive, setSlotIsActive] = useState<boolean>(true)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const [sList, settings, campaigns] = await Promise.all([
        getAdvertisingSlots('fridge_magnet'),
        getPlatformSettings(),
        getAllCampaigns(),
      ])

      setSlots(sList)
      setDisabledPlacements(settings.disabledPlacements || [])

      // Calculate active occupation per slot
      const counts: Record<string, number> = {}
      const now = Date.now()
      campaigns.forEach((c) => {
        if (c.status === 'active' && c.slotId) {
          const start = new Date(c.startDate).getTime()
          const end = new Date(c.endDate).getTime()
          if (now >= start && now <= end) {
            counts[c.slotId] = (counts[c.slotId] || 0) + 1
          }
        }
      })
      setActiveCampaignsCountBySlot(counts)
    } catch (e: any) {
      console.error('Error loading placement data:', e)
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

  const isMagnetPlacementDisabled = disabledPlacements.includes('fridge_magnet')

  // Toggle Entire Magnet Placement Platform-Wide
  const handleToggleMagnetPlacement = async () => {
    const nextActive = isMagnetPlacementDisabled
    try {
      await togglePlacementStatus(
        'fridge_magnet',
        nextActive,
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setToast({
        type: 'success',
        text: `Virtual Fridge Magnet Placement is now ${nextActive ? 'ACTIVE' : 'DISABLED PLATFORM-WIDE'}.`,
      })
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  const handleOpenAddSlot = () => {
    setEditingSlot(null)
    setSlotId(`slot_magnet_door_${Date.now()}`)
    setSlotName('')
    setSlotLocationDesc('')
    setSlotPosX(50)
    setSlotPosY(50)
    setSlotScale(1.0)
    setSlotFormat('standard')
    setSlotCapacity(1)
    setSlotIsExclusive(true)
    setSlotIsActive(true)
    setIsSlotModalOpen(true)
  }

  const handleOpenEditSlot = (slot: AdvertisingSlot) => {
    setEditingSlot(slot)
    setSlotId(slot.id)
    setSlotName(slot.name)
    setSlotLocationDesc(slot.locationDescription || '')
    setSlotPosX(slot.defaultPositionX ?? 50)
    setSlotPosY(slot.defaultPositionY ?? 50)
    setSlotScale(slot.defaultDisplayScale ?? 1.0)
    setSlotFormat(slot.magnetFormat || 'standard')
    setSlotCapacity(slot.capacity || 1)
    setSlotIsExclusive(slot.isExclusive ?? true)
    setSlotIsActive(slot.isActive)
    setIsSlotModalOpen(true)
  }

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotName.trim()) {
      setToast({ type: 'error', text: 'Slot name is required.' })
      return
    }

    try {
      const updatedSlot: AdvertisingSlot = {
        id: slotId,
        name: slotName.trim(),
        placementId: 'fridge_magnet',
        locationDescription: slotLocationDesc.trim(),
        defaultPositionX: Number(slotPosX),
        defaultPositionY: Number(slotPosY),
        defaultDisplayScale: Number(slotScale),
        magnetFormat: slotFormat,
        capacity: Number(slotCapacity),
        supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
        maxFileSizeMb: 10,
        isExclusive: slotIsExclusive,
        isActive: slotIsActive,
        displayOrder: editingSlot ? editingSlot.displayOrder : slots.length + 1,
        createdAt: editingSlot ? editingSlot.createdAt : new Date().toISOString(),
      }

      await saveAdvertisingSlot(updatedSlot)
      await recordAuditLog({
        actorEmail: currentAdminEmail,
        actorRole: currentAdminRole,
        action: editingSlot ? 'UPDATE_SLOT' : 'CREATE_SLOT',
        entityType: 'placement',
        entityId: slotId,
        details: {
          slotId,
          name: slotName,
          coordinates: { x: slotPosX, y: slotPosY, scale: slotScale },
          isExclusive: slotIsExclusive,
        },
      })

      setToast({
        type: 'success',
        text: `Door slot "${slotName}" saved successfully.`,
      })
      setIsSlotModalOpen(false)
      loadData()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to save door slot.' })
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            Virtual Fridge Magnet Placements & Door Slots
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Govern virtual refrigerator surface slots, exclusive booking rules, coordinate percentages, and platform-wide availability.
          </p>
        </div>

        <button
          onClick={handleOpenAddSlot}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Door Slot</span>
        </button>
      </div>

      {/* Global Placement Enable/Disable Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-base text-slate-900">
                Virtual Fridge Magnet Placements
              </h3>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                  !isMagnetPlacementDisabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {!isMagnetPlacementDisabled ? 'Active Everywhere' : 'Disabled Platform-Wide'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Controls sponsored magnet delivery across all user virtual refrigerators. If disabled, all sponsored magnets immediately disappear from user screens.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleMagnetPlacement}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex-shrink-0 ${
            !isMagnetPlacementDisabled
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
          }`}
        >
          {!isMagnetPlacementDisabled ? 'Disable Magnet Advertising' : 'Enable Magnet Advertising'}
        </button>
      </div>

      {/* Fridge Door Slots Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 font-heading font-black text-sm text-slate-900 flex items-center justify-between">
          <span>Configured Door Magnet Slots ({slots.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Enforces conflict-free placement on static refrigerator door
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Slot Details</th>
                <th className="py-3 px-4">Coordinates (X / Y)</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Rule & Conflict</th>
                <th className="py-3 px-4">Current Occupancy</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot) => {
                const activeOccupants = activeCampaignsCountBySlot[slot.id] || 0
                return (
                  <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-heading font-black text-slate-900 block text-xs">
                          {slot.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {slot.id}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">
                          {slot.locationDescription}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="text-blue-600 font-bold">X: {slot.defaultPositionX}%</span>
                      <span className="text-slate-400"> • </span>
                      <span className="text-indigo-600 font-bold">Y: {slot.defaultPositionY}%</span>
                      <span className="block text-[10px] text-slate-400">
                        Scale: {slot.defaultDisplayScale || 1.0}x
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold uppercase">
                        {slot.magnetFormat || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {slot.isExclusive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <Lock className="w-3 h-3" />
                          <span>Exclusive (Conflict Guarded)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          Shared ({slot.capacity} capacity)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono text-xs font-bold ${
                          activeOccupants > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {activeOccupants} live ad(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          slot.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditSlot(slot)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit or Add Door Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-heading font-black text-sm">
                {editingSlot ? 'Edit Virtual Fridge Door Slot' : 'Create New Door Slot'}
              </h3>
              <button onClick={() => setIsSlotModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slot Name *</label>
                <input
                  type="text"
                  required
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  placeholder="e.g. Door Top Right — Prime Eye Level"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Description</label>
                <textarea
                  rows={2}
                  value={slotLocationDesc}
                  onChange={(e) => setSlotLocationDesc(e.target.value)}
                  placeholder="Describe where on the refrigerator door this slot sits..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position X (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={slotPosX}
                    onChange={(e) => setSlotPosX(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position Y (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={slotPosY}
                    onChange={(e) => setSlotPosY(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Scale</label>
                  <input
                    type="number"
                    step="0.05"
                    min={0.5}
                    max={2.0}
                    value={slotScale}
                    onChange={(e) => setSlotScale(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Magnet Format</label>
                  <select
                    value={slotFormat}
                    onChange={(e) => setSlotFormat(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="standard">Standard Badge (Square)</option>
                    <option value="showcase">Showcase Centerpiece</option>
                    <option value="horizontal">Horizontal Banner Badge</option>
                    <option value="compact">Compact Magnet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Concurrent Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={slotCapacity}
                    onChange={(e) => setSlotCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={slotIsExclusive}
                    onChange={(e) => setSlotIsExclusive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">
                    Exclusive Slot (Reject overlapping campaign bookings)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={slotIsActive}
                    onChange={(e) => setSlotIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">Active & Available for Booking</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black rounded-xl shadow-xs cursor-pointer"
                >
                  Save Door Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
