import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  CatalogQueryParams,
  DestinationWithMagnet,
} from '../types/destination'
import { DESTINATIONS_CATALOG } from '../data/destinationsCatalog'

export const destinationService = {
  /**
   * Fetch destinations with optional filters, search, and collected state.
   */
  async getDestinations(
    params: CatalogQueryParams = {},
    userId?: string
  ): Promise<DestinationWithMagnet[]> {
    let destinations: DestinationWithMagnet[] = []

    // 1. Attempt to fetch from Supabase if configured
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('destinations')
          .select(`
            id,
            slug,
            name,
            city,
            region,
            continent,
            destination_type,
            short_description,
            landmark_names,
            tags,
            popularity_score,
            is_featured,
            countries (
              name,
              country_code,
              flag_emoji
            ),
            magnet_assets (
              id,
              asset_url,
              magnet_shape,
              dominant_colors,
              is_primary
            )
          `)
          .eq('is_active', true)

        if (params.continent && params.continent !== 'All') {
          query = query.eq('continent', params.continent)
        }

        if (params.category && params.category !== 'All') {
          query = query.eq('destination_type', params.category)
        }

        if (params.featuredOnly) {
          query = query.eq('is_featured', true)
        }

        if (params.search && params.search.trim()) {
          const s = params.search.trim()
          query = query.or(`name.ilike.%${s}%,city.ilike.%${s}%,short_description.ilike.%${s}%`)
        }

        if (params.sortBy === 'name') {
          query = query.order('name', { ascending: true })
        } else {
          query = query.order('popularity_score', { ascending: false })
        }

        const { data, error } = await query

        if (!error && data && data.length > 0) {
          destinations = (data as unknown[]).map((row: any) => {
            const primaryAsset =
              row.magnet_assets?.find((m: any) => m.is_primary) ||
              row.magnet_assets?.[0]

            return {
              id: row.id,
              slug: row.slug,
              name: row.name,
              country_name: row.countries?.name || 'World',
              country_code: row.countries?.country_code || 'UN',
              continent: row.continent,
              flag_emoji: row.countries?.flag_emoji || '✈️',
              city: row.city || undefined,
              region: row.region || undefined,
              destination_type: row.destination_type,
              short_description: row.short_description || undefined,
              landmark_names: row.landmark_names || [],
              tags: row.tags || [],
              popularity_score: row.popularity_score || 0,
              is_featured: !!row.is_featured,
              magnet_shape: primaryAsset?.magnet_shape || 'die-cut',
              dominant_colors: primaryAsset?.dominant_colors || ['#0284C7', '#F59E0B'],
              asset_url: primaryAsset?.asset_url || `/magnets/destinations/${row.slug}.png`,
              magnet_asset_id: primaryAsset?.id,
            }
          })
        }
      } catch (err) {
        console.warn('Supabase destinations query failed, falling back to curated catalog:', err)
      }
    }

    // 2. Fallback to offline / pre-seeded curated catalog
    if (destinations.length === 0) {
      destinations = [...DESTINATIONS_CATALOG]

      if (params.continent && params.continent !== 'All') {
        destinations = destinations.filter((d) => d.continent === params.continent)
      }

      if (params.category && params.category !== 'All') {
        destinations = destinations.filter((d) => d.destination_type === params.category)
      }

      if (params.featuredOnly) {
        destinations = destinations.filter((d) => d.is_featured)
      }

      if (params.search && params.search.trim()) {
        const query = params.search.toLowerCase().trim()
        destinations = destinations.filter((d) => {
          return (
            d.name.toLowerCase().includes(query) ||
            d.country_name.toLowerCase().includes(query) ||
            d.city?.toLowerCase().includes(query) ||
            d.destination_type.toLowerCase().includes(query) ||
            d.landmark_names.some((l) => l.toLowerCase().includes(query)) ||
            d.tags.some((t) => t.toLowerCase().includes(query))
          )
        })
      }

      if (params.sortBy === 'name') {
        destinations.sort((a, b) => a.name.localeCompare(b.name))
      } else {
        destinations.sort((a, b) => b.popularity_score - a.popularity_score)
      }
    }

    // 3. Check collected state for user if userId is provided
    if (userId) {
      const collectedSlugs = await destinationService.getUserCollectedSlugs(userId)
      destinations = destinations.map((d) => ({
        ...d,
        is_collected: collectedSlugs.has(d.slug),
      }))
    }

    return destinations
  },

  /**
   * Retrieve set of slugs the user has already collected
   */
  async getUserCollectedSlugs(userId: string): Promise<Set<string>> {
    const collected = new Set<string>()

    // Check storage fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = window.localStorage.getItem(`magneto_collected_${userId}`)
        if (local) {
          const arr = JSON.parse(local)
          if (Array.isArray(arr)) {
            arr.forEach((slug) => collected.add(slug))
          }
        }
      }
    } catch {
      // Ignore
    }

    // Check Supabase if available
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_magnets')
          .select(`
            destination_id,
            destinations (
              slug
            )
          `)
          .eq('user_id', userId)

        if (!error && data) {
          data.forEach((row: any) => {
            if (row.destinations?.slug) {
              collected.add(row.destinations.slug)
            }
          })
        }
      } catch {
        // Ignore and use local
      }
    }

    return collected
  },

  /**
   * Get single destination by slug
   */
  async getDestinationBySlug(slug: string, userId?: string): Promise<DestinationWithMagnet | null> {
    const all = await destinationService.getDestinations({}, userId)
    return all.find((d) => d.slug === slug) || null
  },

  /**
   * Get featured destinations
   */
  async getFeaturedDestinations(userId?: string): Promise<DestinationWithMagnet[]> {
    return destinationService.getDestinations({ featuredOnly: true }, userId)
  },
}
