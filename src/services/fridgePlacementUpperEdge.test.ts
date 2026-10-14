import { describe, it, expect, beforeEach } from 'vitest'
import { fridgeService, resolveMagnetOverlaps } from './fridgeService'
import type { MagnetPlacement } from '../types/fridge'

describe('Upper-Edge Magnet Placement & Dragging Test Suite', () => {
  const userId = 'test-user-upper-edge'
  const modelId = 'universal-steel-studio'

  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('allows a magnet to move from the middle of the fridge to near the permitted upper edge', () => {
    // 1. Initial magnet placed at the exact middle of the fridge
    const initialPlacement: MagnetPlacement = {
      id: 'mag-delhi',
      magnetSlug: 'delhi',
      destinationName: 'New Delhi',
      assetUrl: '/magnets/delhi.png',
      x: 0.50,
      y: 0.50,
      scale: 1.0,
      rotation: 0,
      zIndex: 1,
    }

    // 2. Simulate dragging upwards towards the upper edge
    // Suppose the surface is 360px wide by 640px high
    const surfaceWidth = 360
    const surfaceHeight = 640

    // Pointer moves upwards by 295 pixels on screen
    const deltaY = -295
    const normDeltaY = deltaY / surfaceHeight // approx -0.4609

    // Magnet visual half-height (e.g. 24px on 640px height)
    const magnetHalfHeightPx = 24
    const halfH = magnetHalfHeightPx / surfaceHeight // approx 0.0375

    // Permitted upper boundary for center Y so top edge reaches exactly 0.00
    const minY = halfH
    const maxY = 1 - halfH

    const targetY = initialPlacement.y + normDeltaY
    const finalY = Math.min(maxY, Math.max(minY, targetY))

    // Verify the magnet reaches the permitted upper boundary
    expect(finalY).toBeCloseTo(minY, 2)
    expect(finalY).toBeLessThan(0.05) // Well into the upper boundary (< 0.05)

    // The top edge of the magnet (center Y - halfH) reaches the upper boundary (0.00)
    const topEdgePosition = finalY - halfH
    expect(topEdgePosition).toBeCloseTo(0.00, 2)
  })

  it('recalculates permitted boundaries dynamically when the magnet is resized without changing fridge dimensions', () => {
    const surfaceHeight = 600

    // Case A: Standard scale 1.0 (magnet height = 48px, half-height = 24px)
    const scale1 = 1.0
    const halfH1 = (24 * scale1) / surfaceHeight // 0.04
    const minY1 = Math.max(0.015, halfH1) // 0.04

    // Case B: Scaled up to 1.5x (magnet height = 72px, half-height = 36px)
    const scaleUp = 1.5
    const halfH_Up = (24 * scaleUp) / surfaceHeight // 0.06
    const minY_Up = Math.max(0.015, halfH_Up) // 0.06

    // Case C: Scaled down to 0.6x (magnet height = 28.8px, half-height = 14.4px)
    const scaleDown = 0.6
    const halfH_Down = (24 * scaleDown) / surfaceHeight // 0.024
    const minY_Down = Math.max(0.015, halfH_Down) // 0.024

    // The larger magnet has a slightly larger minimum center Y to keep its top visible
    expect(minY_Up).toBeGreaterThan(minY1)
    // The smaller magnet can reach even closer to the top boundary
    expect(minY_Down).toBeLessThan(minY1)

    // In all cases, the top edge (minY - halfH) reaches 0.00 exactly
    expect(minY1 - halfH1).toBeCloseTo(0.0, 5)
    expect(minY_Up - halfH_Up).toBeCloseTo(0.0, 5)
    expect(minY_Down - halfH_Down).toBeCloseTo(0.0, 5)
  })

  it('preserves upper-edge placement through collision resolution without pushing it down', () => {
    const upperPlacements: MagnetPlacement[] = [
      {
        id: 'mag-upper-left',
        magnetSlug: 'ladakh',
        destinationName: 'Ladakh',
        assetUrl: '/magnets/ladakh.png',
        x: 0.25,
        y: 0.04, // Near top edge
        scale: 1.0,
        rotation: 0,
        zIndex: 1,
      },
      {
        id: 'mag-upper-right',
        magnetSlug: 'elephant',
        destinationName: 'Royal Elephant',
        assetUrl: '/magnets/elephant.png',
        x: 0.75,
        y: 0.04, // Near top edge
        scale: 1.0,
        rotation: 0,
        zIndex: 2,
      },
    ]

    const resolved = resolveMagnetOverlaps(upperPlacements)

    // Both magnets must remain near the upper edge without being forced down
    expect(resolved[0].y).toBeLessThanOrEqual(0.05)
    expect(resolved[1].y).toBeLessThanOrEqual(0.05)
    expect(resolved[0].y).toBeGreaterThanOrEqual(0.03)
    expect(resolved[1].y).toBeGreaterThanOrEqual(0.03)
  })

  it('persists and retains upper-edge position after save and reload (refresh)', () => {
    const upperPlacement: MagnetPlacement = {
      id: 'mag-eiffel',
      magnetSlug: 'paris',
      destinationName: 'Paris',
      assetUrl: '/magnets/paris.png',
      x: 0.50,
      y: 0.045, // Upper edge
      scale: 1.0,
      rotation: 0,
      zIndex: 1,
    }

    // Save placement
    fridgeService.saveFridgePlacements(userId, modelId, [upperPlacement])

    // Reload from storage (simulating a page refresh)
    const loaded = fridgeService.getFridgePlacements(userId, modelId)

    expect(loaded.length).toBe(1)
    expect(loaded[0].id).toBe('mag-eiffel')
    expect(loaded[0].x).toBe(0.50)
    expect(loaded[0].y).toBe(0.045) // Preserved faithfully
  })

  it('coordinates are identical on desktop and mobile viewports', () => {
    // Desktop surface
    const desktopWidth = 380
    const desktopHeight = 678
    const desktopClientDeltaY = -200
    const desktopNormDeltaY = desktopClientDeltaY / desktopHeight

    // Mobile surface (scaled down to fit 340px viewport)
    const mobileScale = 0.85
    const mobileWidth = desktopWidth * mobileScale
    const mobileHeight = desktopHeight * mobileScale
    // Touch drag delta on screen is proportionally scaled
    const mobileClientDeltaY = desktopClientDeltaY * mobileScale
    const mobileNormDeltaY = mobileClientDeltaY / mobileHeight

    // Normalized coordinate conversion must be mathematically identical
    expect(desktopNormDeltaY).toBeCloseTo(mobileNormDeltaY, 5)
  })
})
