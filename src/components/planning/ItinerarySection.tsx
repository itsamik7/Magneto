import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { itinerarySchema, type ItineraryFormData } from '../../lib/validation'
import type { ItineraryItemInsert, ItineraryItemRow } from '../../types/planning'
import { Plus, Trash2, Calendar, Clock, FileText } from 'lucide-react'
import { formatDate } from '../../lib/utils'

interface ItinerarySectionProps {
  tripId: string
  userId: string
  items: ItineraryItemRow[]
  onAddItem: (item: ItineraryItemInsert) => Promise<void>
  onDeleteItem: (itemId: string) => Promise<void>
}

export const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  tripId,
  userId,
  items,
  onAddItem,
  onDeleteItem,
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItineraryFormData>({
    resolver: zodResolver(itinerarySchema),
    defaultValues: {
      title: '',
      activityDate: '',
      tripDay: null,
      activityTime: '',
      notes: '',
    },
  })

  const onSubmit = async (data: ItineraryFormData) => {
    try {
      await onAddItem({
        trip_id: tripId,
        user_id: userId,
        title: data.title.trim(),
        activity_date: data.activityDate || null,
        trip_day: data.tripDay ? Number(data.tripDay) : null,
        activity_time: data.activityTime || null,
        notes: data.notes?.trim() || null,
      })
      reset()
      setShowAddForm(false)
    } catch (err: unknown) {
      console.error('Failed to add itinerary item:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-800">
            Trip Itinerary & Activities
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Schedule sights to see, restaurant bookings, and day plans.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#243447] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700">
              New Itinerary Activity
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Activity Title *</label>
            <input
              type="text"
              placeholder="e.g. Visit Senso-ji Temple & Asakusa street food"
              {...register('title')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-xs text-slate-900"
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Date (Optional)
              </label>
              <input
                type="date"
                {...register('activityDate')}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <span>Trip Day #</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Day 1"
                {...register('tripDay', { valueAsNumber: true })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Time (Optional)
              </label>
              <input
                type="time"
                {...register('activityTime')}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Subway line Ginza station, buy ticket in advance"
              {...register('notes')}
              className="w-full px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#3A8D8C] hover:bg-[#2c6e6d] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      )}

      {/* Item List */}
      {items.length === 0 ? (
        <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-300">
          <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-700">No itinerary activities planned yet.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Add landmarks, day-by-day tours, and reservations.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-all flex items-start justify-between gap-4 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.trip_day && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase">
                      Day {item.trip_day}
                    </span>
                  )}
                  {item.activity_date && (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(item.activity_date)}
                    </span>
                  )}
                  {item.activity_time && (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.activity_time.slice(0, 5)}
                    </span>
                  )}
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-800">
                  {item.title}
                </h4>
                {item.notes && (
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    {item.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => onDeleteItem(item.id)}
                className="opacity-60 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                title="Delete Activity"
                aria-label={`Delete ${item.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
