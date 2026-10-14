import type { FridgeModel, MagnetPlacement, UserFridgeConfiguration } from '../types/fridge'
import { FRIDGE_MODELS, DEFAULT_FRIDGE_ID } from '../data/fridgeCatalog'
import type { FridgeMagnetItem } from './userMagnetService'

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

export const MAGNET_SLUG_ALIASES: Record<string, string[]> = {
  'delhi': ['delhi', 'india-gate'],
  'india-gate': ['delhi', 'india-gate'],
  'goa': ['goa', 'goa-beach'],
  'goa-beach': ['goa', 'goa-beach'],
  'paris': ['paris', 'eiffel-tower'],
  'eiffel-tower': ['paris', 'eiffel-tower'],
  'rome': ['rome', 'colosseum-rome'],
  'colosseum-rome': ['rome', 'colosseum-rome'],
  'bali': ['bali', 'bali-temple'],
  'bali-temple': ['bali', 'bali-temple'],
  'royal-elephant': ['elephant', 'royal-elephant'],
  'elephant': ['elephant', 'royal-elephant'],
  'thailand': ['thailand', 'bangkok'],
  'bangkok': ['thailand', 'bangkok'],
}

export function areSlugsEquivalent(slug1?: string | null, slug2?: string | null): boolean {
  if (!slug1 || !slug2) return false
  const s1 = slug1.toLowerCase().replace(/^magnet-/, '')
  const s2 = slug2.toLowerCase().replace(/^magnet-/, '')
  if (s1 === s2) return true
  const aliases = MAGNET_SLUG_ALIASES[s1]
  return aliases ? aliases.includes(s2) : false
}

export const DEFAULT_PRESET_POSITIONS: Record<string, { x: number; y: number; scale: number; rotation: number }> = {
  // Top Freezer Door:
  // Row 1: Ladakh (left), India Gate (center), Royal Elephant (right)
  'ladakh': { x: 0.22, y: 0.10, scale: 1.0, rotation: -1 },
  'delhi': { x: 0.52, y: 0.10, scale: 1.0, rotation: 0 },
  'india-gate': { x: 0.52, y: 0.10, scale: 1.0, rotation: 0 },
  'elephant': { x: 0.80, y: 0.10, scale: 1.0, rotation: 1 },
  'royal-elephant': { x: 0.80, y: 0.10, scale: 1.0, rotation: 1 },
  // Row 2: Goa (left-center), Taj Mahal (right-center) - Honeycomb staggered
  'goa': { x: 0.32, y: 0.25, scale: 1.0, rotation: 0 },
  'goa-beach': { x: 0.32, y: 0.25, scale: 1.0, rotation: 0 },
  'taj-mahal': { x: 0.70, y: 0.25, scale: 1.0, rotation: 0 },

  // Bottom Main Door:
  // Row 3: Paris (left), London Bus (center), New York (right)
  'paris': { x: 0.22, y: 0.43, scale: 1.0, rotation: 0 },
  'eiffel-tower': { x: 0.22, y: 0.43, scale: 1.0, rotation: 0 },
  'london': { x: 0.52, y: 0.43, scale: 1.0, rotation: 0 },
  'new-york': { x: 0.80, y: 0.43, scale: 1.0, rotation: 1 },
  // Row 4: Bali (left-center), Japan (right-center) - Honeycomb staggered
  'bali': { x: 0.34, y: 0.62, scale: 1.0, rotation: 0 },
  'bali-temple': { x: 0.34, y: 0.62, scale: 1.0, rotation: 0 },
  'japan': { x: 0.68, y: 0.62, scale: 1.0, rotation: -1 },
  // Row 5: Rome (left), Bangkok (center), Santorini (right)
  'rome': { x: 0.22, y: 0.81, scale: 1.0, rotation: -1 },
  'colosseum-rome': { x: 0.22, y: 0.81, scale: 1.0, rotation: -1 },
  'bangkok': { x: 0.52, y: 0.81, scale: 1.0, rotation: 0 },
  'thailand': { x: 0.52, y: 0.81, scale: 1.0, rotation: 0 },
  'santorini': { x: 0.80, y: 0.81, scale: 1.0, rotation: 0 },
}

