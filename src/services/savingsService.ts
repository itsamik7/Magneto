import { supabase, checkSupabaseReady } from '../lib/supabase'
import type { SavingsTransactionInsert, SavingsTransactionRow } from '../types/savings'

export const savingsService = {
  /**
   * Fetch all savings deposits for a trip, ordered chronologically descending.
   */
  async getTripTransactions(tripId: string, userId: string): Promise<SavingsTransactionRow[]> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { data, error } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      throw new Error(error.message)
    }

    return data || []
  },

  /**
   * Add a new savings deposit (in integer minor units / paise).
   */
  async addDeposit(deposit: SavingsTransactionInsert): Promise<SavingsTransactionRow> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    if (deposit.amount_minor <= 0) {
      throw new Error('Deposit amount must be greater than zero')
    }

    const { data, error } = await supabase
      .from('savings_transactions')
      .insert([deposit])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error adding savings deposit:', error)
      throw new Error(error.message)
    }

    return (data ?? {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...deposit,
    }) as SavingsTransactionRow
  },

  /**
   * Delete a savings deposit transaction.
   */
  async deleteDeposit(transactionId: string, userId: string): Promise<void> {
    const { ready, error: configError } = checkSupabaseReady()
    if (!ready) throw new Error(configError)

    const { error } = await supabase
      .from('savings_transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting transaction:', error)
      throw new Error(error.message)
    }
  },
}
