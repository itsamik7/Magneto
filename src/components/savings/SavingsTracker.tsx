import React from 'react'
import type { TripWithStats } from '../../types/trip'
import type { SavingsTransactionRow } from '../../types/savings'
import { formatINR, formatDate } from '../../lib/utils'
import { Plus, PiggyBank, History, Trash2, Sparkles, TrendingUp } from 'lucide-react'

interface SavingsTrackerProps {
  trip: TripWithStats
  transactions: SavingsTransactionRow[]
  onOpenDepositModal: () => void
  onDeleteTransaction: (transactionId: string) => Promise<void>
}

export const SavingsTracker: React.FC<SavingsTrackerProps> = ({
  trip,
  transactions,
  onOpenDepositModal,
  onDeleteTransaction,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-teal-600" />
            <span>Savings Tracker</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Stored in integer Paise for mathematical precision (INR).
          </p>
        </div>
        <button
          onClick={onOpenDepositModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3A8D8C] hover:bg-[#2c6e6d] text-white font-heading font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Deposit</span>
        </button>
      </div>

      {/* Progress Cards Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saved */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Saved</p>
          <p className="font-heading font-black text-2xl text-teal-700">
            {formatINR(trip.total_saved_minor)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{trip.deposit_count} deposits recorded</span>
          </p>
        </div>

        {/* Target Budget */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Budget</p>
          <p className="font-heading font-black text-2xl text-slate-900">
            {formatINR(trip.target_budget_minor)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Goal set for this destination
          </p>
        </div>

        {/* Remaining Amount */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining to Save</p>
          <p className="font-heading font-black text-2xl text-[#E98267]">
            {formatINR(trip.amount_remaining_minor)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {trip.total_saved_minor >= trip.target_budget_minor ? 'Fully funded! 🎉' : 'Until trip is fully funded'}
          </p>
        </div>
      </div>

      {/* Visual Progress Bar Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-heading font-bold text-slate-700">Savings Progress</span>
          <span className="font-heading font-black text-base text-teal-700">
            {trip.progress_percentage}%
          </span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              trip.unlock_state === 'ready_to_go'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
            style={{ width: `${trip.progress_percentage}%` }}
          />
        </div>
        {trip.unlock_state === 'ready_to_go' && (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Target achieved! The virtual magnet is in &quot;Ready to Go&quot; state. Pack your bags!</span>
          </div>
        )}
      </div>

      {/* Savings Deposit History Ledger */}
      <div className="space-y-3">
        <h4 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          <span>Deposit History</span>
        </h4>

        {transactions.length === 0 ? (
          <div className="p-6 text-center bg-white/60 rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs font-bold text-slate-700">No savings deposits recorded yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Click &quot;Record Deposit&quot; to make your first contribution.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-slate-900">
                      +{formatINR(tx.amount_minor)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(tx.created_at)}
                    </span>
                  </div>
                  {tx.note && (
                    <p className="text-xs text-slate-600 mt-0.5">{tx.note}</p>
                  )}
                </div>

                <button
                  onClick={() => onDeleteTransaction(tx.id)}
                  className="opacity-40 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                  title="Delete Deposit"
                  aria-label="Delete deposit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
