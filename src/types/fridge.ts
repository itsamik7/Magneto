export type FridgeStyle =
  | 'Single-door'
  | 'Double-door'
  | 'Top-freezer'
  | 'Bottom-freezer'
  | 'Side-by-side'
  | 'French-door'
  | 'Multi-door'
  | 'Retro-style'
  | 'Compact'

export type FridgeCountryCategory = 'All' | 'Indian' | 'International'

export interface MagneticRegion {
  /** Normalized fraction from top of fridge image (0..1) */
  top: number
  /** Normalized fraction from left of fridge image (0..1) */
  left: number
  /** Normalized width of magnetic surface (0..1) */
  width: number
  /** Normalized height of magnetic surface (0..1) */
  height: number
}

export interface FridgeModel {
  id: string
  name: string
  brand: string
  style: FridgeStyle
  finish: string
  colorHex: string
  countryCategory: 'Indian' | 'International'
  imageUrl: string
  aspectRatio: number // width / height, e.g. 0.58
  magneticRegion: MagneticRegion
  description: string
  features: string[]
  isCustom?: boolean
}

export interface MagnetPlacement {
  id: string
  magnetSlug: string
  destinationName: string
  assetUrl: string
  /** Normalized position X (0..1) within magneticRegion */
  x: number
  /** Normalized position Y (0..1) within magneticRegion */
  y: number
  /** Scale factor (0.5 to 2.5, default 1.0) */
  scale: number
  /** Rotation angle in degrees (-45 to 45) */
  rotation: number
  /** Stacking order */
  zIndex: number
  /** Optional linked trip ID */
  tripId?: string | null
  /** Optional progress state */
  unlockState?: 'dreaming' | 'saving' | 'ready_to_go'
  progressPercentage?: number
  totalSavedMinor?: number
  targetBudgetMinor?: number
  isFundedPending?: boolean
  hasLock?: boolean
}

export interface UserFridgeConfiguration {
  id: string
  userId: string
  name: string
  modelId: string
  customImageBase64?: string
  placements: MagnetPlacement[]
  createdAt: string
  updatedAt: string
}
