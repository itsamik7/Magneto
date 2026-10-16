import { supabase, checkSupabaseReady } from '../lib/supabase'
import type { ItineraryItemInsert, ItineraryItemRow, ItineraryItemUpdate } from '../types/planning'

export const itineraryService = {
  /**
   * Fetch all itinerary items for a trip.
   */
  async getItineraryItems(tripId: string, userId: string): Promise<ItineraryItemRow[]> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .order('activity_date', { ascending: true, nullsFirst: false })
      .order('activity_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching itinerary items:', error)
      throw new Error(error.message)
    }

    return data || []
  },

  /**
   * Create an itinerary item.
   */
  async createItineraryItem(item: ItineraryItemInsert): Promise<ItineraryItemRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('itinerary_items')
      .insert([item])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating itinerary item:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...item,
    }) as ItineraryItemRow
  },

  /**
   * Update an itinerary item.
   */
  async updateItineraryItem(itemId: string, updates: ItineraryItemUpdate, userId: string): Promise<ItineraryItemRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('itinerary_items')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating itinerary item:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: itemId,
      user_id: userId,
      ...updates,
    }) as ItineraryItemRow
  },

  /**
   * Delete an itinerary item.
   */
  async deleteItineraryItem(itemId: string, userId: string): Promise<void> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting itinerary item:', error)
      throw new Error(error.message)
    }
  },
}