/**
 * Collision resolution algorithm:
 * Guarantees that no two magnets overlap on the fridge surface.
 * Pushes intersecting magnets apart while clamping inside safe boundaries.
 */
export function resolveMagnetOverlaps(
  placements: MagnetPlacement[],
  options?: {
    minDistX?: number
    minDistY?: number
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
    maxPasses?: number
  }
): MagnetPlacement[] {
  if (placements.length <= 1) return placements

  const minDistX = options?.minDistX ?? 0.22
  const minDistY = options?.minDistY ?? 0.15
  const minX = options?.minX ?? 0.12
  const maxX = options?.maxX ?? 0.88
  const minY = options?.minY ?? 0.08
  const maxY = options?.maxY ?? 0.90
  const maxPasses = options?.maxPasses ?? 40

  const resolved = placements.map((p) => ({ ...p }))

  for (let pass = 0; pass < maxPasses; pass++) {
    let hadOverlap = false

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const p1 = resolved[i]
        const p2 = resolved[j]

        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)

        if (absDx < minDistX && absDy < minDistY) {
          hadOverlap = true

          const overlapX = minDistX - absDx
          const overlapY = minDistY - absDy

          if (overlapX / minDistX < overlapY / minDistY) {
            const shift = overlapX / 2 + 0.005
            const dir = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx)
            p2.x += shift * dir
            p1.x -= shift * dir
          } else {
            const shift = overlapY / 2 + 0.005
            const dir = dy === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy)
            p2.y += shift * dir
            p1.y -= shift * dir
          }

          p1.x = Math.max(minX, Math.min(maxX, p1.x))
          p1.y = Math.max(minY, Math.min(maxY, p1.y))
          p2.x = Math.max(minX, Math.min(maxX, p2.x))
          p2.y = Math.max(minY, Math.min(maxY, p2.y))
        }
      }
    }

    if (!hadOverlap) break
  }

  return resolved
}

