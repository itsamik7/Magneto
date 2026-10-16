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
  Lightbulb,
  DoorClosed,
  Snowflake,
  Droplets,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export interface UniversalSteelFridgeProps {
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
  const [internalProducts, setInternalProducts] = useState<FridgeProduct[]>([])
  const [internalCrisperOpen, setInternalCrisperOpen] = useState(false)
  const [internalFreezerOpen, setInternalFreezerOpen] = useState(false)
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
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (onToggleCrisper) onToggleCrisper()
    else setInternalCrisperOpen((prev) => !prev)
  }

  const handleToggleFreezer = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (onToggleFreezer) onToggleFreezer()
    else if (onToggleFreezerDoor) onToggleFreezerDoor()
    else setInternalFreezerOpen((prev) => !prev)
  }

  const handleProductPointerDown = (
    e: React.PointerEvent,
    product: FridgeProduct,
    containerType: 'shelf' | 'crisper' | 'freezer' | 'door'
  ) => {
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

  const isEffectiveOpen =
    isDoorOpen !== undefined
      ? isDoorOpen
      : Boolean(isMainDoorOpen || isFreezerDoorOpen)

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
    (p) =>
      SHELF_DEFINITIONS[p.shelf]?.location === 'cavity' &&
      p.shelf !== 'crisper_drawer' &&
      p.shelf !== 'freezer'
  )
  const freezerProducts = activeProducts.filter((p) => p.shelf === 'freezer')
  const crisperProducts = activeProducts.filter((p) => p.shelf === 'crisper_drawer')
  const doorProducts = activeProducts.filter(
    (p) => SHELF_DEFINITIONS[p.shelf]?.location === 'door'
  )

  const isAnimatingRef = useRef(false)

  const handleToggle = () => {
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

    if (onToggleDoor) {
      onToggleDoor()
    } else if (onToggleMainDoor) {
      onToggleMainDoor()
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
          zIndex: isHighlighted || isBeingDragged ? 45 : containerType === 'crisper' ? 30 : 20,
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
  const renderGlassShelf = (shelfKey: 'top_shelf' | 'middle_shelf' | 'bottom_shelf') => {
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
              'linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(167, 243, 208, 0.22) 50%, rgba(110, 231, 183, 0.28) 100%)',
            backdropFilter: 'blur(1.5px)',
            borderRadius: '1.5px',
            borderTop: '1px solid rgba(255, 255, 255, 0.85)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
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

              {/* 5000K Daylight LED Interior Lighting Engine */}
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
                  isEffectiveOpen ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute top-0 inset-x-4 h-28 bg-gradient-to-b from-white/80 via-sky-100/20 to-transparent blur-xs pointer-events-none" />
                <div className="absolute top-[28%] inset-x-2 h-6 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                <div className="absolute top-[48%] inset-x-2 h-6 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-300 text-[8px] font-heading font-bold flex items-center gap-1 shadow-md z-30">
                  <Lightbulb className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                  <span>5000K LED ACTIVE</span>
                </div>
              </div>
            </div>

            {/* 
              --------------------------------------------------------------------
              A. INTERACTIVE SUB-ZERO FREEZER COMPARTMENT (TOP: 3.2% to 25.5%)
              Inner freezer door opens outward toward the right side around a realistic right-side hinge!
              Engineered with photorealistic white appliance-grade plastic, realistic depth,
              true 3D door thickness, gasket sealing, and zero clipping or disappearing!
              --------------------------------------------------------------------
            */}
            <div
              style={{
                position: 'absolute',
                top: '3.2%',
                left: '5.5%',
                right: '5.5%',
                height: '22.3%',
                zIndex: 35,
                perspective: '2200px',
                transformStyle: 'preserve-3d',
              }}
              className="select-none overflow-visible pointer-events-auto group/freezer"
            >
              {/* Drop Target Indicator on Freezer Compartment */}
              {activeDrag?.shelf === 'freezer' && (
                <div className="absolute inset-0 rounded-md border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_16px_rgba(6,182,212,0.8)] pointer-events-none z-50 animate-pulse flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-600 text-white text-[8px] font-black tracking-wide shadow-md uppercase">
                    Snap to Sub-Zero Freezer
                  </span>
                </div>
              )}

              {/* 1. Sub-Zero Internal Cavity Box (Fixed in back depth at -8px) */}
              <div
                className="absolute inset-0 rounded-md overflow-hidden bg-gradient-to-b from-slate-100 via-white to-sky-50 border border-slate-300/80 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12),inset_0_0_0_1px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(15,23,42,0.06)] cursor-pointer"
                style={{
                  transform: 'translateZ(-8px)',
                }}
                onClick={(e) => {
                  if (freezerOpen) {
                    handleToggleFreezer(e)
                  }
                }}
              >
                {/* Evaporator cooling coils / horizontal ribbed back-wall texture */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(180deg, rgba(203, 213, 225, 0.6) 0px, rgba(203, 213, 225, 0.6) 1.5px, transparent 1.5px, transparent 10px)',
                  }}
                />

                {/* Sub-Zero Ambient Glow & Frost Lighting */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-100/40 via-transparent to-slate-200/30 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-cyan-200/50 to-transparent blur-xs pointer-events-none" />

                {/* Molded shelf track ridges on left and right inner walls */}
                <div className="absolute inset-y-1.5 left-1 w-0.5 rounded-full bg-slate-300/70 shadow-xs pointer-events-none" />
                <div className="absolute inset-y-1.5 right-1 w-0.5 rounded-full bg-slate-300/70 shadow-xs pointer-events-none" />

                {/* Sub-Zero Header Badge & Close Button */}
                <div className="absolute top-1.5 inset-x-2 flex items-center justify-between z-20 pointer-events-auto">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-700 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs pointer-events-none">
                    <Snowflake className="w-2.5 h-2.5 text-cyan-600 animate-spin-slow" />
                    <span className="font-mono text-[7.5px] font-extrabold tracking-tight">SUB-ZERO • -18°C</span>
                  </div>
                  {freezerOpen && (
                    <button
                      type="button"
                      onClick={handleToggleFreezer}
                      className="px-2 py-0.5 rounded bg-white/95 hover:bg-cyan-50 border border-cyan-400/80 text-[7.5px] font-bold text-cyan-800 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="Click to close freezer door"
                    >
                      <DoorClosed className="w-2.5 h-2.5 text-cyan-600" />
                      <span>Close Door ◀</span>
                    </button>
                  )}
                </div>

                {/* Modeled Ice Maker & Crystal Ice Cube Tray (Left Side) */}
                <div
                  className="absolute bottom-1.5 left-2 px-1.5 py-1 rounded bg-white/95 border border-slate-200/90 flex flex-col gap-1 shadow-sm pointer-events-none z-10"
                  title="Sub-Zero Automatic Ice Maker"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[6.5px] font-black uppercase text-slate-700 tracking-wider">
                      Ice Maker
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_4px_rgba(6,182,212,0.8)] animate-pulse" />
                  </div>
                  {/* Ice Tray Grid with 8 Translucent Ice Cubes */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-sky-50/80 rounded border border-sky-200/60 shadow-2xs">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-2.5 h-2.5 rounded-2xs bg-gradient-to-br from-white via-cyan-50/90 to-sky-200/80 border border-white/90 shadow-2xs transform rotate-2"
                        style={{
                          boxShadow:
                            'inset 0 1px 1px rgba(255,255,255,0.95), 0 1px 2px rgba(15,23,42,0.18)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Products assigned to the Freezer */}
                <div className="absolute inset-0 flex items-end justify-end pr-3 pointer-events-none z-15">
                  {freezerProducts.map((product) => {
                    const shelfDef = SHELF_DEFINITIONS.freezer
                    const leftPos = Math.max(
                      shelfDef.horizontalRange[0],
                      Math.min(shelfDef.horizontalRange[1], product.positionX)
                    )
                    const scale = Math.max(0.4, Math.min(1.8, (product.displayScale || 1.0) * 0.95))
                    return renderProductCluster(
                      product,
                      leftPos,
                      shelfDef.surfaceTopPercent,
                      scale,
                      'freezer'
                    )
                  })}
                </div>
              </div>

              {/* 2. Realistic Vertical Hinge Pivot on the Right Side */}
              <div
                style={{
                  position: 'absolute',
                  top: '1px',
                  bottom: '1px',
                  right: '-1px',
                  width: '6px',
                  zIndex: 39,
                }}
                className="pointer-events-none rounded-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border border-slate-300 shadow-md flex flex-col justify-between items-center py-0.5"
                title="Freezer Door Right Hinge"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
              </div>

              {/* 
                3. Sub-Zero Freezer Front Door (Swings outward to the right around right-side hinge)
                Engineered with 3D physical thickness, beveled outer face, perimeter gasket, and zero clipping!
                Full-coverage clickable hit area. Opens when clicked, closes when clicked again.
              */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleToggleFreezer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleToggleFreezer(e as unknown as React.MouseEvent)
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformOrigin: 'calc(100% - 2px) center',
                  transform: freezerOpen ? 'rotateY(56deg) scale(1)' : 'rotateY(0deg) scale(1)',
                  transition: 'transform 550ms cubic-bezier(0.25, 1, 0.4, 1), box-shadow 550ms ease',
                  transformStyle: 'preserve-3d',
                  zIndex: 38,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  boxShadow: freezerOpen
                    ? '-6px 3px 16px rgba(15, 23, 42, 0.28), -2px 1px 6px rgba(15, 23, 42, 0.16)'
                    : '0 2px 8px rgba(15, 23, 42, 0.12)',
                }}
                className="group/door cursor-pointer rounded-md outline-none"
                title={freezerOpen ? 'Click freezer door to close' : 'Click freezer door to open outward to the right'}
                aria-label={freezerOpen ? 'Close freezer door' : 'Open freezer door'}
              >
                {/* 3D Extruded Left Opening Edge Profile (Faces viewer when open) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: '8px',
                    transformOrigin: 'left center',
                    transform: 'rotateY(-90deg)',
                  }}
                  className="bg-gradient-to-r from-slate-200 via-white to-slate-200 border-y border-slate-300 pointer-events-none flex flex-col justify-between items-center py-1"
                >
                  {/* Perimeter rubber gasket strip on side edge */}
                  <div className="w-1 h-full bg-slate-300/80 rounded-full" />
                </div>

                {/* 3D Extruded Top Edge Profile */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '8px',
                    transformOrigin: 'top center',
                    transform: 'rotateX(90deg)',
                  }}
                  className="bg-gradient-to-b from-slate-100 to-slate-200 border-x border-slate-300 pointer-events-none"
                />

                {/* 3D Extruded Bottom Edge Profile */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '8px',
                    transformOrigin: 'bottom center',
                    transform: 'rotateX(-90deg)',
                  }}
                  className="bg-gradient-to-t from-slate-200 to-slate-300 border-x border-slate-300 pointer-events-none"
                />

                {/* FRONT FACE of Freezer Door (Outer Face) - Semi-transparent frosted so contents show through */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transform: 'translateZ(4px)',
                    backfaceVisibility: 'hidden',
                  }}
                  className={`rounded-md overflow-hidden border transition-colors ${
                    freezerOpen
                      ? 'border-cyan-400 bg-gradient-to-r from-white/90 via-sky-50/80 to-slate-100/80 shadow-md backdrop-blur-xs'
                      : 'border-white/80 bg-gradient-to-r from-white/35 via-sky-100/25 to-white/40 backdrop-blur-[1.5px] hover:border-cyan-300 shadow-sm'
                  }`}
                >
                  {/* Frosted Acrylic Texture & Gloss */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.4),transparent_70%)] pointer-events-none" />

                  {/* Left-Side Vertical Chrome Pull Handle (Opposite the right-side hinge) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '18%',
                      bottom: '18%',
                      left: '8px',
                      width: '7px',
                      transform: 'translateZ(4px)',
                    }}
                    className="rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-400 border border-slate-300 shadow-xs flex items-center justify-center group-hover/door:border-cyan-500 transition-colors pointer-events-none"
                  >
                    <div className="w-0.5 h-1/2 bg-slate-400/70 rounded-full" />
                  </div>

                  {/* Door Center Emblem & Open Affordance */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pl-6 pointer-events-none">
                    <div className="flex items-center gap-1 text-[8px] font-heading font-black text-slate-800 tracking-wider bg-white/70 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs border border-white/60">
                      <Snowflake className="w-2.5 h-2.5 text-cyan-600" />
                      <span>SUB-ZERO FREEZER</span>
                    </div>

                    <div className="flex items-center gap-1 text-[7px] font-bold text-slate-700 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs border border-white/60 group-hover/door:text-cyan-700 transition-colors">
                      <span>Tap to Open</span>
                      <span className="text-[8px] font-black">▶</span>
                    </div>
                  </div>
                </div>

                {/* BACK FACE of Freezer Door (Inner Face with Food-Grade White Liner & Gasket) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transform: 'translateZ(-4px) rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                  className="rounded-md overflow-hidden bg-gradient-to-l from-slate-50 via-white to-slate-100 border border-slate-300 shadow-md p-1.5 flex flex-col justify-between items-center"
                >
                  {/* Perimeter Grey Magnetic Rubber Gasket Seal */}
                  <div className="absolute inset-1 rounded-sm border-2 border-slate-300/80 pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-1 text-[7px] font-bold text-slate-700 pt-0.5">
                    <Snowflake className="w-2 h-2 text-cyan-500" />
                    <span>Freezer Door Open</span>
                  </div>
                  <div className="relative z-10 text-[7px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300 shadow-2xs">
                    <span>Tap to Close ◀</span>
                  </div>
                </div>
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
            {/* 3 Physical 3D Tempered Glass Shelves */}
            {renderGlassShelf('top_shelf')}
            {renderGlassShelf('middle_shelf')}
            {renderGlassShelf('bottom_shelf')}

            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                isEffectiveOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
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

            {/* 
              --------------------------------------------------------------------
              C. INTERACTIVE SLIDING CRISPER DRAWER (BOTTOM: 77.2% to 95.7%)
              Slides open in 3D perspective to reveal fresh vegetables & fruits inside!
              Engineered with photorealistic frosted acrylic materials, clean cavity slot,
              ergonomic top handle grip, and zero clipping!
              --------------------------------------------------------------------
            */}
            <div
              style={{
                position: 'absolute',
                top: '77.2%',
                left: '5.5%',
                right: '5.5%',
                height: '18.5%',
                zIndex: crisperOpen ? 40 : 25,
                perspective: '2200px',
                transformStyle: 'preserve-3d',
              }}
              className="select-none overflow-visible pointer-events-auto group/crisper"
            >
              {/* Drop Target Indicator on Crisper Drawer */}
              {activeDrag?.shelf === 'crisper_drawer' && (
                <div className="absolute inset-0 rounded-lg border-2 border-emerald-400 bg-emerald-400/20 shadow-[0_0_16px_rgba(16,185,129,0.8)] pointer-events-none z-50 animate-pulse flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[8px] font-black tracking-wide shadow-md uppercase">
                    Snap to Crisper Drawer
                  </span>
                </div>
              )}

              {/* 1. Recessed Cavity Slot Behind Drawer (Revealed when drawer slides out) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: 'translateZ(-6px)',
                }}
                className="rounded-lg overflow-hidden bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 border border-slate-300 shadow-inner flex flex-col justify-between p-2 pointer-events-none"
              >
                {/* Molded Slide Rails on Left and Right Walls */}
                <div className="absolute inset-y-1.5 left-0.5 w-1 rounded-full bg-slate-300/80 shadow-inner" />
                <div className="absolute inset-y-1.5 right-0.5 w-1 rounded-full bg-slate-300/80 shadow-inner" />

                {/* Rear Humidity Ventilation Airflow Louvers */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-60">
                  <div className="h-0.5 bg-slate-300 rounded-full w-full" />
                  <div className="h-0.5 bg-slate-300 rounded-full w-4/5 mx-auto" />
                  <div className="h-0.5 bg-slate-300 rounded-full w-2/3 mx-auto" />
                </div>

                <div className="flex items-center justify-between text-[7px] font-bold text-slate-600 relative z-10">
                  <span className="font-mono text-[6.5px] uppercase tracking-wider">CRISPER CAVITY</span>
                  <div className="flex items-center gap-1 text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200/80 shadow-2xs">
                    <Droplets className="w-2 h-2 text-emerald-600" />
                    <span>85% OPTIMAL</span>
                  </div>
                </div>
              </div>

              {/* 
                2. Sliding Drawer Unit
                Translates forward and down in 3D perspective out of the cavity when opened!
                Carries products inside so they move with the drawer!
              */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleToggleCrisper}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleToggleCrisper(e as unknown as React.MouseEvent)
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: crisperOpen
                    ? 'translateZ(42px) translateY(14px) scale(1)'
                    : 'translateZ(0px) translateY(0px) scale(1)',
                  transition: 'transform 550ms cubic-bezier(0.25, 1, 0.4, 1), box-shadow 550ms ease',
                  boxShadow: crisperOpen
                    ? '0 18px 30px -6px rgba(15, 23, 42, 0.3), 0 8px 12px -4px rgba(15, 23, 42, 0.18)'
                    : 'inset 0 1px 2px rgba(255, 255, 255, 0.7), 0 2px 6px rgba(15, 23, 42, 0.12)',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
                className={`group/drawer cursor-pointer rounded-lg overflow-hidden border outline-none ${
                  crisperOpen
                    ? 'border-emerald-500/90 bg-gradient-to-b from-white/80 via-white/50 to-white/70 backdrop-blur-xs shadow-lg'
                    : 'border-white/85 bg-gradient-to-b from-white/30 via-white/10 to-white/25 backdrop-blur-[1px] hover:border-emerald-400 shadow-sm'
                }`}
                title={crisperOpen ? 'Click to slide in vegetable drawer' : 'Click to slide out vegetable drawer'}
                aria-label={crisperOpen ? 'Slide in vegetable drawer' : 'Slide out vegetable drawer'}
              >
                {/* Realistic Acrylic Bin Gradient & Reflections */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.5),transparent_60%)] pointer-events-none" />

                {/* Recessed Handle Slot at Top Lip */}
                <div className="absolute top-1 inset-x-0 flex justify-center pointer-events-none">
                  <div className="w-24 h-2 rounded-full bg-gradient-to-b from-slate-200 to-white border border-slate-300/80 shadow-inner group-hover/drawer:border-emerald-400 transition-colors" />
                </div>

                {/* Humidity Control Badge & Slide Affordance */}
                <div className="absolute bottom-1 inset-x-2 flex items-center justify-between text-[7px] font-bold text-slate-800 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200/90 shadow-2xs pointer-events-none">
                  <div className="flex items-center gap-1 text-emerald-800 font-extrabold">
                    <Droplets className="w-2.5 h-2.5 text-emerald-600" />
                    <span>HUMIDITY CONTROL 85%</span>
                  </div>
                  <div className="text-[7px] font-bold text-slate-600 group-hover/drawer:text-emerald-700 transition-colors">
                    {crisperOpen ? 'Slide In ▲' : 'Slide Out ▼'}
                  </div>
                </div>

                {/* Crisper Drawer Products (Slide forward and down WITH the drawer) */}
                <div className="absolute inset-0 pointer-events-none pb-1 z-20">
                  {crisperProducts.map((product) => {
                    const shelfDef = SHELF_DEFINITIONS.crisper_drawer
                    const leftPos = Math.max(
                      shelfDef.horizontalRange[0],
                      Math.min(shelfDef.horizontalRange[1], product.positionX)
                    )
                    const scale = Math.max(0.4, Math.min(1.8, (product.displayScale || 1.0) * 0.95))
                    return renderProductCluster(
                      product,
                      leftPos,
                      shelfDef.surfaceTopPercent,
                      scale,
                      'crisper'
                    )
                  })}
                </div>
              </div>
            </div>
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
              pointerEvents: isEffectiveOpen ? 'none' : 'auto',
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
                INTERACTIVE REFRIGERATOR CHROME HANDLE
                Only clicking this dedicated handle opens the refrigerator door!
              */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggle()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggle()
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '24%',
                  right: '0%',
                  width: '16%',
                  minWidth: '44px',
                  height: '40%',
                  zIndex: 35,
                }}
                className={`group cursor-pointer select-none rounded-r-lg ${
                  isEffectiveOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
                title="Tap handle to open refrigerator door"
                aria-label="Open refrigerator door"
              >
                <div className="absolute inset-0 rounded-r-lg group-hover:bg-gradient-to-l group-hover:from-white/30 group-hover:via-white/10 group-hover:to-transparent transition-all duration-200 pointer-events-none" />

                <div className="absolute -left-20 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-heading font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap border border-white/20 flex items-center gap-1">
                  <span>Pull Handle</span>
                </div>
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
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'rotateY(180deg) translateZ(8px)',
                backfaceVisibility: 'hidden',
              }}
              className={`rounded-lg shadow-2xl overflow-hidden bg-white border border-slate-300 flex flex-col cursor-pointer ${
                isEffectiveOpen ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              onClick={handleToggle}
              title="Click anywhere on door background to close refrigerator"
            >
              {/* Photorealistic Door-Side Storage Image */}
              <img
                src="/fridges/realistic-door-storage.png"
                alt="Refrigerator Door-Side Storage Bins"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Acrylic Gloss Reflection */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* Door Storage Header Badge & Close Affordance */}
              <div className="relative z-10 m-2.5 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-white flex items-center justify-between border border-white/20 shadow-md">
                <div className="flex items-center gap-1.5 text-[9px] font-heading font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>DOOR-SIDE STORAGE</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-slate-300 font-medium">
                  <DoorClosed className="w-2.5 h-2.5 text-slate-300" />
                  <span>Click to Close</span>
                </div>
              </div>

              {/* Door Snap Guideline Highlights during drag */}
              {activeDrag && (
                <>
                  {activeDrag.shelf === 'door_bin_top' && (
                    <div className="absolute top-[26.2%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                  )}
                  {activeDrag.shelf === 'door_bin_middle' && (
                    <div className="absolute top-[48.2%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                  )}
                  {activeDrag.shelf === 'door_bin_bottom' && (
                    <div className="absolute top-[88.5%] inset-x-3 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-30 animate-pulse pointer-events-none" />
                  )}
                </>
              )}

              {/* Dynamic Admin-Managed Products in Door Bins (Multi-Unit Supported) */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {doorProducts.map((product) => {
                  const shelfDef =
                    SHELF_DEFINITIONS[product.shelf] || SHELF_DEFINITIONS.door_bin_middle
                  const leftPos = Math.max(
                    shelfDef.horizontalRange[0],
                    Math.min(shelfDef.horizontalRange[1], product.positionX)
                  )
                  const baselinePos = shelfDef.surfaceTopPercent
                  const scale = Math.max(0.4, Math.min(2.0, product.displayScale || 1.0))

                  return renderProductCluster(product, leftPos, baselinePos, scale, 'door')
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
