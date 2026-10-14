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

const DEFAULT_PRESET_POSITIONS: Record<string, { x: number; y: number; scale: number; rotation: number }> = {
  // Top Freezer Door:
  // Row 1: Ladakh (left), India Gate (center), Royal Elephant (right)
  'ladakh': { x: 0.22, y: 0.09, scale: 1.0, rotation: -1 },
  'delhi': { x: 0.52, y: 0.08, scale: 1.0, rotation: 0 },
  'india-gate': { x: 0.52, y: 0.08, scale: 1.0, rotation: 0 },
  'elephant': { x: 0.80, y: 0.09, scale: 1.0, rotation: 1 },
  'royal-elephant': { x: 0.80, y: 0.09, scale: 1.0, rotation: 1 },
  // Row 2: Goa (left), Taj Mahal (right)
  'goa': { x: 0.28, y: 0.22, scale: 1.0, rotation: 0 },
  'goa-beach': { x: 0.28, y: 0.22, scale: 1.0, rotation: 0 },
  'taj-mahal': { x: 0.72, y: 0.23, scale: 1.0, rotation: 0 },

  // Bottom Main Door:
  // Row 1: Paris (left), London Bus (center), New York (right)
  'paris': { x: 0.24, y: 0.40, scale: 1.0, rotation: 0 },
  'eiffel-tower': { x: 0.24, y: 0.40, scale: 1.0, rotation: 0 },
  'london': { x: 0.52, y: 0.39, scale: 1.0, rotation: 0 },
  'new-york': { x: 0.80, y: 0.41, scale: 1.0, rotation: 1 },
  // Row 2: Bali (center)
  'bali': { x: 0.52, y: 0.58, scale: 1.0, rotation: 0 },
  'bali-temple': { x: 0.52, y: 0.58, scale: 1.0, rotation: 0 },
  'japan': { x: 0.76, y: 0.58, scale: 1.0, rotation: -1 },
  // Row 3: Rome / Colosseum (left), Santorini (right)
  'rome': { x: 0.28, y: 0.76, scale: 1.0, rotation: -1 },
  'colosseum-rome': { x: 0.28, y: 0.76, scale: 1.0, rotation: -1 },
  'santorini': { x: 0.72, y: 0.77, scale: 1.0, rotation: 0 },
  'bangkok': { x: 0.52, y: 0.77, scale: 1.0, rotation: 0 },
  'thailand': { x: 0.52, y: 0.77, scale: 1.0, rotation: 0 },
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
    return placements.map((p) => {
      const x = Math.min(0.88, Math.max(0.12, p.x))
      const y = Math.min(0.88, Math.max(0.12, p.y))
      return {
        ...p,
        x,
        y,
      }
    })
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
   * Generate clean organic non-overlapping layout positions on the fridge door
   * Returns positions normalized from 0.1 to 0.9 within the magnetic region.
   */
  generateAutoLayout(
    magnets: FridgeMagnetItem[],
    startIndexOffset: number = 0,
    existingPlacements: MagnetPlacement[] = []
  ): MagnetPlacement[] {
    // 1, 2, or 3-column staggered layout depending on count
    const totalCount = magnets.length + existingPlacements.length
    const cols = totalCount > 10 ? 3 : totalCount <= 1 ? 1 : 2
    const rows = Math.ceil(totalCount / cols)

    return magnets.map((magnet, idx) => {
      const globalIdx = startIndexOffset + idx
      const row = Math.floor(globalIdx / cols)
      const col = globalIdx % cols

      // Calculate base normalized positions with slight organic offset
      // X range: 0.18 to 0.82
      const xSpacing = 0.68 / Math.max(1, cols - 1)
      const baseX = cols === 1 ? 0.5 : 0.16 + col * xSpacing

      // Y range: 0.14 to 0.86
      const ySpacing = rows > 1 ? 0.72 / Math.max(1, rows - 1) : 0
      const baseY = rows <= 1 ? 0.45 : 0.14 + row * ySpacing

      // Slight natural organic jitter so it looks like real fridge magnets placed by hand
      const jitterX = ((globalIdx * 17) % 7 - 3) * 0.015
      const jitterY = ((globalIdx * 23) % 7 - 3) * 0.015
      const rotation = (((globalIdx * 13) % 15) - 7) // -7 to +7 degrees

      const preset = DEFAULT_PRESET_POSITIONS[magnet.destination_slug.toLowerCase()]
      const finalX = preset ? preset.x : Math.min(0.85, Math.max(0.15, baseX + jitterX))
      const finalY = preset ? preset.y : Math.min(0.85, Math.max(0.12, baseY + jitterY))
      const finalRotation = preset ? preset.rotation : rotation
      const finalScale = preset ? preset.scale : 1.0

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
  },

  /**
   * Reset and auto-arrange all magnets on the fridge
   */
  autoArrangeAll(
    userId: string,
    modelId: string,
    currentMagnets: FridgeMagnetItem[]
  ): MagnetPlacement[] {
    const arranged = this.generateAutoLayout(currentMagnets, 0, [])
    this.saveFridgePlacements(userId, modelId, arranged)
    return arranged
  },
}
