import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '../ui/Modal'
import { tripSchema, type TripFormData } from '../../lib/validation'
import { BUILT_IN_MAGNETS, type MagnetKey, type TripUpdate, type TripWithStats } from '../../types/trip'
import { paiseToRupees, rupeesToPaise } from '../../lib/utils'
import { MagnetGraphic } from '../fridge/MagnetGraphic'
import { Calendar, AlertCircle } from 'lucide-react'

interface EditTripModalProps {
  isOpen: boolean
  onClose: () => void
  trip: TripWithStats
  onUpdateTrip: (updates: TripUpdate) => Promise<void>
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdateTrip,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      destinationName: trip.destination_name,
      magnetKey: (trip.magnet_key as MagnetKey) || 'paris',
      targetBudgetRupees: paiseToRupees(trip.target_budget_minor),
      startDate: trip.start_date || '',
      endDate: trip.end_date || '',
      notes: trip.notes || '',
    },
  })

  useEffect(() => {
    if (trip) {
      reset({
        destinationName: trip.destination_name,
        magnetKey: (trip.magnet_key as MagnetKey) || 'paris',
        targetBudgetRupees: paiseToRupees(trip.target_budget_minor),
        startDate: trip.start_date || '',
        endDate: trip.end_date || '',
        notes: trip.notes || '',
      })
    }
  }, [trip, reset])

  const selectedMagnet = watch('magnetKey')

  const onSubmit = async (data: TripFormData) => {
    try {
      const targetBudgetMinor = rupeesToPaise(data.targetBudgetRupees)
      await onUpdateTrip({
        destination_name: data.destinationName.trim(),
        magnet_key: data.magnetKey,
        target_budget_minor: targetBudgetMinor,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        notes: data.notes?.trim() || null,
      })
      onClose()
    } catch (err: unknown) {
      console.error('Failed to update trip:', err)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trip Details"
      description="Update your destination name, budget, dates, or magnet design."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Magnet Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Souvenir Magnet Design
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {BUILT_IN_MAGNETS.map((mag) => {
              const isSelected = selectedMagnet === mag.key
              return (
                <button
                  type="button"
                  key={mag.key}
                  onClick={() => setValue('magnetKey', mag.key as MagnetKey)}
                  className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-[#3A8D8C] bg-teal-50/50 shadow-md ring-2 ring-teal-500/30 scale-105'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="w-12 h-14">
                    <MagnetGraphic
                      magnetKey={mag.key}
                      destinationName={mag.destination}
                      state={trip.unlock_state}
                      size="sm"
                      isInteractive={false}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-1 line-clamp-1">{mag.destination}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Destination Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Destination Name *
          </label>
          <input
            type="text"
            {...register('destinationName')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
          />
          {errors.destinationName && (
            <p className="text-xs text-rose-500 mt-1">{errors.destinationName.message}</p>
          )}
        </div>

        {/* Target Budget */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Target Trip Budget (₹ INR) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
            <input
              type="number"
              step="500"
              min="1"
              {...register('targetBudgetRupees', { valueAsNumber: true })}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white font-medium"
            />
          </div>
          {errors.targetBudgetRupees && (
            <p className="text-xs text-rose-500 mt-1">{errors.targetBudgetRupees.message}</p>
          )}
        </div>

        {/* Travel Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-xs text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-xs text-slate-900 bg-white"
            />
          </div>
        </div>
        {errors.endDate && (
          <p className="text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.endDate.message}</span>
          </p>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Trip Notes
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-xs text-slate-900 bg-white"
          />
        </div>

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
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#243447] hover:bg-slate-800 text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
