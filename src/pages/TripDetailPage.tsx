import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { savingsService } from '../services/savingsService'
import { itineraryService } from '../services/itineraryService'
import { checklistService } from '../services/checklistService'
import type { TripWithStats, TripUpdate } from '../types/trip'
import type { SavingsTransactionInsert, SavingsTransactionRow } from '../types/savings'
import type { ItineraryItemInsert, ItineraryItemRow } from '../types/planning'
import type { ChecklistItemInsert, ChecklistItemRow } from '../types/planning'
import { MagnetGraphic } from '../components/fridge/MagnetGraphic'
import { SavingsTracker } from '../components/savings/SavingsTracker'
import { ItinerarySection } from '../components/planning/ItinerarySection'
import { ChecklistSection } from '../components/planning/ChecklistSection'
import { AddDepositModal } from '../components/savings/AddDepositModal'
import { EditTripModal } from '../components/trips/EditTripModal'
import { formatINR, formatDate } from '../lib/utils'
import {
  ArrowLeft,
  Calendar,
  PiggyBank,
  CheckSquare,
  Edit3,
  Trash2,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<TripWithStats | null>(null)
  const [transactions, setTransactions] = useState<SavingsTransactionRow[]>([])
  const [itineraryItems, setItineraryItems] = useState<ItineraryItemRow[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'savings' | 'itinerary' | 'checklist'>('savings')

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false)

  const loadTripData = useCallback(async () => {
    if (!id || !user) return
    setIsLoading(true)
    setError(null)
    try {
      const tripData = await tripService.getTripById(id, user.id)
      if (!tripData) {
        setError('Trip not found or you do not have permission to view it.')
        setIsLoading(false)
        return
      }
      setTrip(tripData)

      // Fetch child data concurrently
      const [txData, itinData, checkData] = await Promise.all([
        savingsService.getTripTransactions(id, user.id),
        itineraryService.getItineraryItems(id, user.id),
        checklistService.getChecklistItems(id, user.id),
      ])

      setTransactions(txData)
      setItineraryItems(itinData)
      setChecklistItems(checkData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load trip details'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    loadTripData()
  }, [loadTripData])

  // Handlers
  const handleUpdateTrip = async (updates: TripUpdate) => {
    if (!trip || !user) return
    await tripService.updateTrip(trip.id, updates, user.id)
    await loadTripData()
  }

  const handleDeleteTrip = async () => {
    if (!trip || !user) return
    try {
      await tripService.deleteTrip(trip.id, user.id)
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error('Failed to delete trip:', err)
    }
  }

  const handleAddDeposit = async (deposit: SavingsTransactionInsert) => {
    await savingsService.addDeposit(deposit)
    await loadTripData()
  }

  const handleDeleteDeposit = async (txId: string) => {
    if (!user) return
    await savingsService.deleteDeposit(txId, user.id)
    await loadTripData()
  }

  const handleAddItineraryItem = async (item: ItineraryItemInsert) => {
    await itineraryService.createItineraryItem(item)
    if (!id || !user) return
    const updated = await itineraryService.getItineraryItems(id, user.id)
    setItineraryItems(updated)
  }

  const handleDeleteItineraryItem = async (itemId: string) => {
    if (!user || !id) return
    await itineraryService.deleteItineraryItem(itemId, user.id)
    const updated = await itineraryService.getItineraryItems(id, user.id)
    setItineraryItems(updated)
  }

  const handleAddChecklistItem = async (item: ChecklistItemInsert) => {
    await checklistService.createChecklistItem(item)
    if (!id || !user) return
    const updated = await checklistService.getChecklistItems(id, user.id)
    setChecklistItems(updated)
  }

  const handleToggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    if (!user || !id) return
    await checklistService.updateChecklistItem(itemId, { is_completed: isCompleted }, user.id)
    const updated = await checklistService.getChecklistItems(id, user.id)
    setChecklistItems(updated)
  }

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!user || !id) return
    await checklistService.deleteChecklistItem(itemId, user.id)
    const updated = await checklistService.getChecklistItems(id, user.id)
    setChecklistItems(updated)
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 mx-auto text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading destination details...</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
        <h2 className="font-heading font-bold text-xl text-slate-800">Trip not found</h2>
        <p className="text-sm text-slate-600">{error || 'This destination could not be located.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#243447] text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Fridge</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#243447] px-3 py-1.5 rounded-xl hover:bg-slate-200/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Refrigerator</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Destination</span>
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Trip Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm flex flex-col md:flex-row items-center gap-6 sm:gap-10">
        {/* Large Souvenir Magnet Artwork */}
        <div className="flex-shrink-0">
          <MagnetGraphic
            magnetKey={trip.magnet_key}
            destinationName={trip.destination_name}
            state={trip.unlock_state}
            progressPercentage={trip.progress_percentage}
            size="lg"
            isInteractive={false}
          />
        </div>

        {/* Overview Information */}
        <div className="space-y-4 flex-1 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 uppercase tracking-wider bg-slate-100 text-slate-700">
              {trip.unlock_state === 'ready_to_go' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Ready to Go
                </span>
              ) : trip.unlock_state === 'saving' ? (
                <span className="text-teal-700">Saving in Progress</span>
              ) : (
                <span className="text-slate-600">Dreaming</span>
              )}
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#243447] tracking-tight">
              {trip.destination_name}
            </h1>
          </div>

          {/* Dates & Notes */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {trip.start_date || trip.end_date ? (
                <span>
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </span>
              ) : (
                <span>Dates not set</span>
              )}
            </span>
          </div>

          {trip.notes && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              {trip.notes}
            </p>
          )}

          {/* Quick Stats Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Target: </span>
              <strong className="text-slate-900 font-bold">{formatINR(trip.target_budget_minor)}</strong>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs">
              <span className="text-teal-700 font-medium">Saved: </span>
              <strong className="text-teal-900 font-bold">{formatINR(trip.total_saved_minor)}</strong>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-coral/10 border border-coral/30 text-xs">
              <span className="text-[#E98267] font-medium">Remaining: </span>
              <strong className="text-[#243447] font-bold">{formatINR(trip.amount_remaining_minor)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('savings')}
            className={`py-3 px-1 border-b-2 font-heading font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'savings'
                ? 'border-[#3A8D8C] text-[#3A8D8C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>Savings Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('itinerary')}
            className={`py-3 px-1 border-b-2 font-heading font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'itinerary'
                ? 'border-[#3A8D8C] text-[#3A8D8C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Itinerary ({itineraryItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-1 border-b-2 font-heading font-bold text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'checklist'
                ? 'border-[#3A8D8C] text-[#3A8D8C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Preparation Checklist ({checklistItems.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'savings' && (
          <SavingsTracker
            trip={trip}
            transactions={transactions}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onDeleteTransaction={handleDeleteDeposit}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItinerarySection
            tripId={trip.id}
            userId={user?.id || ''}
            items={itineraryItems}
            onAddItem={handleAddItineraryItem}
            onDeleteItem={handleDeleteItineraryItem}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistSection
            tripId={trip.id}
            userId={user?.id || ''}
            items={checklistItems}
            onAddItem={handleAddChecklistItem}
            onToggleItem={handleToggleChecklistItem}
            onDeleteItem={handleDeleteChecklistItem}
          />
        )}
      </div>

      {/* Modals */}
      {user && (
        <>
          <AddDepositModal
            isOpen={isDepositModalOpen}
            onClose={() => setIsDepositModalOpen(false)}
            trip={trip}
            userId={user.id}
            onSubmitDeposit={handleAddDeposit}
          />

          <EditTripModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900">
              Remove Destination?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{trip.destination_name}</strong> from your fridge? All associated savings records, itinerary items, and tasks will be deleted.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Keep Trip
              </button>
              <button
                onClick={handleDeleteTrip}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
