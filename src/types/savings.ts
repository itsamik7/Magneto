import type { Database } from './database'

export type SavingsTransactionRow = Database['public']['Tables']['savings_transactions']['Row']
export type SavingsTransactionInsert = Database['public']['Tables']['savings_transactions']['Insert']
export type SavingsTransactionUpdate = Database['public']['Tables']['savings_transactions']['Update']

export interface TripSavingsSummary {
  trip_id: string
  target_budget_minor: number
  total_saved_minor: number
  amount_remaining_minor: number
  progress_percentage: number
  transactions: SavingsTransactionRow[]
}
