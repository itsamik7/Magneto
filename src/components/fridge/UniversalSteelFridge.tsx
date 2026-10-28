import React, { useRef, useState, useEffect } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import type { FridgeProduct, StackingArrangement, FridgeShelf } from '../../types/fridgeProduct'
import {
  SHELF_DEFINITIONS,
  getProductDimensions,
  type ProductVisualDimensions,
} from '../../types/fridgeProduct'
import {
  getPublicActiveProducts,
  FRIDGE_PRODUCTS_UPDATED_EVENT,
  moveProduct,
} from '../../services/fridgeProductService'
import {
  DoorClosed,
  Snowflake,
  Droplets,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export interface UniversalSteelFridgeProps {
  allowDoorOpen?: boolean
  isDoorOpen?: boolean
  onToggleDoor?: () => void
  isMainDoorOpen?: boolean
  isFreezerDoorOpen?: boolean
  onToggleMainDoor?: () => void
  onToggleFreezerDoor?: () => void
  /** Optional controlled state for sliding crisper drawer */
  isCrisperOpen?: boolean
  /** Optional callback when crisper drawer is toggled */
  onToggleCrisper?: () => void
  /** Optional controlled state for freezer door */
  isFreezerOpen?: boolean
  /** Optional callback when freezer door is toggled */
  onToggleFreezer?: () => void
  magneticRegion: MagneticRegion
  surfaceRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
  isDragOver?: boolean
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onSurfaceClick?: (e: React.MouseEvent) => void
  aspectRatio?: number
  isEditable?: boolean
  yaw?: number
  onYawChange?: (newYaw: number) => void
  /** Optional custom or override list of interior products */
  products?: FridgeProduct[]
  /** Optional product ID currently being edited to display a luminous focus ring */
  highlightedProductId?: string
  /** Optional callback when a user taps a product in the fridge */
  onSelectProduct?: (product: FridgeProduct) => void
  /** Optional callback when a product is dragged to a new shelf or position */
  onMoveProduct?: (productId: string, newShelf: FridgeShelf, newPositionX: number) => void
}

interface RenderUnit {
  key: string
  offsetX: number
  offsetY: number
  scaleFactor: number
  zIndex: number
}

/**
 * Calculates physical spatial offsets for multi-unit product arrangements.
 * Supports single, row, depth (staggered 2-row), grid, and vertical stacking.
 */
function calculateProductUnits(
  count: number = 1,
  arrangement: StackingArrangement = 'single',
  spacing: number = 18,
  dims?: ProductVisualDimensions
): RenderUnit[] {
  const safeCount = Math.max(1, Math.min(12, count))

  if (safeCount === 1 || arrangement === 'single') {
    return [{ key: 'unit-0', offsetX: 0, offsetY: 0, scaleFactor: 1.0, zIndex: 10 }]
  }

  if (arrangement === 'row') {
    const units: RenderUnit[] = []
    const effSpacing = dims ? Math.max(dims.widthPx * 0.75, spacing) : spacing
    for (let i = 0; i < safeCount; i++) {
      const offsetX = (i - (safeCount - 1) / 2) * effSpacing
      units.push({
        key: `unit-${i}`,
        offsetX,
        offsetY: 0, // Every row unit rests firmly on the shelf surface
        scaleFactor: 1.0,
        zIndex: 10 + i,
      })
    }
    return units
  }

  if (arrangement === 'depth') {
    const units: RenderUnit[] = []
    const effSpacing = dims ? Math.max(dims.widthPx * 0.75, spacing) : spacing
    const cols = Math.ceil(safeCount / 2)
    for (let i = 0; i < safeCount; i++) {
      const isBack = i % 2 === 1
      const colIndex = Math.floor(i / 2)
      const offsetX = (colIndex - (cols - 1) / 2) * effSpacing + (isBack ? effSpacing * 0.35 : 0)
      // Back units recede into perspective depth (-Z) by sitting slightly higher with slight scale down
      const offsetY = isBack ? -6 : 0
      const scaleFactor = isBack ? 0.92 : 1.0
      units.push({
        key: `unit-${i}`,
        offsetX,
        offsetY,
        scaleFactor,
        zIndex: isBack ? 5 + colIndex : 15 + colIndex,
      })
    }
    return units
  }

  if (arrangement === 'grid') {
    const units: RenderUnit[] = []
    const effSpacing = dims ? Math.max(dims.widthPx * 0.75, spacing) : spacing
    const cols = safeCount > 4 ? 3 : 2
    for (let i = 0; i < safeCount; i++) {
      const c = i % cols
      const r = Math.floor(i / cols)
      const offsetX = (c - (cols - 1) / 2) * effSpacing
      // Front row at offsetY = 0 (on shelf), back rows recede into shelf depth
      const offsetY = -r * Math.max(5, effSpacing * 0.3)
      const scaleFactor = Math.max(0.86, 1.0 - r * 0.05)
      units.push({
        key: `unit-${i}`,
        offsetX,
        offsetY,
        scaleFactor,
        zIndex: 10 + (2 - r) * 5 + c,
      })
    }
    return units
  }

  if (arrangement === 'stack') {
    const units: RenderUnit[] = []
    // Physical vertical step for stacking items on top of one another
    const effStep = dims ? Math.max(12, dims.heightPx * 0.72) : Math.max(12, spacing * 0.7)
    for (let i = 0; i < safeCount; i++) {
      units.push({
        key: `unit-${i}`,
        offsetX: 0,
        offsetY: -i * effStep, // Unit 0 rests on shelf, subsequent units stack upwards
        scaleFactor: 1.0,
        zIndex: 10 + i,
      })
    }
    return units
  }

  return [{ key: 'unit-0', offsetX: 0, offsetY: 0, scaleFactor: 1.0, zIndex: 10 }]
}

export const UniversalSteelFridge: React.FC<UniversalSteelFridgeProps> = ({
  allowDoorOpen = false,
  isDoorOpen,
  onToggleDoor,
  isMainDoorOpen,
  isFreezerDoorOpen,
  onToggleMainDoor,
  onToggleFreezerDoor,
  isCrisperOpen: propCrisperOpen,
  onToggleCrisper,
  isFreezerOpen: propFreezerOpen,
  onToggleFreezer,
  magneticRegion,
  surfaceRef,
  children,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onSurfaceClick,
  aspectRatio = 0.47,
  yaw = 0,
  onYawChange,
  products: propProducts,
  highlightedProductId,
  onSelectProduct,
  onMoveProduct,
}) => {
  // Feature flags for temporary simplification: doors remain closed application-wide
  const ENABLE_DOOR_OPENING = allowDoorOpen && false
  const RENDER_INTERIOR_SHELVES = false
  const RENDER_INTERIOR_PRODUCTS = false

  const isEffectiveOpen = ENABLE_DOOR_OPENING
    ? (isMainDoorOpen !== undefined
      ? isMainDoorOpen
      : isDoorOpen !== undefined
        ? isDoorOpen
        : false)
    : false

  const [internalProducts, setInternalProducts] = useState<FridgeProduct[]>([])
  const [internalCrisperOpen, setInternalCrisperOpen] = useState(
    propCrisperOpen !== undefined ? propCrisperOpen : false
  )
  const [internalFreezerOpen, setInternalFreezerOpen] = useState(
    propFreezerOpen !== undefined
      ? propFreezerOpen
      : isFreezerDoorOpen !== undefined
        ? isFreezerDoorOpen
        : false
  )

  useEffect(() => {
    if (propCrisperOpen !== undefined) {
      setInternalCrisperOpen(propCrisperOpen)
    }
  }, [propCrisperOpen])

  useEffect(() => {
    if (propFreezerOpen !== undefined) {
      setInternalFreezerOpen(propFreezerOpen)
    } else if (isFreezerDoorOpen !== undefined) {
      setInternalFreezerOpen(isFreezerDoorOpen)
    }
  }, [propFreezerOpen, isFreezerDoorOpen])

  const cavityRef = useRef<HTMLDivElement>(null)
  const doorRef = useRef<HTMLDivElement>(null)
  const [activeDrag, setActiveDrag] = useState<{
    productId: string
    shelf: FridgeShelf
    positionX: number
  } | null>(null)

  const crisperOpen = propCrisperOpen !== undefined ? propCrisperOpen : internalCrisperOpen
  const freezerOpen = propFreezerOpen !== undefined ? propFreezerOpen : internalFreezerOpen

  const handleToggleCrisper = (e?: React.MouseEvent) => {
    if (!ENABLE_DOOR_OPENING) return
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setInternalCrisperOpen((prev) => !prev)
    if (onToggleCrisper) onToggleCrisper()
  }

  const handleToggleFreezer = (e?: React.MouseEvent) => {
    if (!ENABLE_DOOR_OPENING) return
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setInternalFreezerOpen((prev) => !prev)
    if (onToggleFreezer) onToggleFreezer()
    else if (onToggleFreezerDoor) onToggleFreezerDoor()
  }

  const handleProductPointerDown = (
    e: React.PointerEvent,
    product: FridgeProduct,
    containerType: 'shelf' | 'crisper' | 'freezer' | 'door'
  ) => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    let hasMoved = false
    let lastTarget: { shelf: FridgeShelf; positionX: number } | null = null

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY)
      if (dist > 5) {
        hasMoved = true
      }

      if (!hasMoved) return

      if (containerType === 'door') {
        const rect = doorRef.current?.getBoundingClientRect()
        if (!rect) return
        const pctX = Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)
        const pctY = Math.round(((moveEvent.clientY - rect.top) / rect.height) * 100)

        let targetShelf: FridgeShelf = 'door_bin_middle'
        if (pctY < 36) targetShelf = 'door_bin_top'
        else if (pctY >= 66) targetShelf = 'door_bin_bottom'
        else targetShelf = 'door_bin_middle'

        const shelfDef = SHELF_DEFINITIONS[targetShelf]
        const clampedX = Math.max(
          shelfDef.horizontalRange[0],
          Math.min(shelfDef.horizontalRange[1], pctX)
        )

        lastTarget = { shelf: targetShelf, positionX: clampedX }
        setActiveDrag({ productId: product.id, shelf: targetShelf, positionX: clampedX })

        if (onMoveProduct) {
          onMoveProduct(product.id, targetShelf, clampedX)
        } else {
          setInternalProducts((prev) =>
            prev.map((p) =>
              p.id === product.id ? { ...p, shelf: targetShelf, positionX: clampedX } : p
            )
          )
        }
      } else {
        const rect = cavityRef.current?.getBoundingClientRect()
        if (!rect) return
        const pctX = Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)
        const pctY = Math.round(((moveEvent.clientY - rect.top) / rect.height) * 100)

        // Accurate physical shelf boundary detection across all 5 cavity zones:
        let targetShelf: FridgeShelf = 'middle_shelf'
        if (pctY < 24) targetShelf = 'freezer'
        else if (pctY >= 76) targetShelf = 'crisper_drawer'
        else if (pctY < 48) targetShelf = 'top_shelf'
        else if (pctY >= 63) targetShelf = 'bottom_shelf'
        else targetShelf = 'middle_shelf'

        const shelfDef = SHELF_DEFINITIONS[targetShelf]
        const clampedX = Math.max(
          shelfDef.horizontalRange[0],
          Math.min(shelfDef.horizontalRange[1], pctX)
        )

        lastTarget = { shelf: targetShelf, positionX: clampedX }
        setActiveDrag({ productId: product.id, shelf: targetShelf, positionX: clampedX })

        if (onMoveProduct) {
          onMoveProduct(product.id, targetShelf, clampedX)
        } else {
          setInternalProducts((prev) =>
            prev.map((p) =>
              p.id === product.id ? { ...p, shelf: targetShelf, positionX: clampedX } : p
            )
          )
        }
      }
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      setActiveDrag(null)

      if (hasMoved && lastTarget) {
        if (onMoveProduct) {
          onMoveProduct(product.id, lastTarget.shelf, lastTarget.positionX)
        } else {
          setInternalProducts((prev) =>
            prev.map((p) =>
              p.id === product.id
                ? { ...p, shelf: lastTarget!.shelf, positionX: lastTarget!.positionX }
                : p
            )
          )
        }
        // Save to persistent storage & notify any listening views
        moveProduct(product.id, lastTarget.shelf, lastTarget.positionX)
      } else if (!hasMoved && onSelectProduct) {
        onSelectProduct(product)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  // Auto-close internal drawer and freezer when main door closes
  useEffect(() => {
    if (!isEffectiveOpen) {
      setInternalCrisperOpen(false)
      setInternalFreezerOpen(false)
    }
  }, [isEffectiveOpen])

  useEffect(() => {
    let isMounted = true
    getPublicActiveProducts().then((loaded) => {
      if (isMounted) setInternalProducts(loaded)
    })

    const handleUpdate = () => {
      getPublicActiveProducts().then((loaded) => {
        if (isMounted) setInternalProducts(loaded)
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate)
      window.addEventListener('storage', handleUpdate)
    }

    return () => {
      isMounted = false
      if (typeof window !== 'undefined') {
        window.removeEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate)
        window.removeEventListener('storage', handleUpdate)
      }
    }
  }, [])

  // Use explicitly passed products (e.g. from Admin preview) or internal live products
  const activeProducts = (propProducts ?? internalProducts).filter(
    (p) => p.isActive && !p.isArchived
  )

  const cavityProducts = activeProducts.filter(
    (p) => SHELF_DEFINITIONS[p.shelf]?.location === 'cavity' || !SHELF_DEFINITIONS[p.shelf]
  )
  const freezerProducts = activeProducts.filter((p) => p.shelf === 'freezer')
  const crisperProducts = activeProducts.filter((p) => p.shelf === 'crisper_drawer')
  const doorProducts = activeProducts.filter(
    (p) => SHELF_DEFINITIONS[p.shelf]?.location === 'door'
  )

  const isAnimatingRef = useRef(false)

  const handleToggle = (e?: React.MouseEvent) => {
    if (!ENABLE_DOOR_OPENING) return
    if (e) {
      e.stopPropagation()
    }
    // Debounce rapid clicking during transition to prevent animation glitching
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 600)

    const willBeOpen = !isEffectiveOpen
    if (onYawChange) {
      onYawChange(willBeOpen ? -45 : 0)
    }

    if (onToggleMainDoor) {
      onToggleMainDoor()
    } else if (onToggleDoor) {
      onToggleDoor()
    }
  }

  /**
   * Helper to render a product with physically anchored bottom placement and realistic ambient contact shadows
   */
  const renderProductCluster = (
    product: FridgeProduct,
    baseLeftPercent: number,
    baseBaselinePercent: number,
    baseScale: number = 1.0,
    containerType: 'shelf' | 'crisper' | 'freezer' | 'door' = 'shelf'
  ) => {
    const isHighlighted =
      Boolean(highlightedProductId && product.id === highlightedProductId) ||
      product.id.startsWith('draft-')
    const isBeingDragged = activeDrag?.productId === product.id

    const count = Math.max(1, Math.min(12, product.itemCount || 1))
    const arrangement = product.arrangement || 'single'
    const spacing = Math.max(10, Math.min(45, product.spacing || 18))
    const dims = getProductDimensions(product)
    const units = calculateProductUnits(count, arrangement, spacing, dims)

    return (
      <div
        key={product.id}
        style={{
          position: 'absolute',
          top: `${baseBaselinePercent}%`,
          left: `${baseLeftPercent}%`,
          transform: `translate(-50%, -100%) scale(${baseScale})`,
          transformOrigin: 'bottom center',
          zIndex:
            isHighlighted || isBeingDragged
              ? 45
              : containerType === 'crisper'
                ? 30
                : containerType === 'door'
                  ? 15
                  : 20,
          touchAction: 'none',
        }}
        className={`group/product pointer-events-auto transition-transform duration-150 select-none cursor-grab active:cursor-grabbing ${
          isHighlighted ? 'scale-105' : 'hover:scale-105'
        } ${isBeingDragged ? 'opacity-90 scale-105' : ''}`}
        title={`${product.name} (${product.category}${product.quantity ? ` • ${product.quantity}` : ''}${
          count > 1 ? ` • ${count} units` : ''
        }) - Drag to reposition on shelf`}
        onPointerDown={(e) => {
          e.stopPropagation()
          handleProductPointerDown(e, product, containerType)
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (onSelectProduct) {
            onSelectProduct(product)
          }
        }}
      >
        {/* Luminous indicator if currently being edited */}
        {isHighlighted && (
          <div className="absolute left-1/2 -top-8 -translate-x-1/2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap pointer-events-none z-50 animate-pulse border border-white/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              Live Edit {count > 1 ? `(${count})` : ''}
            </span>
          </div>
        )}

        {/* Hover Tooltip */}
        <div className="absolute left-1/2 -top-9 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-slate-900/95 backdrop-blur-md text-white text-[9px] font-medium whitespace-nowrap opacity-0 group-hover/product:opacity-100 transition-opacity duration-150 pointer-events-none border border-white/20 shadow-xl z-50 flex items-center gap-1.5">
          <span className="font-bold">{product.name}</span>
          {count > 1 && (
            <span className="px-1 py-0.2 rounded-xs bg-blue-500/30 text-blue-300 font-mono text-[8px] font-bold">
              {count}x {arrangement}
            </span>
          )}
          {product.quantity && (
            <span className="text-amber-300 font-semibold text-[8px]">
              [{product.quantity}]
            </span>
          )}
        </div>

        {/* Render Units anchored to bottom shelf surface */}
        <div
          className="relative flex items-end justify-center"
          style={{ width: `${dims.widthPx}px`, height: `${dims.heightPx}px` }}
        >
          {units.map((unit) => {
            const isGroundUnit = unit.offsetY === 0

            return (
              <div
                key={unit.key}
                style={{
                  position: unit.key === 'unit-0' ? 'relative' : 'absolute',
                  bottom: 0,
                  transform: `translate(${unit.offsetX}px, ${unit.offsetY}px) scale(${unit.scaleFactor})`,
                  transformOrigin: 'bottom center',
                  zIndex: unit.zIndex,
                  width: `${dims.widthPx}px`,
                  height: `${dims.heightPx}px`,
                }}
                className="flex flex-col items-center justify-end transition-transform duration-200"
              >
                {/* Physical Contact Shadow & Ambient Occlusion (Casted onto shelf by ground units) */}
                {isGroundUnit && (
                  <>
                    {/* 1. Deep Core Ambient Occlusion Line */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        left: `${(100 - dims.shadowWidthPercent) / 2}%`,
                        width: `${dims.shadowWidthPercent}%`,
                        height: '3.5px',
                        background:
                          dims.shadowShape === 'rounded-rect'
                            ? 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.45) 55%, transparent 85%)'
                            : 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.4) 50%, transparent 80%)',
                        borderRadius: dims.shadowShape === 'rounded-rect' ? '2px' : '9999px',
                        filter: 'blur(0.6px)',
                        zIndex: -1,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* 2. Soft Ambient Contact Shadow */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-3.5px',
                        left: `${(100 - (dims.shadowWidthPercent + 12)) / 2}%`,
                        width: `${dims.shadowWidthPercent + 12}%`,
                        height: '6.5px',
                        background:
                          'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.42) 0%, rgba(15, 23, 42, 0.16) 50%, transparent 80%)',
                        borderRadius: '9999px',
                        filter: 'blur(1.8px)',
                        zIndex: -2,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* 3. Translucent Glass Specular Highlight (Tempered Glass Shelves) */}
                    {containerType === 'shelf' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '0px',
                          left: '10%',
                          right: '10%',
                          height: '1px',
                          background:
                            'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                          zIndex: -1,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </>
                )}

                {/* Stacked Inter-Unit Contact Shadow (for stacked units resting on top of another unit) */}
                {!isGroundUnit && arrangement === 'stack' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '8%',
                      right: '8%',
                      height: '4px',
                      background:
                        'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 80%)',
                      filter: 'blur(1px)',
                      zIndex: -1,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Product Graphic with bottom-anchored object position */}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'bottom center',
                  }}
                  className={`select-none filter drop-shadow-md transition-all ${
                    isHighlighted
                      ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 rounded-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                      : ''
                  }`}
                  draggable={false}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * Helper to render a physical 3D tempered glass shelf with green-tinted polished edges,
   * specular lighting, front brushed chrome guardrail trim, wall brackets, and underside drop shadow.
   */
  const renderGlassShelf = (shelfKey: FridgeShelf) => {
    const shelfDef = SHELF_DEFINITIONS[shelfKey]
    const isTargeted = activeDrag?.shelf === shelfKey
    return (
      <div
        key={shelfKey}
        style={{
          position: 'absolute',
          top: `${shelfDef.surfaceTopPercent}%`,
          left: '4%',
          right: '4%',
          height: '6px',
          zIndex: 22,
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
        }}
        className="select-none"
      >
        {/* Molded Left Wall Support Bracket */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            width: '8px',
            height: '11px',
          }}
          className="rounded-r-xs bg-gradient-to-r from-slate-400 via-slate-300 to-slate-200 border border-slate-300 shadow-inner"
        />

        {/* Molded Right Wall Support Bracket */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '11px',
          }}
          className="rounded-l-xs bg-gradient-to-l from-slate-400 via-slate-300 to-slate-200 border border-slate-300 shadow-inner"
        />

        {/* 3D Tempered Glass Slab (Green-tinted polished crystal core) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(167, 243, 208, 0.25) 50%, rgba(110, 231, 183, 0.3) 100%)',
            backdropFilter: 'blur(1.5px)',
            borderRadius: '1.5px',
            borderTop: '1px solid rgba(255, 255, 255, 0.9)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: isTargeted
              ? '0 0 14px rgba(59, 130, 246, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
              : 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(15, 23, 42, 0.12)',
            transition: 'all 200ms ease',
          }}
          className="overflow-hidden"
        >
          {/* Specular Glare across Glass Surface */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
        </div>

        {/* Front Polished Brushed Chrome Trim Lip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3.5px',
            transform: 'translateZ(2px)',
          }}
          className={`rounded-b-xs bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border-t border-white/90 border-b border-slate-400 shadow-xs transition-colors ${
            isTargeted
              ? 'bg-gradient-to-r from-blue-400 via-sky-200 to-blue-400 border-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.9)]'
              : ''
          }`}
        />

        {/* Underside Drop Shadow onto Cavity below */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '1%',
            right: '1%',
            height: '10px',
            background:
              'linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.08) 50%, transparent 100%)',
            filter: 'blur(1px)',
          }}
        />

        {/* Drop Target Indicator Badge when dragging */}
        {isTargeted && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600/95 text-white text-[7.5px] font-black tracking-wider uppercase shadow-lg border border-blue-300 animate-pulse flex items-center gap-1 z-30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            <span>Snap to {shelfDef.label.split(' ')[0]} Shelf</span>
          </div>
        )}
      </div>
    )
  }



  return (
    <div className="w-full flex flex-col items-center select-none overflow-visible">
      {/* 
        ========================================================================
        THE REFRIGERATOR 3D APPLIANCE STAGE
        Isolated appliance with overflow-visible to guarantee the swinging door is never clipped.
        ========================================================================
      */}
      <div
        style={{
          width: 'clamp(220px, min(74vw, calc((100dvh - 160px) * 0.47)), 300px)',
          aspectRatio: `${aspectRatio}`,
          perspective: '1400px',
          transformStyle: 'preserve-3d',
          overflow: 'visible',
        }}
        className="relative mx-auto overflow-visible"
      >
        {/* Ground Contact Shadow under the 3D Appliance */}
        <div
          style={{
            position: 'absolute',
            bottom: '-16px',
            left: '-10%',
            right: '-10%',
            height: '32px',
            background:
              'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.1) 45%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
            transform: `translateX(${isEffectiveOpen ? 15 : 0}px)`,
            transition: 'transform 600ms cubic-bezier(0.25, 1, 0.4, 1)',
          }}
        />

        {/* 
          3D Turntable Wrapper
          Orbits smoothly around the Y-axis as controlled by the slider below.
          Shifts slightly right when the door opens to ensure the swinging door remains centered and uncropped.
        */}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `translateX(${isEffectiveOpen ? 30 : 0}px) rotateY(${yaw}deg)`,
            transition: 'transform 600ms cubic-bezier(0.25, 1, 0.4, 1)',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {/* 3D Left Cabinet Side Panel (folds into -Z depth behind the front face) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '-65px',
              width: '65px',
              transformOrigin: 'right center',
              transform: 'rotateY(-90deg)',
              backfaceVisibility: 'hidden',
              zIndex: 5,
            }}
            className="border-r border-slate-300/80 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-200 shadow-xl overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] pointer-events-none" />
          </div>

          {/* Top Heavy-Duty Chrome/Steel Hinge Bracket */}
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              left: '-2px',
              width: '34px',
              height: '11px',
              transform: 'translateZ(10px)',
              zIndex: 40,
            }}
            className="rounded-xs bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border border-slate-300 shadow-xs flex items-center justify-between px-1 pointer-events-none"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>

          {/* 3D Right Cabinet Side Panel (folds into -Z depth behind the front face) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '100%',
              width: '65px',
              transformOrigin: 'left center',
              transform: 'rotateY(90deg)',
              backfaceVisibility: 'hidden',
              zIndex: 5,
            }}
            className="border-l border-slate-300/80 bg-gradient-to-l from-slate-400 via-slate-300 to-slate-200 shadow-xl overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* 3D Top Cabinet Roof (folds into -Z depth behind the front top edge) */}
          <div
            style={{
              position: 'absolute',
              top: '-65px',
              left: 0,
              right: 0,
              height: '65px',
              transformOrigin: 'center bottom',
              transform: 'rotateX(90deg)',
              backfaceVisibility: 'hidden',
              zIndex: 5,
            }}
            className="border-b border-slate-300/80 bg-gradient-to-t from-slate-200 via-slate-300 to-slate-400 shadow-inner overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/5 to-black/20 pointer-events-none" />
          </div>

          {/* 
            ========================================================================
            1. REFRIGERATOR INTERIOR CAVITY
            Tempered glass shelves with chrome lips, interactive sub-zero freezer,
            interactive sliding crisper drawer, and 5000K daylight LED.
            ========================================================================
          */}
          <div
            ref={cavityRef}
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'translateZ(-4px)',
              transformStyle: 'preserve-3d',
              zIndex: isEffectiveOpen ? 25 : 5,
            }}
            className="rounded-lg shadow-2xl overflow-visible bg-slate-100 border border-slate-400/80 pointer-events-auto select-none"
          >
            {/* Background container: clips ONLY the interior background photo & lighting gradient to the cabinet rounded corners */}
            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
              {/* Photorealistic Pure Cavity Background Image */}
              <img
                src="/fridges/realistic-fridge-interior.png"
                alt="Illuminated Refrigerator Interior Cavity"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Natural Interior Lighting Engine */}
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
                  isEffectiveOpen ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute top-0 inset-x-4 h-28 bg-gradient-to-b from-white/80 via-sky-100/20 to-transparent blur-xs pointer-events-none" />
                <div className="absolute top-[28%] inset-x-2 h-6 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                <div className="absolute top-[48%] inset-x-2 h-6 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              </div>
            </div>



            {/* 
              --------------------------------------------------------------------
              B. DYNAMIC PRODUCTS ON CAVITY GLASS SHELVES
              Upper Glass Shelf (top_shelf: glass surface at 44.8%)
              Middle Glass Shelf (middle_shelf: glass surface at 60.1%)
              Lower Glass Shelf (bottom_shelf: glass surface at 73.4%)
              --------------------------------------------------------------------
            */}
            {/* Physical 3D Tempered Glass Shelves (temporarily disabled per instructions) */}
            {RENDER_INTERIOR_SHELVES && (
              <>
                {renderGlassShelf('top_shelf')}
                {renderGlassShelf('middle_shelf')}
                {renderGlassShelf('bottom_shelf')}
                {renderGlassShelf('crisper_drawer')}
              </>
            )}

            {RENDER_INTERIOR_PRODUCTS && (
              <div className="absolute inset-0 pointer-events-none opacity-100">
                {/* Shelf Snap Guideline Highlight during drag */}
                {activeDrag && (
                  <>
                    {activeDrag.shelf === 'top_shelf' && (
                      <div className="absolute top-[44.8%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                    )}
                    {activeDrag.shelf === 'middle_shelf' && (
                      <div className="absolute top-[60.1%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                    )}
                    {activeDrag.shelf === 'bottom_shelf' && (
                      <div className="absolute top-[73.4%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                    )}
                    {activeDrag.shelf === 'crisper_drawer' && (
                      <div className="absolute top-[86.5%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                    )}
                  </>
                )}

                {cavityProducts.map((product) => {
                  const shelfDef = SHELF_DEFINITIONS[product.shelf] || SHELF_DEFINITIONS.middle_shelf
                  const leftPos = Math.max(
                    shelfDef.horizontalRange[0],
                    Math.min(shelfDef.horizontalRange[1], product.positionX)
                  )
                  const baselinePos = shelfDef.surfaceTopPercent
                  const scale = Math.max(0.4, Math.min(2.0, product.displayScale || 1.0))

                  return renderProductCluster(product, leftPos, baselinePos, scale, 'shelf')
                })}
              </div>
            )}
          </div>

          {/* 
            ========================================================================
            2. 3D SWINGING REFRIGERATOR DOOR
            Rotates around its left hinge when clicked.
            Magnets live on the front face of this door and move WITH it in 3D!
            ========================================================================
          */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'left center',
              transform: isEffectiveOpen ? 'rotateY(-78deg)' : 'rotateY(0deg)',
              transition: 'transform 600ms cubic-bezier(0.25, 1, 0.4, 1)',
              transformStyle: 'preserve-3d',
              zIndex: isEffectiveOpen ? 20 : 30,
              pointerEvents: 'auto',
            }}
          >
            {/* 
              FRONT FACE OF THE DOOR (EXTERIOR):
              Brushed platinum stainless steel with integrated "MAGNETO" OLED display,
              chrome handle, and the unified magnetic surface.
            */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'translateZ(8px)',
                backfaceVisibility: 'hidden',
              }}
              className={`rounded-lg shadow-2xl overflow-hidden bg-slate-200 border border-slate-400 ${
                isEffectiveOpen ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            >
              {/* Clean Cropped Stainless Steel Door Image (Zero White Margins) */}
              <img
                src="/fridges/premium-steel-door-closed.png"
                alt="Stainless Steel Refrigerator Door"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Ambient Specular Highlight Sheen */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* 
                UNIFIED USABLE MAGNETIC SURFACE
                Spans the face of the door so magnets can be dragged from near the top edge
                all the way down without clipping or artificial boundary restrictions.
              */}
              <div
                ref={surfaceRef}
                onClick={(e) => {
                  if (onSurfaceClick) onSurfaceClick(e)
                }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                style={{
                  position: 'absolute',
                  top: `${magneticRegion.top * 100}%`,
                  left: `${magneticRegion.left * 100}%`,
                  width: `${magneticRegion.width * 100}%`,
                  height: `${magneticRegion.height * 100}%`,
                }}
                className={`relative select-none ${
                  isEffectiveOpen ? 'pointer-events-none' : 'cursor-default'
                } z-20 ${
                  isDragOver ? 'ring-4 ring-blue-500/50 bg-blue-500/10 rounded-lg' : ''
                }`}
              >
                {children}
              </div>

              {/* 
                REFRIGERATOR CHROME HANDLE
                Opening interaction temporarily disabled per instructions.
              */}
              <div
                role={ENABLE_DOOR_OPENING ? 'button' : undefined}
                tabIndex={ENABLE_DOOR_OPENING ? 0 : -1}
                onClick={
                  ENABLE_DOOR_OPENING
                    ? (e) => {
                        e.stopPropagation()
                        handleToggle()
                      }
                    : undefined
                }
                onKeyDown={
                  ENABLE_DOOR_OPENING
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggle()
                        }
                      }
                    : undefined
                }
                style={{
                  position: 'absolute',
                  top: '24%',
                  right: '0%',
                  width: '16%',
                  minWidth: '44px',
                  height: '40%',
                  zIndex: 35,
                }}
                className={`group select-none rounded-r-lg ${
                  ENABLE_DOOR_OPENING
                    ? 'cursor-pointer'
                    : 'cursor-default pointer-events-none'
                } ${isEffectiveOpen ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
                title={ENABLE_DOOR_OPENING ? 'Tap handle to open refrigerator door' : undefined}
                aria-label={ENABLE_DOOR_OPENING ? 'Open refrigerator door' : undefined}
              >
                <div className="absolute inset-0 rounded-r-lg pointer-events-none" />

                {ENABLE_DOOR_OPENING && (
                  <div className="absolute -left-20 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-heading font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap border border-white/20 flex items-center gap-1">
                    <span>Pull Handle</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3D Physical Door Right Edge (Thickness) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: '-8px',
                width: '16px',
                transformOrigin: 'center center',
                transform: 'rotateY(90deg)',
                backfaceVisibility: 'hidden',
              }}
              className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 border-l border-slate-300/80 shadow-xs pointer-events-none flex flex-col justify-center items-center"
            >
              <div className="w-1 h-[98%] rounded-full bg-slate-400/60 shadow-inner" />
            </div>

            {/* 
              BACK FACE OF THE DOOR (INNER DOOR-SIDE STORAGE):
              Revealed as the door swings open around its left hinge!
              Shows the authentic food-grade door liner, perimeter rubber gasket,
              and multi-tier door storage bins (dairy, condiments, chilled cans, tall bottles).
            */}
            <div
              ref={doorRef}
              role="button"
              tabIndex={isEffectiveOpen ? 0 : -1}
              onClick={(e) => {
                if (isEffectiveOpen) {
                  e.stopPropagation()
                  handleToggle(e)
                }
              }}
              onKeyDown={(e) => {
                if (isEffectiveOpen && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  e.stopPropagation()
                  handleToggle(e as unknown as React.MouseEvent)
                }
              }}
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'rotateY(180deg) translateZ(8px)',
                backfaceVisibility: 'hidden',
                cursor: isEffectiveOpen ? 'pointer' : 'default',
              }}
              className={`rounded-lg shadow-2xl overflow-hidden bg-white border border-slate-300 flex flex-col ${
                isEffectiveOpen ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
              }`}
              title={isEffectiveOpen ? 'Click door to close' : undefined}
              aria-label={isEffectiveOpen ? 'Click door to close' : undefined}
            >
              {/* Clean Inner Door Liner Face */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-200 pointer-events-none select-none rounded-lg" />

              {/* Perimeter Rubber Magnetic Gasket Seal */}
              <div className="absolute inset-1.5 rounded-md border-2 border-slate-300/80 shadow-inner pointer-events-none" />

              {/* Subtle Ambient Specular Reflection */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* Door Header Badge & Explicit Close Affordance Button */}
              <div className="relative z-30 m-2.5 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-white flex items-center justify-between border border-white/20 shadow-md">
                <div className="flex items-center gap-1.5 text-[9px] font-heading font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>DOOR INTERIOR</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggle()
                  }}
                  className="flex items-center gap-1 text-[8px] text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                  title="Click to close refrigerator door"
                >
                  <DoorClosed className="w-2.5 h-2.5 text-slate-200" />
                  <span>Click to Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
