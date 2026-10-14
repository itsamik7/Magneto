import React, { useState } from 'react'
import type { DestinationWithMagnet } from '../../types/destination'
import { MagnetGraphic } from '../fridge/MagnetGraphic'
import { Modal } from '../ui/Modal'
import {
  Sparkles,
  MapPin,
  Check,
  Calendar,
  PiggyBank,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { rupeesToPaise } from '../../lib/utils'

interface MagnetPreviewModalProps {
  destination: DestinationWithMagnet | null
  isOpen: boolean
  onClose: () => void
  onAddMagnet: (
    destination: DestinationWithMagnet,
    tripConfig?: {
      createTrip: boolean
      targetBudgetMinor: number
      startDate?: string
      endDate?: string
    }
  ) => Promise<void>
  isAdding?: boolean
  isCollected?: boolean
}

export const MagnetPreviewModal: React.FC<MagnetPreviewModalProps> = ({
  destination,
  isOpen,
  onClose,
  onAddMagnet,
  isAdding = false,
  isCollected = false,
}) => {
  const [wantsSavingsGoal, setWantsSavingsGoal] = useState<boolean>(false)
  const [budgetRupees, setBudgetRupees] = useState<string>('50000')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  if (!destination) return null

  const handleAdd = async () => {
    let tripConfig:
      | {
          createTrip: boolean
          targetBudgetMinor: number
          startDate?: string
          endDate?: string
        }
      | undefined

    if (wantsSavingsGoal) {
      const parsedRupees = parseFloat(budgetRupees) || 50000
      tripConfig = {
        createTrip: true,
        targetBudgetMinor: rupeesToPaise(parsedRupees),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
    }

    await onAddMagnet(destination, tripConfig)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="lg"
    >
      <div className="space-y-6 -mt-4">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={destination.country_name}>
              {destination.flag_emoji || '✈️'}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {destination.continent} • {destination.country_name}
              </span>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#243447]">
                {destination.name}
              </h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Score: {destination.popularity_score}</span>
          </span>
        </div>

        {/* Center Magnet Display on Refrigerator Surface */}
        <div className="relative rounded-2xl fridge-steel-finish p-8 sm:p-10 flex flex-col items-center justify-center border-2 border-slate-300/80 shadow-inner overflow-hidden">
          {/* Subtle Seam & Sheen */}
          <div className="absolute top-[35%] inset-x-0 h-[1px] bg-slate-400/30 border-b border-white/40 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-1/4 transform -skew-x-12" />

          {/* Floating Souvenir Magnet */}
          <div className="relative z-10 py-2">
            <MagnetGraphic
              magnetKey={destination.slug}
              assetUrl={destination.asset_url}
              destinationName={destination.name}
              size="lg"
              isInteractive={false}
              floatVariant={1}
            />
          </div>

          <div className="mt-4 text-center">
            <span className="inline-block px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono font-semibold rounded-full shadow border border-white/20">
              Shape: {destination.magnet_shape.toUpperCase()} • Molded White Die-Cut
            </span>
          </div>
        </div>

        {/* Description & Famous Landmarks */}
        <div className="space-y-4 text-sm text-slate-700">
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
              About This Destination
            </h4>
            <p className="text-slate-800 text-sm leading-relaxed">
              {destination.short_description || 'A world-famous travel landmark and cultural wonder.'}
            </p>
          </div>

          {destination.landmark_names && destination.landmark_names.length > 0 && (
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                Key Landmarks & Highlights
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {destination.landmark_names.map((lm, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium"
                  >
                    {lm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
              {destination.destination_type}
            </span>
            {destination.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Optional: Plan Trip & Savings Goal Option */}
        {!isCollected && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
            <button
              type="button"
              onClick={() => setWantsSavingsGoal(!wantsSavingsGoal)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-[#059669] transition-colors"
            >
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-600" />
                <span>Also track savings for this trip? (Optional)</span>
              </div>
              {wantsSavingsGoal ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {wantsSavingsGoal && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={budgetRupees}
                    onChange={(e) => setBudgetRupees(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target Travel Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
          >
            Close
          </button>

          {isCollected ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-heading font-black text-xs sm:text-sm border border-emerald-300 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Already in Your Fridge</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-heading font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Attaching to Fridge...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Add to My Fridge</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
