import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '../ui/Modal'
import { tripSchema, type TripFormData } from '../../lib/validation'
import { BUILT_IN_MAGNETS, type MagnetKey, type TripInsert } from '../../types/trip'
import { rupeesToPaise } from '../../lib/utils'
import { MagnetGraphic } from '../fridge/MagnetGraphic'
import { Calendar, AlertCircle } from 'lucide-react'

interface AddTripModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSubmitTrip: (trip: TripInsert) => Promise<void>
}

export const AddTripModal: React.FC<AddTripModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSubmitTrip,
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
      destinationName: '',
      magnetKey: 'paris',
      targetBudgetRupees: 50000,
      startDate: '',
      endDate: '',
      notes: '',
    },
  })

  const selectedMagnet = watch('magnetKey')
  const currentDestination = watch('destinationName')

  const onSubmit = async (data: TripFormData) => {
    try {
      const targetBudgetMinor = rupeesToPaise(data.targetBudgetRupees)
      await onSubmitTrip({
        user_id: userId,
        destination_name: data.destinationName.trim(),
        magnet_key: data.magnetKey,
        target_budget_minor: targetBudgetMinor,
        currency: 'INR',
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        notes: data.notes?.trim() || null,
      })
      reset()
      onClose()
    } catch (err: unknown) {
      console.error('Failed to submit trip:', err)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Destination to Fridge"
      description="Pick a souvenir magnet design and set your travel savings target."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Magnet Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Souvenir Magnet Artwork
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
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
                      state="dreaming"
                      size="sm"
                      isInteractive={false}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-1 line-clamp-1">{mag.destination}</span>
                </button>
              )
            })}
          </div>
          {errors.magnetKey && (
            <p className="text-xs text-rose-500 mt-1">{errors.magnetKey.message}</p>
          )}
        </div>

        {/* Destination Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            2. Destination Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Kyoto, Japan or Paris, France"
            {...register('destinationName')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] focus:border-transparent text-sm text-slate-900 bg-white"
          />
          {errors.destinationName && (
            <p className="text-xs text-rose-500 mt-1">{errors.destinationName.message}</p>
          )}
        </div>

        {/* Target Budget in INR */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            3. Target Trip Budget (₹ INR) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
            <input
              type="number"
              step="500"
              min="1"
              placeholder="50000"
              {...register('targetBudgetRupees', { valueAsNumber: true })}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] focus:border-transparent text-sm text-slate-900 bg-white font-medium"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Stored accurately in Paise (minor units) to ensure reliable math.
          </p>
          {errors.targetBudgetRupees && (
            <p className="text-xs text-rose-500 mt-1">{errors.targetBudgetRupees.message}</p>
          )}
        </div>

        {/* Optional Travel Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Start Date (Optional)</span>
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
              <span>End Date (Optional)</span>
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

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Trip Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Cherry blossom season with friends, visit Shinjuku & Fushimi Inari"
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
            className="px-6 py-2.5 bg-[#E98267] hover:bg-[#d96d51] text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Sticking to Fridge...' : 'Stick to Fridge'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
