import { describe, it, expect } from 'vitest'
import { destinationService } from './destinationService'
import { DESTINATIONS_CATALOG } from '../data/destinationsCatalog'

describe('destinationService', () => {
  it('should have 100 curated destinations in catalog', () => {
    expect(DESTINATIONS_CATALOG.length).toBe(100)
  })

  it('should fetch all destinations when no filters applied', async () => {
    const destinations = await destinationService.getDestinations({})
    expect(destinations.length).toBe(100)
  })

  it('should filter destinations by continent', async () => {
    const asia = await destinationService.getDestinations({ continent: 'Asia' })
    expect(asia.length).toBeGreaterThan(0)
    asia.forEach((d) => {
      expect(d.continent).toBe('Asia')
    })

    const europe = await destinationService.getDestinations({ continent: 'Europe' })
    expect(europe.length).toBeGreaterThan(0)
    europe.forEach((d) => {
      expect(d.continent).toBe('Europe')
    })
  })

  it('should filter destinations by category', async () => {
    const beaches = await destinationService.getDestinations({ category: 'Beach' })
    expect(beaches.length).toBeGreaterThan(0)
    beaches.forEach((d) => {
      expect(d.destination_type).toBe('Beach')
    })
  })

  it('should search destinations by name, landmark, or city', async () => {
    const results = await destinationService.getDestinations({ search: 'Taj' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((d) => d.slug === 'taj-mahal')).toBe(true)

    const eiffel = await destinationService.getDestinations({ search: 'Eiffel' })
    expect(eiffel.length).toBeGreaterThan(0)
    expect(eiffel.some((d) => d.slug === 'paris')).toBe(true)
  })

  it('should retrieve a destination by slug', async () => {
    const dest = await destinationService.getDestinationBySlug('paris')
    expect(dest).not.toBeNull()
    expect(dest?.slug).toBe('paris')
    expect(dest?.name).toContain('Paris')
    expect(dest?.asset_url).toBe('/magnets/paris.png')
  })

  it('should retrieve featured destinations', async () => {
    const featured = await destinationService.getFeaturedDestinations()
    expect(featured.length).toBeGreaterThan(0)
    featured.forEach((d) => {
      expect(d.is_featured).toBe(true)
    })
  })
})
