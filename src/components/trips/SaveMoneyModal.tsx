import React, { useState } from 'react'
import { X, PiggyBank, Check, Sparkles, TrendingUp, Calendar } from 'lucide-react'

interface SaveMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  destinationName: string
  totalBudgetMinor: number
  totalSavedMinor: number
  daysRemaining: number
  onSaveAmount: (amountMinor: number, note?: string) => void
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export const SaveMoneyModal: React.FC<SaveMoneyModalProps> = ({
  isOpen,
  onClose,
  destinationName,
  totalBudgetMinor,
  totalSavedMinor,
  daysRemaining,
  onSaveAmount,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(500)
  const [customAmount, setCustomAmount] = useState<string>('500')
  const [note, setNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const depositMinor = (Number(customAmount) || 0) * 100
  const projectedSavedMinor = totalSavedMinor + depositMinor
  const projectedRemainingMinor = Math.max(0, totalBudgetMinor - projectedSavedMinor)
  const validDays = Math.max(1, daysRemaining)
  const projectedDailyTarget = Math.ceil(projectedRemainingMinor / 100 / validDays)

  const handleSelectPreset = (amount: number) => {
    setSelectedPreset(amount)
    setCustomAmount(amount.toString())
  }

  const handleCustomChange = (val: string) => {
    const num = val.replace(/[^0-9]/g, '')
    setCustomAmount(num)
    setSelectedPreset(Number(num))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (depositMinor <= 0) return

    setIsSubmitting(true)
    setTimeout(() => {
      onSaveAmount(depositMinor, note)
      setIsSubmitting(false)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 700)
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg">Save for {destinationName}</h3>
              <p className="text-xs text-blue-100 font-medium">1-Click Daily Contribution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2 text-xs font-heading font-black rounded-xl border transition-all ${
                    selectedPreset === amt && customAmount === amt.toString()
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deposit Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-heading font-black text-lg">
                ₹
              </span>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="500"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-heading font-black text-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Savings Memo / Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Skipped takeout, freelance earnings"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Projection Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>New Total Saved:</span>
              </span>
              <span className="font-heading font-bold text-slate-900">
                ₹{(projectedSavedMinor / 100).toLocaleString('en-IN')} of ₹{(totalBudgetMinor / 100).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recalculated Daily Target:</span>
              </span>
              <span className="font-heading font-black text-emerald-600">
                ₹{projectedDailyTarget.toLocaleString('en-IN')} / day
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={depositMinor <= 0 || isSubmitting}
              className="flex-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-heading font-black text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1.5"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved Successfully!</span>
                </>
              ) : isSubmitting ? (
                <span>Adding to Savings...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save ₹{(depositMinor / 100).toLocaleString('en-IN')} Today</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
