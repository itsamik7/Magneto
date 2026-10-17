import type { FridgeProduct, FridgeShelf } from '../types/fridgeProduct'
import { SHELF_DEFINITIONS, getProductDimensions } from '../types/fridgeProduct'
import { calculateProductUnits } from '../components/fridge/interior/FridgeProductCluster'

export interface PlacementValidationResult {
  isValid: boolean
  safeShelf: FridgeShelf
  safePositionX: number
  halfWidthPercent: number
  minPermittedX: number
  maxPermittedX: number
  reason?: string
}

/** Estimated internal width in pixels of the refrigerator interior at standard scale */
export const CAVITY_WIDTH_PX = 260
export const DOOR_WIDTH_PX = 240

/**
 * Calculates the bounding horizontal span (in percent) of a product cluster,
 * taking into account item count, stacking arrangement, spacing, and model dimensions.
 */
export function calculateClusterHalfWidthPercent(
  product?: Partial<FridgeProduct> | null,
  containerType: 'cavity' | 'door' = 'cavity'
): number {
  if (!product) return 6
  const count = Math.max(1, Math.min(12, product.itemCount || 1))
  const arrangement = product.arrangement || 'single'
  const spacing = Math.max(10, Math.min(45, product.spacing || 18))
  const dims = getProductDimensions(product as FridgeProduct)
  const units = calculateProductUnits(count, arrangement, spacing, dims)

  let minOffset = 0
  let maxOffset = 0
  for (const u of units) {
    if (u.offsetX < minOffset) minOffset = u.offsetX
    if (u.offsetX > maxOffset) maxOffset = u.offsetX
  }

  const totalWidthPx = maxOffset - minOffset + dims.widthPx
  const containerWidthPx = containerType === 'door' ? DOOR_WIDTH_PX : CAVITY_WIDTH_PX
  const halfWidthPx = totalWidthPx / 2
  const halfWidthPercent = (halfWidthPx / containerWidthPx) * 100

  // Allow minimum buffer of 4%
  return Math.max(4, Math.round(halfWidthPercent * 10) / 10)
}

/**
 * Validates and safely clamps a product's horizontal position within the
 * permitted boundaries of the target shelf or door bin.
 * Prevents penetration into left/right side walls or going outside usable space.
 */
export function validateProductPlacement(
  product: FridgeProduct,
  targetShelf: FridgeShelf,
  requestedX: number
): PlacementValidationResult {
  const shelfDef = SHELF_DEFINITIONS[targetShelf] || SHELF_DEFINITIONS.middle_shelf
  const containerType = shelfDef.location === 'door' ? 'door' : 'cavity'
  const halfWidthPercent = calculateClusterHalfWidthPercent(product, containerType)

  const [shelfMin, shelfMax] = shelfDef.horizontalRange

  // Calculate safe inner boundaries accounting for physical bounding box
  const minPermittedX = Math.min(shelfMax - halfWidthPercent, shelfMin + halfWidthPercent)
  const maxPermittedX = Math.max(shelfMin + halfWidthPercent, shelfMax - halfWidthPercent)

  let safePositionX = requestedX
  let isValid = true
  let reason: string | undefined

  if (requestedX < minPermittedX) {
    isValid = false
    safePositionX = minPermittedX
    reason = `Position ${requestedX}% clamped to ${minPermittedX}% to prevent left wall intersection.`
  } else if (requestedX > maxPermittedX) {
    isValid = false
    safePositionX = maxPermittedX
    reason = `Position ${requestedX}% clamped to ${maxPermittedX}% to prevent right wall intersection.`
  }

  // Ensure within absolute shelf ranges
  safePositionX = Math.max(shelfMin, Math.min(shelfMax, Math.round(safePositionX)))

  return {
    isValid,
    safeShelf: shelfDef.id,
    safePositionX,
    halfWidthPercent,
    minPermittedX,
    maxPermittedX,
    reason,
  }
}

/**
 * Checks for collisions with other products on the same shelf and gently shifts
 * position if an exact overlap is detected.
 */
export function resolveShelfOverlap(
  existingProducts: FridgeProduct[],
  movingProduct: FridgeProduct,
  targetShelf: FridgeShelf,
  targetX: number
): number {
  const sameShelfItems = existingProducts.filter(
    (p) => p.id !== movingProduct.id && p.shelf === targetShelf && p.isActive && !p.isArchived
  )

  if (sameShelfItems.length === 0) {
    return targetX
  }

  const movingHalfWidth = calculateClusterHalfWidthPercent(movingProduct)
  let resolvedX = targetX

  for (const item of sameShelfItems) {
    const itemHalfWidth = calculateClusterHalfWidthPercent(item)
    const minDistance = movingHalfWidth + itemHalfWidth + 2 // 2% cushion

    const currentDist = Math.abs(resolvedX - item.positionX)
    if (currentDist < minDistance) {
      // Overlap detected: nudge toward the side with more space
      if (resolvedX >= item.positionX) {
        resolvedX = item.positionX + minDistance
      } else {
        resolvedX = item.positionX - minDistance
      }
    }
  }

  // Clamp again within shelf limits
  const validation = validateProductPlacement(movingProduct, targetShelf, resolvedX)
  return validation.safePositionX
}
