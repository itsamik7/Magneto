import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { DestinationWithMagnet } from '../types/destination'
import { DESTINATIONS_CATALOG } from '../data/destinationsCatalog'
import { tripService } from './tripService'

export interface FridgeMagnetItem {
  id: string
  destination_slug: string
  destination_name: string
  country_name: string
  continent: string
  asset_url: string
  magnet_shape: string
  acquired_at: string
  trip_id?: string | null
  target_budget_minor?: number
  total_saved_minor?: number
  progress_percentage?: number
  unlock_state?: 'dreaming' | 'saving' | 'ready_to_go'
}

export const DEFAULT_FEATURED_MAGNETS: FridgeMagnetItem[] = [
  // Top Freezer Door:
  {
    id: 'magnet-ladakh',
    destination_slug: 'ladakh',
    destination_name: 'Ladakh',
    country_name: 'India',
    continent: 'Asia',
    asset_url: '/assets/magnets/india/ladakh.png',
    magnet_shape: 'arch',
    acquired_at: '2024-01-10T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-delhi',
    destination_slug: 'delhi',
    destination_name: 'India Gate',
    country_name: 'India',
    continent: 'Asia',
    asset_url: '/assets/magnets/india/india-gate.png',
    magnet_shape: 'arch',
    acquired_at: '2024-01-12T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-royal-elephant',
    destination_slug: 'royal-elephant',
    destination_name: 'Royal Elephant',
    country_name: 'India',
    continent: 'Asia',
    asset_url: '/assets/magnets/india/royal-elephant.png',
    magnet_shape: 'arch',
    acquired_at: '2024-01-14T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-goa',
    destination_slug: 'goa',
    destination_name: 'Goa',
    country_name: 'India',
    continent: 'Asia',
    asset_url: '/assets/magnets/india/goa-beach.png',
    magnet_shape: 'arch',
    acquired_at: '2024-01-20T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-taj-mahal',
    destination_slug: 'taj-mahal',
    destination_name: 'Taj Mahal',
    country_name: 'India',
    continent: 'Asia',
    asset_url: '/assets/magnets/india/taj-mahal.png',
    magnet_shape: 'arch',
    acquired_at: '2024-01-25T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },

  // Bottom Main Door:
  {
    id: 'magnet-paris',
    destination_slug: 'paris',
    destination_name: 'Paris',
    country_name: 'France',
    continent: 'Europe',
    asset_url: '/assets/magnets/international/eiffel-tower.png',
    magnet_shape: 'arch',
    acquired_at: '2024-02-01T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-london',
    destination_slug: 'london',
    destination_name: 'London',
    country_name: 'United Kingdom',
    continent: 'Europe',
    asset_url: '/assets/magnets/international/london.png',
    magnet_shape: 'arch',
    acquired_at: '2024-02-10T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-new-york',
    destination_slug: 'new-york',
    destination_name: 'New York',
    country_name: 'USA',
    continent: 'Americas',
    asset_url: '/magnets/destinations/new-york.png',
    magnet_shape: 'arch',
    acquired_at: '2024-02-15T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-bali',
    destination_slug: 'bali',
    destination_name: 'Bali',
    country_name: 'Indonesia',
    continent: 'Asia',
    asset_url: '/assets/magnets/international/bali-temple.png',
    magnet_shape: 'arch',
    acquired_at: '2024-02-20T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-rome',
    destination_slug: 'rome',
    destination_name: 'Rome',
    country_name: 'Italy',
    continent: 'Europe',
    asset_url: '/assets/magnets/international/colosseum-rome.png',
    magnet_shape: 'arch',
    acquired_at: '2024-03-01T10:00:00Z',
    unlock_state: 'ready_to_go',
    progress_percentage: 100,
  },
  {
    id: 'magnet-santorini',
    destination_slug: 'santorini',
    destination_name: 'Santorini',
    country_name: 'Greece',
    continent: 'Europe',
    asset_url: '/magnets/destinations/santorini.png',
    magnet_shape: 'arch',
    acquired_at: '2024-03-20T10:00:00Z',
    unlock_state: 'saving',
    target_budget_minor: 25000000,
    total_saved_minor: 8000000,
    progress_percentage: 32,
  },
]

// In-memory fallback for environments without window.localStorage (e.g. Node / Vitest)
const memoryStorage = new Map<string, string>()

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        // Fallback
      }
    }
    return memoryStorage.get(key) || null
  },
  setItem(key: string, val: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, val)
        return
      } catch {
        // Fallback
      }
    }
    memoryStorage.set(key, val)
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key)
        return
      } catch {
        // Fallback
      }
    }
    memoryStorage.delete(key)
  },
  clear(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear()
      } catch {
        // Fallback
      }
    }
    memoryStorage.clear()
  },
}

