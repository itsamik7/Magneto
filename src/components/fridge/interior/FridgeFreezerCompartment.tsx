import React from 'react'
import type { FridgeProduct, FridgeShelf } from '../../../types/fridgeProduct'
import { SHELF_DEFINITIONS } from '../../../types/fridgeProduct'
import { FridgeProductCluster } from './FridgeProductCluster'
import { Snowflake, DoorClosed } from 'lucide-react'

export interface FridgeFreezerCompartmentProps {
  isOpen: boolean
  onToggle: (e?: React.MouseEvent) => void
  products: FridgeProduct[]
  isEditable?: boolean
  activeDragShelf?: FridgeShelf | null
  highlightedProductId?: string
  activeDragProductId?: string
  onProductPointerDown?: (e: React.PointerEvent, product: FridgeProduct) => void
  onProductClick?: (product: FridgeProduct) => void
}

export const FridgeFreezerCompartment: React.FC<FridgeFreezerCompartmentProps> = ({
  isOpen,
  onToggle,
  products,
  isEditable = false,
  activeDragShelf,
  highlightedProductId,
  activeDragProductId,
  onProductPointerDown,
  onProductClick,
}) => {
  const isTargeted = isEditable && activeDragShelf === 'freezer'

  // When closed, render NO inside box, NO duplicate borders, NO vertical bars, and NO hinge pins.
  // The authentic photorealistic ice box door and stainless steel handle from the appliance photo
  // are completely unobstructed and clean.
  if (!isOpen) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(e as unknown as React.MouseEvent)
          }
        }}
        style={{
          position: 'absolute',
          top: '9.9%',
          left: '13.6%',
          width: '72.8%',
          height: '19.5%',
          zIndex: 26,
          cursor: 'pointer',
        }}
        className="select-none outline-none group/freezer"
        title="Click to open ice box"
        aria-label="Open ice box"
      >
        {/* Drop target indicator when dragging product over the ice box */}
        {isTargeted && (
          <div className="absolute inset-0 rounded-md border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_16px_rgba(6,182,212,0.8)] pointer-events-none z-50 animate-pulse flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-cyan-600 text-white text-[8px] font-black tracking-wide shadow-md uppercase">
              Snap to Ice Box
            </span>
          </div>
        )}
      </div>
    )
  }

  // When open, reveal the sub-zero frost interior cavity and the door swung open outward (165°)
  return (
    <div
      style={{
        position: 'absolute',
        top: '9.9%',
        left: '13.6%',
        width: '72.8%',
        height: '19.5%',
        zIndex: 36,
        perspective: '1800px',
        transformStyle: 'preserve-3d',
      }}
      className="select-none overflow-visible pointer-events-auto group/freezer"
    >
      {/* 1. Target indicator when dragging product */}
      {isTargeted && (
        <div className="absolute inset-0 rounded-md border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_16px_rgba(6,182,212,0.8)] pointer-events-none z-50 animate-pulse flex items-center justify-center">
          <span className="px-2.5 py-1 rounded-full bg-cyan-600 text-white text-[8px] font-black tracking-wide shadow-md uppercase">
            Snap to Sub-Zero Freezer
          </span>
        </div>
      )}

      {/* 2. Realistic Stationary Freezer Housing & Cavity Box */}
      <div
        className="absolute inset-0 rounded-md overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-100 border border-slate-300 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(15,23,42,0.06)]"
        style={{
          transform: 'translateZ(2px)',
          transformStyle: 'preserve-3d',
        }}
        onClick={(e) => {
          onToggle(e)
        }}
      >
        {/* Sub-Zero Cool Frost Ambient Sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 via-transparent to-slate-100/40 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-sky-200/40 to-transparent blur-xs pointer-events-none" />

        {/* Side Molded Shelf Rails */}
        <div className="absolute inset-y-2 left-1.5 w-1 rounded-full bg-slate-300/60 shadow-xs pointer-events-none" />
        <div className="absolute inset-y-2 right-1.5 w-1 rounded-full bg-slate-300/60 shadow-xs pointer-events-none" />

        {/* Status Badge & Close Affordance */}
        <div className="absolute top-1.5 inset-x-2 flex items-center justify-between z-20 pointer-events-auto">
          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-200/90 shadow-2xs pointer-events-none">
            <Snowflake className="w-2.5 h-2.5 text-cyan-600 animate-spin-slow" />
            <span className="font-mono text-[7.5px] font-extrabold tracking-tight">
              SUB-ZERO FREEZER • -18°C
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="px-2 py-0.5 rounded bg-white/95 hover:bg-cyan-50 border border-cyan-400/80 text-[7.5px] font-bold text-cyan-800 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            title="Click to close freezer door"
          >
            <DoorClosed className="w-2.5 h-2.5 text-cyan-600" />
            <span>Close Door ◀</span>
          </button>
        </div>

        {/* Products in Freezer (Firmly anchored to the bottom baseline) */}
        <div
          className="absolute inset-0 pointer-events-none pb-1"
          style={{
            zIndex: 10,
            transform: 'translateZ(4px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {products.map((product) => {
            const shelfDef = SHELF_DEFINITIONS.freezer
            const leftPos = Math.max(
              shelfDef.horizontalRange[0],
              Math.min(shelfDef.horizontalRange[1], product.positionX)
            )
            const scale = Math.max(0.4, Math.min(1.8, (product.displayScale || 1.0) * 0.95))
            return (
              <FridgeProductCluster
                key={product.id}
                product={product}
                baseLeftPercent={leftPos}
                baseBaselinePercent={shelfDef.surfaceTopPercent}
                baseScale={scale}
                containerType="freezer"
                isEditable={isEditable}
                isHighlighted={Boolean(
                  highlightedProductId && product.id === highlightedProductId
                )}
                isBeingDragged={activeDragProductId === product.id}
                onPointerDown={
                  onProductPointerDown ? (e) => onProductPointerDown(e, product) : undefined
                }
                onClick={onProductClick ? () => onProductClick(product) : undefined}
              />
            )
          })}
        </div>
      </div>

      {/* 3. Structural Vertical Right-Side Hinge Pivot */}
      <div
        style={{
          position: 'absolute',
          top: '1px',
          bottom: '1px',
          right: '-1px',
          width: '6px',
          transform: 'translateZ(4px)',
          zIndex: 39,
        }}
        className="pointer-events-none rounded-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border border-slate-300 shadow-md flex flex-col justify-between items-center py-0.5"
        title="Freezer Door Right Hinge"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
      </div>

      {/* 4. Sub-Zero Freezer Front Door (Swung outward smoothly around right-side hinge) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(e as unknown as React.MouseEvent)
          }
        }}
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'calc(100% - 2px) center',
          transform: 'translateZ(6px) rotateY(165deg)',
          transition: 'transform 500ms cubic-bezier(0.25, 1, 0.4, 1)',
          transformStyle: 'preserve-3d',
          zIndex: 38,
          cursor: 'pointer',
          pointerEvents: 'auto',
          boxShadow: '6px 3px 16px rgba(15, 23, 42, 0.28), 2px 1px 6px rgba(15, 23, 42, 0.16)',
        }}
        className="group/door cursor-pointer rounded-md outline-none"
        title="Click freezer door to close"
        aria-label="Close freezer door"
      >
        {/* BACK INNER FACE (Visible when door swings open) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateZ(-2px) rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
          className="rounded-md overflow-hidden bg-gradient-to-l from-white/90 via-sky-50/75 to-slate-100/90 border border-white/80 shadow-md p-1.5 flex flex-col justify-between items-center backdrop-blur-[1.5px]"
        >
          <div className="absolute inset-1 rounded-sm border-2 border-slate-300/80 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-1 text-[7px] font-bold text-slate-700 pt-0.5">
            <Snowflake className="w-2 h-2 text-cyan-500" />
            <span>Freezer Door Open (165°)</span>
          </div>
          <div className="relative z-10 text-[7px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300 shadow-2xs">
            <span>Tap to Close ◀</span>
          </div>
        </div>
      </div>
    </div>
  )
}
