import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import type { TripInsert, TripWithStats } from '../types/trip'
import { VirtualFridge } from '../components/fridge/VirtualFridge'
import { AddTripModal } from '../components/trips/AddTripModal'
import { formatINR } from '../lib/utils'
import { MapPin, PiggyBank, Target, Percent, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trips, setTrips] = useState<TripWithStats[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)

  const loadTrips = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await tripService.getUserTrips(user.id)
      setTrips(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load trips'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  const handleCreateTrip = async (newTrip: TripInsert) => {
    await tripService.createTrip(newTrip)
    await loadTrips()
  }

  // Summary Metrics calculations
  const totalTrips = trips.length
  const combinedBudgetMinor = trips.reduce((sum, t) => sum + Number(t.target_budget_minor), 0)
  const totalSavedMinor = trips.reduce((sum, t) => sum + Number(t.total_saved_minor), 0)
  const overallProgressPercentage =
    combinedBudgetMinor > 0
      ? Math.min(100, Math.round((totalSavedMinor / combinedBudgetMinor) * 100))
      : 0

  return (
    <div className="space-y-8 pb-16">
      {/* Dashboard Top Greeting & Summary Metrics Bar */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#243447] tracking-tight">
              My Travel Fridge
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Collect destination souvenirs and track your journey to departure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTrips()}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all"
              title="Refresh Fridge"
              aria-label="Refresh trips"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E98267] hover:bg-[#d96d51] text-white font-heading font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Add Destination</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Failed to load data from Supabase:</p>
              <p className="mt-0.5 text-xs text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => loadTrips()}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Summary Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Planned Trips */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E2DC] shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/60 text-[#3A8D8C] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Planned Trips
              </p>
              <p className="font-heading font-black text-xl sm:text-2xl text-[#243447]">
                {totalTrips}
              </p>
            </div>
          </div>

          {/* 2. Combined Budget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E2DC] shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-[#243447] flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Total Budget
              </p>
              <p className="font-heading font-black text-xl sm:text-2xl text-[#243447] truncate">
                {formatINR(combinedBudgetMinor)}
              </p>
            </div>
          </div>

          {/* 3. Total Amount Saved */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E2DC] shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Total Saved
              </p>
              <p className="font-heading font-black text-xl sm:text-2xl text-emerald-700 truncate">
                {formatINR(totalSavedMinor)}
              </p>
            </div>
          </div>

          {/* 4. Overall Progress */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E2DC] shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-coral/10 border border-coral/30 text-[#E98267] flex items-center justify-center flex-shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Overall Progress
              </p>
              <p className="font-heading font-black text-xl sm:text-2xl text-[#E98267]">
                {overallProgressPercentage}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Virtual Refrigerator Centerpiece */}
      <section>
        <VirtualFridge
          trips={trips}
          isLoading={isLoading}
          onSelectTrip={(trip) => navigate(`/trip/${trip.id}`)}
          onAddDestination={() => setIsAddModalOpen(true)}
        />
      </section>

      {/* Add Destination Modal */}
      {user && (
        <AddTripModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          userId={user.id}
          onSubmitTrip={handleCreateTrip}
        />
      )}
    </div>
  )
}
