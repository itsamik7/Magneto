import { supabase, checkSupabaseReady } from '../lib/supabase'
import type { ChecklistItemInsert, ChecklistItemRow, ChecklistItemUpdate } from '../types/planning'

export const checklistService = {
  /**
   * Fetch all checklist tasks for a trip.
   */
  async getChecklistItems(tripId: string, userId: string): Promise<ChecklistItemRow[]> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching checklist items:', error)
      throw new Error(error.message)
    }

    return data || []
  },

  /**
   * Create a new checklist item.
   */
  async createChecklistItem(item: ChecklistItemInsert): Promise<ChecklistItemRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('checklist_items')
      .insert([item])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating checklist item:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...item,
    }) as ChecklistItemRow
  },

  /**
   * Toggle task completion or edit title/due_date.
   */
  async updateChecklistItem(itemId: string, updates: ChecklistItemUpdate, userId: string): Promise<ChecklistItemRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('checklist_items')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating checklist item:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: itemId,
      user_id: userId,
      ...updates,
    }) as ChecklistItemRow
  },

  /**
   * Delete a checklist item.
   */
  async deleteChecklistItem(itemId: string, userId: string): Promise<void> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting checklist item:', error)
      throw new Error(error.message)
    }
  },
}
