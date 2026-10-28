import posthog from 'posthog-js'

let isInitialized = false

/**
 * Initialize PostHog analytics with client-side environment configurations.
 */
export function initPostHog(): void {
  if (typeof window === 'undefined' || isInitialized) return

  const apiKey =
    import.meta.env.VITE_POSTHOG_KEY ||
    import.meta.env.VITE_POSTHOG_API_KEY ||
    import.meta.env.VITE_PUBLIC_POSTHOG_KEY

  const apiHost =
    import.meta.env.VITE_POSTHOG_HOST ||
    import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
    'https://us.i.posthog.com'

  if (apiKey) {
    try {
      posthog.init(apiKey, {
        api_host: apiHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      })
      isInitialized = true
    } catch (err) {
      console.warn('[PostHog] Initialization error:', err)
    }
  }
}

/**
 * Safe capture function that works across environments
 */
export function capturePostHogEvent(eventName: string, properties?: Record<string, any>): void {
  try {
    if (typeof window !== 'undefined') {
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture(eventName, properties)
      } else if ((window as any).posthog && typeof (window as any).posthog.capture === 'function') {
        (window as any).posthog.capture(eventName, properties)
      }
    }
  } catch (err) {
    console.warn(`[PostHog] Error tracking event "${eventName}":`, err)
  }
}

/**
 * Event 1: trip_created
 * Fired when a user plans and saves a new trip.
 */
export function trackTripCreated(trip: {
  tripId?: string
  destination: string
  targetBudget?: number
  targetDate?: string
  currency?: string
}): void {
  capturePostHogEvent('trip_created', {
    trip_id: trip.tripId,
    destination_name: trip.destination,
    target_budget: trip.targetBudget,
    target_date: trip.targetDate,
    currency: trip.currency || 'INR',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Event 2: deposit_added
 * Fired when a user records a savings deposit towards a trip.
 */
export function trackDepositAdded(deposit: {
  tripId?: string
  destination?: string
  amount: number
  totalSaved?: number
  targetBudget?: number
  progressPercentage?: number
  currency?: string
}): void {
  capturePostHogEvent('deposit_added', {
    trip_id: deposit.tripId,
    destination_name: deposit.destination,
    deposit_amount: deposit.amount,
    total_saved: deposit.totalSaved,
    target_budget: deposit.targetBudget,
    progress_percentage: deposit.progressPercentage,
    currency: deposit.currency || 'INR',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Event 3: magnet_unlocked
 * Fired when savings reach 100% and the destination magnet is unlocked.
 */
export function trackMagnetUnlocked(data: {
  magnetId?: string
  tripId?: string
  destination: string
  totalSaved?: number
  targetBudget?: number
}): void {
  capturePostHogEvent('magnet_unlocked', {
    magnet_id: data.magnetId,
    trip_id: data.tripId,
    destination_name: data.destination,
    total_saved: data.totalSaved,
    target_budget: data.targetBudget,
    timestamp: new Date().toISOString(),
  })
}

export { posthog }
