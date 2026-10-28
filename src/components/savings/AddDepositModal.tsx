import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '../ui/Modal'
import { savingsDepositSchema, type SavingsDepositFormData } from '../../lib/validation'
import type { TripWithStats } from '../../types/trip'
import type { SavingsTransactionInsert } from '../../types/savings'
import { formatINR, rupeesToPaise, deriveMagnetState, calculateProgressPercentage, calculateAmountRemaining } from '../../lib/utils'
import { trackMagnetUnlocked } from '../../lib/posthog'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

interface AddDepositModalProps {
  isOpen: boolean
  onClose: () => void
  trip: TripWithStats
  userId: string
  onSubmitDeposit: (deposit: SavingsTransactionInsert) => Promise<void>
}

export const AddDepositModal: React.FC<AddDepositModalProps> = ({
  isOpen,
  onClose,
  trip,
  userId,
  onSubmitDeposit,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SavingsDepositFormData>({
    resolver: zodResolver(savingsDepositSchema),
    defaultValues: {
      amountRupees: 5000,
      note: '',
    },
  })

  const inputAmountRupees = watch('amountRupees') || 0
  const inputAmountPaise = rupeesToPaise(inputAmountRupees)

  // Projected calculations
  const projectedTotalSaved = trip.total_saved_minor + inputAmountPaise
  const projectedRemaining = calculateAmountRemaining(trip.target_budget_minor, projectedTotalSaved)
  const projectedProgress = calculateProgressPercentage(projectedTotalSaved, trip.target_budget_minor)
  const projectedState = deriveMagnetState(projectedTotalSaved, trip.target_budget_minor)

  const willUnlockReady = projectedState === 'ready_to_go' && trip.unlock_state !== 'ready_to_go'

  const onSubmit = async (data: SavingsDepositFormData) => {
    try {
      const amountMinor = rupeesToPaise(data.amountRupees)
      await onSubmitDeposit({
        trip_id: trip.id,
        user_id: userId,
        amount_minor: amountMinor,
        currency: 'INR',
        note: data.note?.trim() || null,
      })
      if (willUnlockReady) {
        trackMagnetUnlocked({
          tripId: trip.id,
          destination: trip.destination_name,
          totalSaved: projectedTotalSaved,
          targetBudget: trip.target_budget_minor,
        })
      }
      reset()
      onClose()
    } catch (err: unknown) {
      console.error('Failed to record deposit:', err)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deposit Savings for ${trip.destination_name}`}
      description="Record a personal savings deposit toward this journey."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Current Status Box */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-500 font-medium">Currently Saved</p>
            <p className="font-heading font-bold text-slate-800 text-sm">{formatINR(trip.total_saved_minor)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-medium">Target Budget</p>
            <p className="font-heading font-bold text-slate-800 text-sm">{formatINR(trip.target_budget_minor)}</p>
          </div>
        </div>

        {/* Deposit Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deposit Amount (₹ INR) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
            <input
              type="number"
              step="100"
              min="1"
              placeholder="5000"
              {...register('amountRupees', { valueAsNumber: true })}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white font-medium"
            />
          </div>
          {errors.amountRupees && (
            <p className="text-xs text-rose-500 mt-1">{errors.amountRupees.message}</p>
          )}
        </div>

        {/* Note / Memo */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deposit Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. October monthly savings, Diwali bonus, freelance gig"
            {...register('note')}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-xs text-slate-900 bg-white"
          />
        </div>

        {/* Live Calculation Preview */}
        {inputAmountRupees > 0 && (
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-teal-900">
              <span>Projected Savings Progress</span>
              <span className="flex items-center gap-1">
                <span>{trip.progress_percentage}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-emerald-700 text-sm">{projectedProgress}%</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${projectedProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1">
              <span>New Total: <strong className="text-slate-900">{formatINR(projectedTotalSaved)}</strong></span>
              <span>Remaining: <strong className="text-slate-900">{formatINR(projectedRemaining)}</strong></span>
            </div>

            {/* Ready to go banner */}
            {willUnlockReady && (
              <div className="mt-2 p-2.5 bg-gradient-to-r from-amber-400/20 to-yellow-300/30 rounded-xl border border-amber-300 flex items-center gap-2 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>🎉 This deposit will fully fund the trip and unlock the Ready to Go state!</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || inputAmountRupees <= 0}
            className="px-6 py-2.5 bg-[#3A8D8C] hover:bg-[#2c6e6d] text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Deposit...' : 'Record Deposit'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