export const userMagnetService = {
  safeStorage,

  /**
   * Get all collected magnets for a user's fridge.
   */
  async getUserFridgeMagnets(userId: string): Promise<FridgeMagnetItem[]> {
    const items: FridgeMagnetItem[] = []

    // 1. Try Supabase user_magnets table
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_magnets')
          .select(`
            id,
            destination_id,
            trip_id,
            acquired_at,
            destinations (
              slug,
              name,
              continent,
              countries (
                name
              )
            ),
            magnet_assets (
              asset_url,
              magnet_shape
            )
          `)
          .eq('user_id', userId)
          .order('acquired_at', { ascending: false })

        if (!error && data && data.length > 0) {
          for (const row of data as any[]) {
            const dest = row.destinations
            const asset = row.magnet_assets
            if (!dest) continue

            const slug = dest.slug
            const catalogItem = DESTINATIONS_CATALOG.find((c) => c.slug === slug)

            items.push({
              id: row.id,
              destination_slug: slug,
              destination_name: dest.name,
              country_name: dest.countries?.name || catalogItem?.country_name || '',
              continent: dest.continent || catalogItem?.continent || '',
              asset_url: asset?.asset_url || catalogItem?.asset_url || `/magnets/destinations/${slug}.png`,
              magnet_shape: asset?.magnet_shape || catalogItem?.magnet_shape || 'arch',
              acquired_at: row.acquired_at,
              trip_id: row.trip_id,
            })
          }
        }
      } catch (err) {
        console.warn('Failed to query user_magnets from Supabase, checking local storage:', err)
      }
    }

    // 2. Fallback to storage
    if (items.length === 0) {
      try {
        const raw = safeStorage.getItem(`magneto_fridge_${userId}`)
        if (raw !== null) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            items.push(...parsed)
          }
        }
      } catch {
        // Ignore
      }
    }

    // 3. Enrich with Trip data if trips exist for the user
    try {
      const userTrips = await tripService.getUserTrips(userId)
      items.forEach((item) => {
        const matchedTrip = userTrips.find(
          (t) =>
            (item.trip_id && t.id === item.trip_id) ||
            t.magnet_key.toLowerCase() === item.destination_slug.toLowerCase() ||
            t.destination_name.toLowerCase().includes(item.destination_slug.toLowerCase()) ||
            item.destination_name.toLowerCase().includes(t.destination_name.toLowerCase())
        )

        if (matchedTrip) {
          item.trip_id = matchedTrip.id
          item.target_budget_minor = matchedTrip.target_budget_minor
          item.total_saved_minor = matchedTrip.total_saved_minor
          item.progress_percentage = matchedTrip.progress_percentage
          item.unlock_state = matchedTrip.unlock_state
        } else {
          item.unlock_state = 'dreaming'
          item.progress_percentage = 0
        }
      })
    } catch {
      // Trips service enrichment failed, proceed with magnet souvenirs
    }

    return items
  },

  /**
   * Add a destination magnet to the user's fridge with duplicate prevention.
   */
  async addMagnetToFridge(
    userId: string,
    destination: DestinationWithMagnet,
    options?: {
      createTrip?: boolean
      targetBudgetMinor?: number
      startDate?: string
      endDate?: string
    }
  ): Promise<{ success: boolean; message: string; magnetItem?: FridgeMagnetItem }> {
    // 1. Check if already collected
    const existing = await userMagnetService.getUserFridgeMagnets(userId)
    const alreadyCollected = existing.some(
      (m) => m.destination_slug.toLowerCase() === destination.slug.toLowerCase()
    )

    if (alreadyCollected) {
      return {
        success: false,
        message: `${destination.name} is already on your fridge!`,
      }
    }

    let linkedTripId: string | null = null

    // 2. Optionally create a trip in the database
    if (options?.createTrip && options.targetBudgetMinor) {
      try {
        const trip = await tripService.createTrip({
          user_id: userId,
          destination_name: destination.name,
          magnet_key: destination.slug,
          target_budget_minor: options.targetBudgetMinor,
          currency: 'INR',
          start_date: options.startDate || null,
          end_date: options.endDate || null,
          notes: `Added from destination catalog: ${destination.short_description || ''}`,
        })
        linkedTripId = trip.id
      } catch (err) {
        console.warn('Failed to auto-create linked trip:', err)
      }
    }

    const newMagnetItem: FridgeMagnetItem = {
      id: `magnet-${destination.slug}`,
      destination_slug: destination.slug,
      destination_name: destination.name,
      country_name: destination.country_name,
      continent: destination.continent,
      asset_url: destination.asset_url,
      magnet_shape: destination.magnet_shape,
      acquired_at: new Date().toISOString(),
      trip_id: linkedTripId,
      unlock_state: 'dreaming',
      progress_percentage: 0,
    }

    // 3. Save to Supabase user_magnets if configured
    if (isSupabaseConfigured) {
      try {
        let destId = destination.id
        let magnetAssetId = destination.magnet_asset_id

        if (!destId) {
          const { data: dRow } = await supabase
            .from('destinations')
            .select('id, magnet_assets(id)')
            .eq('slug', destination.slug)
            .maybeSingle()

          if (dRow) {
            destId = dRow.id
            const assets = (dRow as any).magnet_assets
            magnetAssetId = assets?.[0]?.id
          }
        }

        if (destId) {
          await supabase.from('user_magnets').insert({
            user_id: userId,
            destination_id: destId,
            magnet_asset_id: magnetAssetId || crypto.randomUUID(),
            trip_id: linkedTripId,
            acquired_at: newMagnetItem.acquired_at,
          })
        }
      } catch (err) {
        console.warn('Failed to insert user_magnets to Supabase, saving locally:', err)
      }
    }

    // 4. Update storage cache
    try {
      const localFridge = [...existing, newMagnetItem]
      safeStorage.setItem(`magneto_fridge_${userId}`, JSON.stringify(localFridge))

      const collectedSlugs = existing.map((m) => m.destination_slug)
      collectedSlugs.push(destination.slug)
      safeStorage.setItem(`magneto_collected_${userId}`, JSON.stringify(collectedSlugs))
    } catch {
      // Ignore
    }

    return {
      success: true,
      message: `${destination.name} magnet added to your fridge!`,
      magnetItem: newMagnetItem,
    }
  },

  /**
   * Synchronously get cached magnets for immediate component initialization.
   */
  getUserFridgeMagnetsSync(userId: string): FridgeMagnetItem[] {
    try {
      const raw = safeStorage.getItem(`magneto_fridge_${userId}`)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_FEATURED_MAGNETS
  },

  /**
   * Save the complete list of fridge magnets for a user.
   */
  async saveUserFridgeMagnets(userId: string, magnets: FridgeMagnetItem[]): Promise<void> {
    try {
      safeStorage.setItem(`magneto_fridge_${userId}`, JSON.stringify(magnets))
      const collectedSlugs = magnets.map((m) => m.destination_slug)
      safeStorage.setItem(`magneto_collected_${userId}`, JSON.stringify(collectedSlugs))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('magneto_sync', { detail: { userId } }))
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Remove a magnet from the fridge. Supports destination slug or canonical ID.
   */
  async removeMagnetFromFridge(userId: string, identifier: string): Promise<boolean> {
    try {
      const existing = await userMagnetService.getUserFridgeMagnets(userId)
      const cleanSlug = identifier.toLowerCase().replace(/^magnet-/, '')
      const filtered = existing.filter(
        (m) =>
          m.id !== identifier &&
          m.destination_slug.toLowerCase() !== identifier.toLowerCase() &&
          m.destination_slug.toLowerCase() !== cleanSlug
      )
      safeStorage.setItem(`magneto_fridge_${userId}`, JSON.stringify(filtered))

      const collectedSlugs = filtered.map((m) => m.destination_slug)
      safeStorage.setItem(`magneto_collected_${userId}`, JSON.stringify(collectedSlugs))

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('magneto_sync', { detail: { userId } }))
      }

      if (isSupabaseConfigured) {
        const { data: dRow } = await supabase
          .from('destinations')
          .select('id')
          .eq('slug', cleanSlug)
          .maybeSingle()

        if (dRow) {
          await supabase
            .from('user_magnets')
            .delete()
            .eq('user_id', userId)
            .eq('destination_id', dRow.id)
        }
      }
      return true
    } catch {
      return false
    }
  },
}
