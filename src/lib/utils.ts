import type { MagnetUnlockState } from '../types/trip'

/**
 * Convert Rupees (INR) to Paise (integer minor unit).
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || rupees < 0) return 0
  return Math.round(rupees * 100)
}

/**
 * Convert Paise (minor unit) to Rupees (INR).
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || paise < 0) return 0
  return paise / 100
}

/**
 * Format paise into Indian Rupee notation (e.g. ₹50,000 or ₹1,25,000.50).
 */
export function formatINR(paise: number, showDecimals = false): string {
  const rupees = paiseToRupees(paise)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees)
}

/**
 * Derive the automatic magnet unlock state.
 * - Dreaming: Saved === 0
 * - Saving: 0 < Saved < Target
 * - Ready to Go: Saved >= Target
 */
export function deriveMagnetState(totalSavedMinor: number, targetBudgetMinor: number): MagnetUnlockState {
  if (totalSavedMinor <= 0) return 'dreaming'
  if (totalSavedMinor >= targetBudgetMinor && targetBudgetMinor > 0) return 'ready_to_go'
  return 'saving'
}

/**
 * Calculate amount remaining (never negative).
 */
export function calculateAmountRemaining(targetBudgetMinor: number, totalSavedMinor: number): number {
  return Math.max(0, targetBudgetMinor - totalSavedMinor)
}

/**
 * Calculate progress percentage (capped at 100%).
 */
export function calculateProgressPercentage(totalSavedMinor: number, targetBudgetMinor: number): number {
  if (!targetBudgetMinor || targetBudgetMinor <= 0) return 0
  const pct = (totalSavedMinor / targetBudgetMinor) * 100
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10))
}

/**
 * Format a standard date string YYYY-MM-DD to localized readable format (e.g. 15 Oct 2026).
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Not set'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}
