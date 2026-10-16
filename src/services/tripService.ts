import { supabase, checkSupabaseReady } from '../lib/supabase'
import type { TripInsert, TripRow, TripUpdate, TripWithStats } from '../types/trip'
import { deriveMagnetState, calculateAmountRemaining, calculateProgressPercentage } from '../lib/utils'

export const tripService = {
  /**
   * Fetch all trips for the authenticated user, aggregated with their savings stats.
   */
  async getUserTrips(userId: string): Promise<TripWithStats[]> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    // 1. Fetch user trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (tripsError) {
      console.error('Error fetching trips:', tripsError)
      throw new Error(tripsError.message)
    }

    if (!trips || trips.length === 0) return []

    // 2. Fetch all savings transactions for these trips
    const tripIds = trips.map((t) => t.id)
    const { data: transactions, error: txError } = await supabase
      .from('savings_transactions')
      .select('trip_id, amount_minor')
      .in('trip_id', tripIds)
      .eq('user_id', userId)

    if (txError) {
      console.error('Error fetching transactions:', txError)
      throw new Error(txError.message)
    }

    // 3. Aggregate totals per trip
    const savingsMap = new Map<string, { total: number; count: number }>()
    transactions?.forEach((tx) => {
      const current = savingsMap.get(tx.trip_id) || { total: 0, count: 0 }
      savingsMap.set(tx.trip_id, {
        total: current.total + Number(tx.amount_minor),
        count: current.count + 1,
      })
    })

    return trips.map((trip) => {
      const stats = savingsMap.get(trip.id) || { total: 0, count: 0 }
      const totalSaved = stats.total
      const targetBudget = Number(trip.target_budget_minor)
      const amountRemaining = calculateAmountRemaining(targetBudget, totalSaved)
      const progress = calculateProgressPercentage(totalSaved, targetBudget)
      const unlockState = deriveMagnetState(totalSaved, targetBudget)

      return {
        ...trip,
        total_saved_minor: totalSaved,
        amount_remaining_minor: amountRemaining,
        progress_percentage: progress,
        unlock_state: unlockState,
        deposit_count: stats.count,
      }
    })
  },

  /**
   * Fetch a single trip by ID with aggregated stats.
   */
  async getTripById(tripId: string, userId: string): Promise<TripWithStats | null> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .maybeSingle()

    if (tripError || !trip) {
      return null
    }

    const { data: transactions, error: txError } = await supabase
      .from('savings_transactions')
      .select('amount_minor')
      .eq('trip_id', tripId)
      .eq('user_id', userId)

    if (txError) {
      console.error('Error fetching transactions for trip:', txError)
      throw new Error(txError.message)
    }

    const totalSaved = transactions?.reduce((sum, tx) => sum + Number(tx.amount_minor), 0) || 0
    const targetBudget = Number(trip.target_budget_minor)
    const amountRemaining = calculateAmountRemaining(targetBudget, totalSaved)
    const progress = calculateProgressPercentage(totalSaved, targetBudget)
    const unlockState = deriveMagnetState(totalSaved, targetBudget)

    return {
      ...trip,
      total_saved_minor: totalSaved,
      amount_remaining_minor: amountRemaining,
      progress_percentage: progress,
      unlock_state: unlockState,
      deposit_count: transactions?.length || 0,
    }
  },

  /**
   * Create a new trip.
   */
  async createTrip(trip: TripInsert): Promise<TripRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('trips')
      .insert([trip])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating trip:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...trip,
    }) as TripRow
  },

  /**
   * Update an existing trip.
   */
  async updateTrip(tripId: string, updates: TripUpdate, userId: string): Promise<TripRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .eq('user_id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating trip:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: tripId,
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...updates,
    }) as TripRow
  },

  /**
   * Delete a trip. Cascade deletion handles dependent records.
   */
  async deleteTrip(tripId: string, userId: string): Promise<void> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting trip:', error)
      throw new Error(error.message)
    }
  },
}
