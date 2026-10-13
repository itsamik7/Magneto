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
    currentMagnets: FridgeMagnetItem[] = []
  ): MagnetPlacement[] {
    const key = `magneto_fridge_placements_${userId}_${modelId}`
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

    // Filter out placements for magnets that the user no longer possesses
    if (currentMagnets.length > 0) {
      const currentIds = new Set(currentMagnets.map((m) => m.id))
      placements = placements.filter((p) => currentIds.has(p.id))

      // Identify unplaced magnets
      const placedIds = new Set(placements.map((p) => p.id))
      const unplaced = currentMagnets.filter((m) => !placedIds.has(m.id))

      if (unplaced.length > 0) {
        // Compute positions for newly added magnets
        const newPlacements = this.generateAutoLayout(
          unplaced,
          placements.length,
          placements
        )
        placements = [...placements, ...newPlacements]
        // Persist updated list
        this.saveFridgePlacements(userId, modelId, placements)
      }
    }

    return placements
  },

  /**
   * Save magnet placements for a user and fridge model
   */
  saveFridgePlacements(
    userId: string,
    modelId: string,
    placements: MagnetPlacement[]
  ): void {
    const key = `magneto_fridge_placements_${userId}_${modelId}`
    safeStorage.setItem(key, JSON.stringify(placements))
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

      const x = Math.min(0.85, Math.max(0.15, baseX + jitterX))
      const y = Math.min(0.85, Math.max(0.12, baseY + jitterY))

      return {
        id: magnet.id,
        magnetSlug: magnet.destination_slug,
        destinationName: magnet.destination_name,
        assetUrl: magnet.asset_url,
        x,
        y,
        scale: 1.0,
        rotation,
        zIndex: globalIdx + 1,
        tripId: magnet.trip_id,
        unlockState: magnet.unlock_state || 'dreaming',
        progressPercentage: magnet.progress_percentage || 0,
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
