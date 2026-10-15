import React, { useRef, useState, useEffect } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import type { FridgeProduct, StackingArrangement } from '../../types/fridgeProduct'
import { SHELF_DEFINITIONS } from '../../types/fridgeProduct'
import {
  getPublicActiveProducts,
  FRIDGE_PRODUCTS_UPDATED_EVENT,
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
  spacing: number = 18
): RenderUnit[] {
  const safeCount = Math.max(1, Math.min(12, count))

  if (safeCount === 1 || arrangement === 'single') {
    return [{ key: 'unit-0', offsetX: 0, offsetY: 0, scaleFactor: 1.0, zIndex: 10 }]
  }

  if (arrangement === 'row') {
    const units: RenderUnit[] = []
    for (let i = 0; i < safeCount; i++) {
      const offsetX = (i - (safeCount - 1) / 2) * spacing
      units.push({
        key: `unit-${i}`,
        offsetX,
        offsetY: 0,
        scaleFactor: 1.0,
        zIndex: 10 + i,
      })
    }
    return units
  }

  if (arrangement === 'depth') {
    const units: RenderUnit[] = []
    const cols = Math.ceil(safeCount / 2)
    for (let i = 0; i < safeCount; i++) {
      const isBack = i % 2 === 1
      const colIndex = Math.floor(i / 2)
      const offsetX = (colIndex - (cols - 1) / 2) * spacing + (isBack ? spacing * 0.35 : 0)
      const offsetY = isBack ? -8 : 2
      const scaleFactor = isBack ? 0.91 : 1.0
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
    const cols = safeCount > 4 ? 3 : 2
    const rows = Math.ceil(safeCount / cols)
    for (let i = 0; i < safeCount; i++) {
      const c = i % cols
      const r = Math.floor(i / cols)
      const offsetX = (c - (cols - 1) / 2) * spacing
      const offsetY = (r - (rows - 1) / 2) * (spacing * 0.7)
      units.push({
        key: `unit-${i}`,
        offsetX,
        offsetY,
        scaleFactor: 0.94,
        zIndex: 10 + r * 5 + c,
      })
    }
    return units
  }

  if (arrangement === 'stack') {
    const units: RenderUnit[] = []
    for (let i = 0; i < safeCount; i++) {
      units.push({
        key: `unit-${i}`,
        offsetX: 0,
        offsetY: -i * (spacing * 0.65),
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
}) => {
  const [internalProducts, setInternalProducts] = useState<FridgeProduct[]>([])
  const [internalCrisperOpen, setInternalCrisperOpen] = useState(false)
  const [internalFreezerOpen, setInternalFreezerOpen] = useState(false)

  const crisperOpen = propCrisperOpen !== undefined ? propCrisperOpen : internalCrisperOpen
  const freezerOpen = propFreezerOpen !== undefined ? propFreezerOpen : internalFreezerOpen

  const handleToggleCrisper = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleCrisper) onToggleCrisper()
    else setInternalCrisperOpen((prev) => !prev)
  }

  const handleToggleFreezer = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFreezer) onToggleFreezer()
    else setInternalFreezerOpen((prev) => !prev)
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
   * Helper to render a product with full multi-unit stacking and physical ground contact shadows
   */
  const renderProductCluster = (
    product: FridgeProduct,
    baseLeftPercent: number,
    baseTopPercent: number,
    baseScale: number = 1.0,
    containerType: 'shelf' | 'crisper' | 'freezer' | 'door' = 'shelf'
  ) => {
    const isHighlighted =
      Boolean(highlightedProductId && product.id === highlightedProductId) ||
      product.id.startsWith('draft-')

    const count = Math.max(1, Math.min(12, product.itemCount || 1))
    const arrangement = product.arrangement || 'single'
    const spacing = Math.max(10, Math.min(45, product.spacing || 18))
    const units = calculateProductUnits(count, arrangement, spacing)

    return (
      <div
        key={product.id}
        style={{
          position: 'absolute',
          top: `${baseTopPercent}%`,
          left: `${baseLeftPercent}%`,
          transform: `translate(-50%, -50%) scale(${baseScale})`,
          zIndex: isHighlighted ? 40 : 20,
        }}
        className={`group/product pointer-events-auto transition-transform duration-200 select-none cursor-pointer ${
          isHighlighted ? 'scale-105' : 'hover:scale-105'
        }`}
        title={`${product.name} (${product.category}${product.quantity ? ` • ${product.quantity}` : ''}${
          count > 1 ? ` • ${count} units` : ''
        })`}
        onClick={(e) => {
          if (onSelectProduct) {
            e.stopPropagation()
            onSelectProduct(product)
          }
        }}
      >
        {/* Luminous indicator if currently being edited */}
        {isHighlighted && (
          <div className="absolute left-1/2 -top-7 -translate-x-1/2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap pointer-events-none z-50 animate-pulse border border-white/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              Live Edit {count > 1 ? `(${count})` : ''}
            </span>
          </div>
        )}

        {/* Hover Tooltip */}
        <div className="absolute left-1/2 -top-8 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-slate-900/95 backdrop-blur-md text-white text-[9px] font-medium whitespace-nowrap opacity-0 group-hover/product:opacity-100 transition-opacity duration-150 pointer-events-none border border-white/20 shadow-xl z-50 flex items-center gap-1.5">
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

        {/* Render Units with individual physical contact shadows */}
        <div className="relative flex items-center justify-center">
          {units.map((unit) => (
            <div
              key={unit.key}
              style={{
                position: unit.key === 'unit-0' ? 'relative' : 'absolute',
                transform: `translate(${unit.offsetX}px, ${unit.offsetY}px) scale(${unit.scaleFactor})`,
                zIndex: unit.zIndex,
              }}
              className="transition-transform duration-200"
            >
              {/* Physical Contact Shadow anchored under each unit */}
              <div
                style={{
                  position: 'absolute',
                  bottom: containerType === 'crisper' ? '-4px' : '-5px',
                  left: '10%',
                  right: '10%',
                  height: '8px',
                  background:
                    'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.25) 45%, transparent 75%)',
                  filter: 'blur(1.5px)',
                  zIndex: -1,
                  pointerEvents: 'none',
                }}
              />

              {/* Product Graphic */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className={`w-11 h-14 object-contain select-none filter drop-shadow-md transition-all ${
                  isHighlighted
                    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 rounded-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                    : ''
                }`}
                draggable={false}
              />
            </div>
          ))}
        </div>
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
          width: 'clamp(250px, 74vw, 310px)',
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
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'translateZ(-6px)',
              zIndex: isEffectiveOpen ? 25 : 5,
            }}
            className={`rounded-lg shadow-2xl overflow-hidden bg-slate-900 border border-slate-500 pointer-events-auto ${
              isEffectiveOpen ? 'cursor-pointer' : ''
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget && isEffectiveOpen) {
                handleToggle()
              }
            }}
            title={isEffectiveOpen ? 'Click outer frame to close refrigerator door' : undefined}
          >
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

              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white border border-white/20 text-[8px] font-heading font-bold flex items-center gap-1 shadow-md z-30">
                <Lightbulb className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                <span>5000K LED ACTIVE</span>
              </div>
            </div>

            {/* 
              --------------------------------------------------------------------
              A. INTERACTIVE SUB-ZERO FREEZER COMPARTMENT (TOP: 3.5% to 25.5%)
              Opens when clicked to reveal interior ice maker, ice cubes, and products!
              --------------------------------------------------------------------
            */}
            <div
              style={{
                position: 'absolute',
                top: '3.2%',
                left: '5.5%',
                right: '5.5%',
                height: '22.3%',
                zIndex: 25,
                perspective: '700px',
                transformStyle: 'preserve-3d',
              }}
              onClick={handleToggleFreezer}
              className="select-none overflow-visible cursor-pointer pointer-events-auto group/freezer"
            >
              {/* Sub-Zero Internal Cavity Box (revealed when door opens) */}
              <div
                className="absolute inset-0 rounded-md overflow-hidden bg-gradient-to-b from-slate-950 via-sky-950 to-slate-900 border border-sky-400/40 shadow-inner"
                style={{
                  transform: 'translateZ(-10px)',
                }}
              >
                {/* Frosted Back Shading & Sub-Zero LED */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 via-transparent to-black/40 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-4 bg-cyan-200/40 blur-xs pointer-events-none" />

                {/* Sub-Zero Header Badge & Close Affordance */}
                <div className="absolute top-1 inset-x-2 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-cyan-200/90">
                    <Snowflake className="w-2.5 h-2.5 text-cyan-300 animate-spin-slow" />
                    <span>SUB-ZERO • -18°C</span>
                  </div>
                  {freezerOpen && (
                    <div className="px-1.5 py-0.5 rounded bg-sky-900/80 border border-cyan-400/30 text-[7px] font-bold text-cyan-200 flex items-center gap-1">
                      <span>Tap to Close ▲</span>
                    </div>
                  )}
                </div>

                {/* Modeled Ice Maker & Crystal Ice Cube Tray */}
                <div
                  className="absolute bottom-1.5 left-2 px-1.5 py-1 rounded bg-sky-950/70 border border-cyan-400/30 flex flex-col gap-1 shadow-sm"
                  title="Sub-Zero Automatic Ice Maker"
                >
                  <div className="text-[6px] font-black uppercase text-cyan-300 tracking-wider">
                    Ice Maker
                  </div>
                  {/* Ice Tray Grid with 8 Translucent Ice Cubes */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-900/60 rounded border border-white/10">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-2.5 h-2.5 rounded-2xs bg-gradient-to-br from-white/90 via-cyan-100/70 to-sky-200/90 border border-white/60 shadow-2xs transform rotate-2"
                        style={{
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Products assigned to the Freezer */}
                <div className="absolute inset-0 flex items-center justify-end pr-3">
                  {freezerProducts.map((product) => {
                    const leftPos = Math.max(30, Math.min(85, product.positionX))
                    const scale = Math.max(0.4, Math.min(1.8, (product.displayScale || 1.0) * 0.9))
                    return renderProductCluster(product, leftPos, 62, scale, 'freezer')
                  })}
                </div>
              </div>

              {/* Sub-Zero Freezer Front Door Flap (Swings open/close) */}
              <div
                onClick={handleToggleFreezer}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformOrigin: 'top center',
                  transform: freezerOpen ? 'rotateX(-78deg) translateY(-8px)' : 'rotateX(0deg)',
                  transition: 'transform 500ms cubic-bezier(0.25, 1, 0.4, 1), box-shadow 500ms ease',
                  backfaceVisibility: 'hidden',
                  zIndex: 26,
                  pointerEvents: freezerOpen ? 'none' : 'auto',
                }}
                className={`group/freezer cursor-pointer rounded-md overflow-hidden border border-white/60 shadow-md ${
                  freezerOpen
                    ? 'bg-white/40 backdrop-blur-xs'
                    : 'bg-gradient-to-b from-white/80 via-sky-50/70 to-slate-100/90 backdrop-blur-xs hover:border-cyan-300'
                }`}
                title={freezerOpen ? 'Click to close freezer' : 'Click to open sub-zero freezer'}
              >
                {/* Frost Texture & Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.7),transparent_70%)] pointer-events-none" />

                {/* Freezer Emblem & Handle */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pointer-events-none">
                  <div className="flex items-center gap-1 text-[8px] font-heading font-black text-slate-700 tracking-wider">
                    <Snowflake className="w-2.5 h-2.5 text-cyan-600" />
                    <span>SUB-ZERO FREEZER</span>
                  </div>

                  {/* Brushed Stainless Steel Horizontal Handle Trim */}
                  <div className="w-28 h-2 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border border-slate-300 shadow-xs flex items-center justify-center">
                    <div className="w-16 h-0.5 bg-slate-400/60 rounded-full" />
                  </div>

                  <div className="text-[7px] font-bold text-slate-500 group-hover/freezer:text-cyan-700 transition-colors">
                    {freezerOpen ? 'Tap to Close ▲' : 'Tap to Open ▼'}
                  </div>
                </div>
              </div>
            </div>

            {/* 
              --------------------------------------------------------------------
              B. DYNAMIC PRODUCTS ON CAVITY GLASS SHELVES
              Upper Glass Shelf (top_shelf: ~37% center, glass at 44.5%)
              Middle Glass Shelf (middle_shelf: ~53% center, glass at 60.5%)
              Lower Glass Shelf (bottom_shelf: ~69% center, glass at 77.5%)
              --------------------------------------------------------------------
            */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                isEffectiveOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {cavityProducts.map((product) => {
                const shelfDef = SHELF_DEFINITIONS[product.shelf] || SHELF_DEFINITIONS.middle_shelf
                const leftPos = Math.max(12, Math.min(88, product.positionX))
                const topPos = shelfDef.verticalCenterPercent
                const scale = Math.max(0.4, Math.min(2.0, product.displayScale || 1.0))

                return renderProductCluster(product, leftPos, topPos, scale, 'shelf')
              })}
            </div>

            {/* 
              --------------------------------------------------------------------
              C. INTERACTIVE SLIDING CRISPER DRAWER (BOTTOM: 77.5% to 95.5%)
              Slides open in 3D perspective to reveal fresh vegetables & fruits inside!
              --------------------------------------------------------------------
            */}
            <div
              style={{
                position: 'absolute',
                top: '77.5%',
                left: '5.5%',
                right: '5.5%',
                height: '18%',
                zIndex: crisperOpen ? 35 : 22,
                perspective: '900px',
                transformStyle: 'preserve-3d',
              }}
              onClick={handleToggleCrisper}
              className="select-none cursor-pointer pointer-events-auto group/crisper"
            >
              {/* Drawer Container (Translates forward in 3D when opened) */}
              <div
                onClick={handleToggleCrisper}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: crisperOpen
                    ? 'translateZ(48px) translateY(12px) scale(1.02)'
                    : 'translateZ(0px) translateY(0px) scale(1)',
                  transition: 'transform 500ms cubic-bezier(0.25, 1, 0.4, 1), box-shadow 500ms ease',
                  boxShadow: crisperOpen
                    ? '0 20px 30px -5px rgba(0, 0, 0, 0.65), 0 10px 15px -5px rgba(0, 0, 0, 0.4)'
                    : 'inset 0 1px 3px rgba(255,255,255,0.4)',
                }}
                className={`group/crisper cursor-pointer rounded-lg overflow-hidden border ${
                  crisperOpen
                    ? 'border-emerald-400 bg-white/20 backdrop-blur-xs'
                    : 'border-white/50 bg-white/10 backdrop-blur-[0.5px] hover:border-emerald-300'
                }`}
                title={crisperOpen ? 'Click to slide in drawer' : 'Click to slide out vegetable crisper'}
              >
                {/* Realistic Acrylic Bin Gradient & Reflections */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-white/20 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.6),transparent_60%)] pointer-events-none" />

                {/* Recessed Handle Slot at Top Lip */}
                <div className="absolute top-1 inset-x-0 flex justify-center pointer-events-none">
                  <div className="w-20 h-1.5 rounded-full bg-slate-400/40 shadow-inner" />
                </div>

                {/* Humidity Control Badge & Affordance */}
                <div className="absolute bottom-1 inset-x-2 flex items-center justify-between text-[7px] font-bold text-slate-800 bg-white/60 backdrop-blur-xs px-2 py-0.5 rounded pointer-events-none">
                  <div className="flex items-center gap-1 text-emerald-800 font-extrabold">
                    <Droplets className="w-2.5 h-2.5 text-emerald-600" />
                    <span>HUMIDITY CONTROL 85%</span>
                  </div>
                  <div className="text-[7px] text-slate-600 group-hover/crisper:text-emerald-700">
                    {crisperOpen ? 'Slide In ▲' : 'Slide Out ▼'}
                  </div>
                </div>

                {/* Crisper Drawer Products (Slide forward along with drawer) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-3">
                  {crisperProducts.map((product) => {
                    const leftPos = Math.max(16, Math.min(84, product.positionX))
                    const scale = Math.max(0.4, Math.min(1.8, (product.displayScale || 1.0) * 0.95))
                    return renderProductCluster(product, leftPos, 50, scale, 'crisper')
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

              {/* Dynamic Admin-Managed Products in Door Bins (Multi-Unit Supported) */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {doorProducts.map((product) => {
                  const shelfDef =
                    SHELF_DEFINITIONS[product.shelf] || SHELF_DEFINITIONS.door_bin_middle
                  const leftPos = Math.max(15, Math.min(85, product.positionX))
                  const topPos = shelfDef.verticalCenterPercent
                  const scale = Math.max(0.4, Math.min(2.0, product.displayScale || 1.0))

                  return renderProductCluster(product, leftPos, topPos, scale, 'door')
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