export const fridgeService = {
  safeStorage,
  /**
   * Get all available fridge models (including any user-uploaded custom fridges)
   */
  getFridgeModels(userId?: string): FridgeModel[] {
    const list = [...FRIDGE_MODELS]
    if (userId) {
      const customKey = `magneto_custom_fridges_${userId}`
      const customRaw = safeStorage.getItem(customKey)
      if (customRaw) {
        try {
          const customList: FridgeModel[] = JSON.parse(customRaw)
          if (Array.isArray(customList)) {
            list.push(...customList)
          }
        } catch {
          // Ignore json parse error
        }
      }
    }
    return list
  },

  /**
   * Save a user-uploaded custom fridge model
   */
  saveCustomFridge(userId: string, customFridge: FridgeModel): void {
    const customKey = `magneto_custom_fridges_${userId}`
    const existing = this.getCustomFridges(userId)
    const updated = [customFridge, ...existing.filter((f) => f.id !== customFridge.id)]
    safeStorage.setItem(customKey, JSON.stringify(updated))
  },

  /**
   * Get all custom fridges uploaded by this user
   */
  getCustomFridges(userId: string): FridgeModel[] {
    const customKey = `magneto_custom_fridges_${userId}`
    const customRaw = safeStorage.getItem(customKey)
    if (!customRaw) return []
    try {
      const parsed = JSON.parse(customRaw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  /**
   * Get the active fridge model ID for a user
   */
  getActiveFridgeId(userId: string): string {
    const stored = safeStorage.getItem(`magneto_active_fridge_${userId}`)
    if (stored) {
      // Validate that it exists
      const models = this.getFridgeModels(userId)
      if (models.some((m) => m.id === stored)) {
        return stored
      }
    }
    return DEFAULT_FRIDGE_ID
  },

  /**
   * Set the active fridge model ID for a user
   */
  setActiveFridgeId(userId: string, modelId: string): void {
    safeStorage.setItem(`magneto_active_fridge_${userId}`, modelId)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('magneto_sync', { detail: { userId, modelId } }))
    }
  },

  /**
   * Get the fridge model by ID
   */
  getFridgeModelById(modelId: string, userId?: string): FridgeModel {
    const models = this.getFridgeModels(userId)
    const found = models.find((m) => m.id === modelId)
    return (
      found ||
      models.find((m) => m.id === DEFAULT_FRIDGE_ID) ||
      FRIDGE_MODELS[0]
    )
  },

  /**
   * Load magnet placements for a specific user and fridge model.
   * If any magnets from userMagnets are missing from placements, automatically assigns them
   * clean non-overlapping positions.
   */
  getFridgePlacements(
    userId: string,
    modelId: string,
    currentMagnets?: FridgeMagnetItem[]
  ): MagnetPlacement[] {
    const key = `magneto_fridge_placements_v2_${userId}_${modelId}`
    let placements: MagnetPlacement[] = []

    const raw = safeStorage.getItem(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          placements = parsed
        }
      } catch {
        placements = []
      }
    }

    // Only reconcile against currentMagnets if explicitly provided by caller
    if (currentMagnets !== undefined) {
      if (currentMagnets.length > 0) {
        // Retain placements that correspond to currentMagnets (using alias equivalence)
        placements = placements.filter((p) =>
          currentMagnets.some(
            (m) =>
              m.id === p.id ||
              areSlugsEquivalent(m.destination_slug, p.magnetSlug) ||
              areSlugsEquivalent(m.id, p.id)
          )
        )

        // Identify unplaced magnets
        const unplaced = currentMagnets.filter(
          (m) =>
            !placements.some(
              (p) =>
                p.id === m.id ||
                areSlugsEquivalent(p.magnetSlug, m.destination_slug) ||
                areSlugsEquivalent(p.id, m.id)
            )
        )

        if (unplaced.length > 0) {
          // Compute positions for newly added magnets
          const newPlacements = this.generateAutoLayout(
            unplaced,
            placements.length,
            placements
          )
          placements = [...placements, ...newPlacements]
          // Persist updated list
          this.saveFridgePlacements(userId, modelId, placements, 'getFridgePlacements')
        }
      } else if (placements.length > 0) {
        placements = []
        this.saveFridgePlacements(userId, modelId, placements, 'getFridgePlacements')
      }
    }

    // Run overlap resolution on loaded placements to fix any previously saved overlapping magnets
    if (placements.length > 1) {
      const resolved = resolveMagnetOverlaps(placements)
      const hasShifted = resolved.some(
        (p, i) => Math.abs(p.x - placements[i].x) > 0.001 || Math.abs(p.y - placements[i].y) > 0.001
      )
      if (hasShifted) {
        placements = resolved
        this.saveFridgePlacements(userId, modelId, placements, 'getFridgePlacements')
      }
    }

    return placements
  },

  /**
   * Remove a specific placement by ID or slug and persist
   */
  removeMagnetPlacement(
    userId: string,
    modelId: string,
    placementIdOrSlug: string
  ): MagnetPlacement[] {
    const current = this.getFridgePlacements(userId, modelId)
    const updated = current.filter(
      (p) =>
        p.id !== placementIdOrSlug &&
        !areSlugsEquivalent(p.magnetSlug, placementIdOrSlug) &&
        !areSlugsEquivalent(p.id, placementIdOrSlug)
    )
    this.saveFridgePlacements(userId, modelId, updated)
    return updated
  },

  /**
   * Adapt existing magnet positions when switching to a new fridge model
   */
  adaptPlacementsToModel(
    placements: MagnetPlacement[],
    _targetModel: FridgeModel
  ): MagnetPlacement[] {
    const adapted = placements.map((p) => {
      const x = Math.min(0.88, Math.max(0.12, p.x))
      const y = Math.min(0.88, Math.max(0.12, p.y))
      return {
        ...p,
        x,
        y,
      }
    })
    return resolveMagnetOverlaps(adapted)
  },

  /**
   * Save magnet placements for a user and fridge model
   */
  saveFridgePlacements(
    userId: string,
    modelId: string,
    placements: MagnetPlacement[],
    source?: string
  ): void {
    const key = `magneto_fridge_placements_v2_${userId}_${modelId}`
    safeStorage.setItem(key, JSON.stringify(placements))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('magneto_sync', { detail: { userId, modelId, source } }))
    }
  },

  /**
   * Expose collision resolution function on the service
   */
  resolveMagnetOverlaps,

  /**
   * Generate clean organic non-overlapping layout positions on the fridge door.
   * Guarantees no two magnets overlap with each other.
   */
  generateAutoLayout(
    magnets: FridgeMagnetItem[],
    startIndexOffset: number = 0,
    existingPlacements: MagnetPlacement[] = []
  ): MagnetPlacement[] {
    const totalCount = magnets.length + existingPlacements.length
    const cols = totalCount > 10 ? 3 : totalCount <= 1 ? 1 : 2
    const rows = Math.ceil(totalCount / cols)

    // Track occupied coordinates to avoid placing on top of an existing magnet
    const placedPositions: { x: number; y: number }[] = existingPlacements.map((p) => ({
      x: p.x,
      y: p.y,
    }))

    const newPlacements: MagnetPlacement[] = magnets.map((magnet, idx) => {
      const globalIdx = startIndexOffset + idx
      const row = Math.floor(globalIdx / cols)
      const col = globalIdx % cols

      // Calculate staggered grid positions with adequate spacing
      const xSpacing = 0.58 / Math.max(1, cols - 1)
      const isOddRow = row % 2 === 1
      const colOffset = isOddRow && cols > 1 ? (xSpacing * 0.4) * (col % 2 === 0 ? 1 : -1) : 0
      const baseX = cols === 1 ? 0.5 : Math.min(0.82, Math.max(0.18, 0.20 + col * xSpacing + colOffset))

      const ySpacing = rows > 1 ? 0.74 / Math.max(1, rows - 1) : 0
      const baseY = rows <= 1 ? 0.45 : 0.10 + row * ySpacing

      const rotation = (((globalIdx * 13) % 11) - 5) // -5 to +5 degrees natural tilt

      const preset = DEFAULT_PRESET_POSITIONS[magnet.destination_slug.toLowerCase()]

      let finalX = baseX
      let finalY = baseY
      let finalRotation = rotation
      let finalScale = 1.0

      if (preset) {
        // Only use preset if not already occupied by another magnet
        const isOccupied = placedPositions.some(
          (pos) => Math.abs(pos.x - preset.x) < 0.18 && Math.abs(pos.y - preset.y) < 0.12
        )
        if (!isOccupied) {
          finalX = preset.x
          finalY = preset.y
          finalRotation = preset.rotation
          finalScale = preset.scale
        }
      }

      placedPositions.push({ x: finalX, y: finalY })

      return {
        id: magnet.id,
        magnetSlug: magnet.destination_slug,
        destinationName: magnet.destination_name,
        assetUrl: magnet.asset_url,
        x: finalX,
        y: finalY,
        scale: finalScale,
        rotation: finalRotation,
        zIndex: globalIdx + 1,
        tripId: magnet.trip_id,
        unlockState: magnet.unlock_state || 'dreaming',
        progressPercentage: magnet.progress_percentage || 0,
        totalSavedMinor: magnet.total_saved_minor,
        targetBudgetMinor: magnet.target_budget_minor,
        isFundedPending: magnet.progress_percentage === 100 && magnet.unlock_state === 'ready_to_go',
      }
    })

    // Strict collision resolution pass over all placements
    const combined = [...existingPlacements, ...newPlacements]
    const resolvedCombined = resolveMagnetOverlaps(combined)

    return resolvedCombined.slice(existingPlacements.length)
  },

  /**
   * Reset and auto-arrange all magnets on the fridge into clean non-overlapping positions
   */
  autoArrangeAll(
    userId: string,
    modelId: string,
    currentMagnets: FridgeMagnetItem[]
  ): MagnetPlacement[] {
    const arranged = this.generateAutoLayout(currentMagnets, 0, [])
    const resolved = resolveMagnetOverlaps(arranged)
    this.saveFridgePlacements(userId, modelId, resolved, 'autoArrangeAll')
    return resolved
  },
}
