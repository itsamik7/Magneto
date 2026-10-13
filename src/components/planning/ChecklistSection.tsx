import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checklistSchema, type ChecklistFormData } from '../../lib/validation'
import type { ChecklistItemInsert, ChecklistItemRow } from '../../types/planning'
import { Plus, Trash2, CheckCircle2, Circle, Calendar, CheckSquare } from 'lucide-react'
import { formatDate } from '../../lib/utils'

interface ChecklistSectionProps {
  tripId: string
  userId: string
  items: ChecklistItemRow[]
  onAddItem: (item: ChecklistItemInsert) => Promise<void>
  onToggleItem: (itemId: string, isCompleted: boolean) => Promise<void>
  onDeleteItem: (itemId: string) => Promise<void>
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  tripId,
  userId,
  items,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      title: '',
      dueDate: '',
    },
  })

  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const onSubmit = async (data: ChecklistFormData) => {
    try {
      await onAddItem({
        trip_id: tripId,
        user_id: userId,
        title: data.title.trim(),
        due_date: data.dueDate || null,
        is_completed: false,
      })
      reset()
      setShowAddForm(false)
    } catch (err: unknown) {
      console.error('Failed to add checklist task:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-800">
            Preparation Checklist
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Passport, visas, packing, flight tickets, and travel insurance.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#243447] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Task Completion Progress Meter */}
      {totalCount > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Checklist Progress</span>
            <span className="font-semibold text-teal-700">
              {completedCount} of {totalCount} completed ({completionPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700">
              New Preparation Task
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Apply for tourist visa, pack travel adapter"
              {...register('title')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-xs text-slate-900"
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Due Date (Optional)
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
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
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      {items.length === 0 ? (
        <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-slate-300">
          <CheckSquare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-700">No checklist tasks added yet.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Add packing reminders, visa requirements, and pre-departure tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                item.is_completed
                  ? 'bg-slate-50/70 border-slate-200/60 opacity-80'
                  : 'bg-white border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleItem(item.id, !item.is_completed)}
                  className="flex-shrink-0 text-slate-400 hover:text-teal-600 transition-colors focus:outline-none"
                  aria-label={item.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-teal-500" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      item.is_completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.due_date && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due: {formatDate(item.due_date)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteItem(item.id)}
                className="opacity-50 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                title="Delete Task"
                aria-label={`Delete task ${item.title}`}
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
