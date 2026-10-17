import React, { useRef, useState, useEffect, useMemo } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import type { FridgeProduct, FridgeShelf } from '../../types/fridgeProduct'
import { SHELF_DEFINITIONS } from '../../types/fridgeProduct'
import {
  getPublicActiveProducts,
  getLocalCachedProducts,
  STOCK_GROCERY_TEMPLATES,
  FRIDGE_PRODUCTS_UPDATED_EVENT,
  moveProduct,
  normalizeProductShelf,
} from '../../services/fridgeProductService'
import { FridgeInteriorCavity } from './interior/FridgeInteriorCavity'
import { FridgeDoorBins } from './interior/FridgeDoorBins'
import { validateProductPlacement, resolveShelfOverlap } from '../../services/productPlacementValidator'
import { DoorClosed } from 'lucide-react'

export interface UniversalSteelFridgeProps {
  isDoorOpen?: boolean
  onToggleDoor?: () => void
  isMainDoorOpen?: boolean
  isFreezerDoorOpen?: boolean
  onToggleMainDoor?: () => void
  onToggleFreezerDoor?: () => void
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

export const UniversalSteelFridge: React.FC<UniversalSteelFridgeProps> = ({
  isDoorOpen,
  onToggleDoor,
  isMainDoorOpen,
  isFreezerDoorOpen,
  onToggleMainDoor,
  onToggleFreezerDoor,
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
  isEditable = false,
  yaw = 0,
  onYawChange,
  products: propProducts,
  highlightedProductId,
  onSelectProduct,
  onMoveProduct,
}) => {
  const isEffectiveOpen =
    isMainDoorOpen !== undefined
      ? isMainDoorOpen
      : isDoorOpen !== undefined
        ? isDoorOpen
        : false

  const [internalProducts, setInternalProducts] = useState<FridgeProduct[]>(() => {
    const cached = getLocalCachedProducts()
    return cached && cached.length > 0 ? cached : STOCK_GROCERY_TEMPLATES
  })

  const [internalFreezerOpen, setInternalFreezerOpen] = useState(
    propFreezerOpen !== undefined
      ? propFreezerOpen
      : isFreezerDoorOpen !== undefined
        ? isFreezerDoorOpen
        : false
  )

  useEffect(() => {
    if (propFreezerOpen !== undefined) {
      setInternalFreezerOpen(propFreezerOpen)
    } else if (isFreezerDoorOpen !== undefined) {
      setInternalFreezerOpen(isFreezerDoorOpen)
    }
  }, [propFreezerOpen, isFreezerDoorOpen])

  // Automatically close freezer lid when main door closes
  useEffect(() => {
    if (!isEffectiveOpen) {
      setInternalFreezerOpen(false)
    }
  }, [isEffectiveOpen])

  const cavityRef = useRef<HTMLDivElement>(null)
  const doorRef = useRef<HTMLDivElement>(null)
  const [activeDrag, setActiveDrag] = useState<{
    productId: string
    shelf: FridgeShelf
    positionX: number
  } | null>(null)

  const freezerOpen = propFreezerOpen !== undefined ? propFreezerOpen : internalFreezerOpen

  const handleToggleFreezer = (e?: React.MouseEvent) => {
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
    _containerType: 'shelf' | 'freezer' | 'door' = 'shelf'
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

      const cavityRect = cavityRef.current?.getBoundingClientRect()
      const doorRect = doorRef.current?.getBoundingClientRect()
      if (!cavityRect) return

      let targetShelf: FridgeShelf = 'middle_shelf'
      let targetX = 50

      // Check whether cursor is hovering over the open door panel
      const isOverDoor =
        isEffectiveOpen &&
        doorRect &&
        moveEvent.clientX >= doorRect.left - 20 &&
        moveEvent.clientX <= doorRect.right + 20 &&
        moveEvent.clientY >= doorRect.top &&
        moveEvent.clientY <= doorRect.bottom

      if (isOverDoor && doorRect) {
        const pctX = Math.round(((moveEvent.clientX - doorRect.left) / doorRect.width) * 100)
        const pctY = Math.round(((moveEvent.clientY - doorRect.top) / doorRect.height) * 100)

        if (pctY < 36) targetShelf = 'door_bin_top'
        else if (pctY < 62) targetShelf = 'door_bin_middle'
        else targetShelf = 'door_bin_bottom'

        const validation = validateProductPlacement(product, targetShelf, pctX)
        targetX = validation.safePositionX
      } else {
        const pctX = Math.round(((moveEvent.clientX - cavityRect.left) / cavityRect.width) * 100)
        const pctY = Math.round(((moveEvent.clientY - cavityRect.top) / cavityRect.height) * 100)

        if (pctY < 30) targetShelf = 'freezer'
        else if (pctY < 54) targetShelf = 'top_shelf'
        else if (pctY < 76) targetShelf = 'middle_shelf'
        else targetShelf = 'bottom_shelf'

        const validation = validateProductPlacement(product, targetShelf, pctX)
        targetX = validation.safePositionX
      }

      lastTarget = { shelf: targetShelf, positionX: targetX }
      setActiveDrag({ productId: product.id, shelf: targetShelf, positionX: targetX })

      if (onMoveProduct) {
        onMoveProduct(product.id, targetShelf, targetX)
      } else {
        setInternalProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, shelf: targetShelf, positionX: targetX } : p
          )
        )
      }
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      setActiveDrag(null)

      if (hasMoved && lastTarget) {
        const safeX = resolveShelfOverlap(activeProducts, product, lastTarget.shelf, lastTarget.positionX)
        if (onMoveProduct) {
          onMoveProduct(product.id, lastTarget.shelf, safeX)
        } else {
          setInternalProducts((prev) =>
            prev.map((p) =>
              p.id === product.id
                ? { ...p, shelf: lastTarget!.shelf, positionX: safeX }
                : p
            )
          )
        }
        moveProduct(product.id, lastTarget.shelf, safeX)
      } else if (!hasMoved && onSelectProduct) {
        onSelectProduct(product)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  // Load products & listen to updates
  useEffect(() => {
    let isMounted = true
    getPublicActiveProducts().then((loaded) => {
      if (isMounted) {
        setInternalProducts(loaded && loaded.length > 0 ? loaded : STOCK_GROCERY_TEMPLATES)
      }
    })

    const handleUpdate = () => {
      getPublicActiveProducts().then((loaded) => {
        if (isMounted) {
          setInternalProducts(loaded && loaded.length > 0 ? loaded : STOCK_GROCERY_TEMPLATES)
        }
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

  // Active products in the fridge
  const activeProducts = useMemo(() => {
    const sourceList = propProducts && propProducts.length > 0 ? propProducts : internalProducts
    const productMap = new Map<string, FridgeProduct>()
    for (const t of STOCK_GROCERY_TEMPLATES) {
      productMap.set(t.id, t)
    }
    if (sourceList && sourceList.length > 0) {
      for (const p of sourceList) {
        const stockTpl = STOCK_GROCERY_TEMPLATES.find((t) => t.id === p.id)
        if (stockTpl) {
          productMap.set(p.id, {
            ...stockTpl,
            shelf: p.shelf || stockTpl.shelf,
            positionX: p.positionX !== undefined ? p.positionX : stockTpl.positionX,
          })
        } else {
          productMap.set(p.id, p)
        }
      }
    }
    const merged = Array.from(productMap.values()).filter((p) => p.isActive && !p.isArchived)
    const list = merged.length > 0 ? merged : STOCK_GROCERY_TEMPLATES
    return list.map(normalizeProductShelf)
  }, [propProducts, internalProducts])

  const freezerProducts = activeProducts.filter((p) => p.shelf === 'freezer')
  const cavityProducts = activeProducts.filter(
    (p) =>
      p.shelf === 'top_shelf' ||
      p.shelf === 'middle_shelf' ||
      p.shelf === 'bottom_shelf'
  )
  const doorProducts = activeProducts.filter(
    (p) =>
      p.shelf === 'door_bin_top' ||
      p.shelf === 'door_bin_middle' ||
      p.shelf === 'door_bin_bottom'
  )

  const isAnimatingRef = useRef(false)

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
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

  return (
    <div className="w-full flex flex-col items-center select-none overflow-visible">
      {/* 
        ========================================================================
        THE REFRIGERATOR 3D APPLIANCE STAGE
        Isolated appliance stage with preserve-3d to render realistic depth.
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
          Rotates smoothly around Y-axis controlled by yaw.
          Shifts slightly right when the door opens to ensure the swinging door is centered.
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
          {/* 3D Left Cabinet Side Panel (Stationary depth) */}
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

          {/* Top Heavy-Duty Steel Hinge Bracket */}
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

          {/* 3D Right Cabinet Side Panel */}
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

          {/* 3D Top Cabinet Roof */}
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
            1. REBUILT STATIONARY REFRIGERATOR INTERIOR CAVITY
            Houses:
            - Clean interior walls, ceiling, back panel, and flat floor
            - Daylight 5000K LED illumination
            - Newly engineered Sub-Zero freezer compartment & hinged door
            - Fresh tempered glass shelves with chrome lips and wall brackets
            - Cavity product placements anchored to shelf surfaces
            Remains 100% stationary when the main door opens!
            ========================================================================
          */}
          <FridgeInteriorCavity
            cavityRef={cavityRef}
            isDoorOpen={isEffectiveOpen}
            isFreezerOpen={freezerOpen}
            onToggleFreezer={handleToggleFreezer}
            freezerProducts={freezerProducts}
            cavityProducts={cavityProducts}
            isEditable={isEditable}
            activeDragShelf={activeDrag?.shelf}
            activeDragPositionX={activeDrag?.positionX}
            highlightedProductId={highlightedProductId}
            activeDragProductId={activeDrag?.productId}
            onProductPointerDown={handleProductPointerDown}
            onProductClick={onSelectProduct}
          />

          {/* 
            ========================================================================
            2. 3D SWINGING REFRIGERATOR DOOR
            Rotates around its left hinge when clicked.
            Magnets live on the front face of this door and move WITH it in 3D.
            Inner door panel hosts the fresh door-mounted storage bins system.
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
              zIndex: isEffectiveOpen ? 20 : 60,
              pointerEvents: 'auto',
            }}
          >
            {/* 
              FRONT FACE OF THE DOOR (EXTERIOR):
              Brushed platinum stainless steel with integrated "MAGNETOS" OLED display,
              chrome handle, and the unified magnetic surface.
            */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'translateZ(12px)',
                backfaceVisibility: 'hidden',
                zIndex: isEffectiveOpen ? 10 : 50,
              }}
              className={`rounded-lg shadow-2xl overflow-hidden bg-slate-200 border border-slate-400 ${
                isEffectiveOpen ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            >
              {/* Clean Cropped Stainless Steel Door Image (With MAGNETOS OLED) */}
              <img
                src="/fridges/premium-steel-door-closed.png"
                alt="Stainless Steel Refrigerator Door"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Ambient Specular Highlight Sheen */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* Unified Usable Magnetic Surface */}
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

              {/* Interactive Refrigerator Handle */}
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
              BACK FACE OF THE DOOR (INNER DOOR PANEL):
              Swings open with the door around the left hinge!
              Houses the newly designed door-mounted storage bins system.
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
              {/* Photorealistic Clean Inner Door Liner */}
              <img
                src="/fridges/realistic-door-storage.png"
                alt="Refrigerator Door Inner Panel"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Acrylic Gloss Reflection */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* 
                FRESH REBUILT 3D DOOR-MOUNTED STORAGE BINS
                Attached to the inside of the door liner, moving 100% in sync with the door!
              */}
              <FridgeDoorBins
                products={doorProducts}
                isEditable={isEditable}
                activeDragShelf={activeDrag?.shelf}
                activeDragPositionX={activeDrag?.positionX}
                highlightedProductId={highlightedProductId}
                activeDragProductId={activeDrag?.productId}
                onProductPointerDown={handleProductPointerDown}
                onProductClick={onSelectProduct}
              />

              {/* Explicit Close Affordance Button at Top */}
              <div className="relative z-30 m-2.5 flex justify-end pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggle()
                  }}
                  className="flex items-center gap-1.5 text-[9px] font-heading font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20 shadow-md cursor-pointer transition-colors"
                  title="Click to close refrigerator door"
                >
                  <DoorClosed className="w-3 h-3 text-slate-200" />
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
