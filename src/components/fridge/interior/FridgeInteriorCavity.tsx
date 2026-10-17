import React from 'react'
import type { FridgeProduct, FridgeShelf } from '../../../types/fridgeProduct'
import { SHELF_DEFINITIONS } from '../../../types/fridgeProduct'
import { FridgeFreezerCompartment } from './FridgeFreezerCompartment'
import { FridgeMainShelves } from './FridgeMainShelves'
import { FridgeProductCluster } from './FridgeProductCluster'

export interface FridgeInteriorCavityProps {
  cavityRef?: React.RefObject<HTMLDivElement | null>
  isDoorOpen: boolean
  isFreezerOpen: boolean
  onToggleFreezer: (e?: React.MouseEvent) => void
  freezerProducts: FridgeProduct[]
  cavityProducts: FridgeProduct[]
  isEditable?: boolean
  activeDragShelf?: FridgeShelf | null
  activeDragPositionX?: number
  highlightedProductId?: string
  activeDragProductId?: string
  onProductPointerDown?: (
    e: React.PointerEvent,
    product: FridgeProduct,
    containerType: 'shelf' | 'freezer'
  ) => void
  onProductClick?: (product: FridgeProduct) => void
}

export const FridgeInteriorCavity: React.FC<FridgeInteriorCavityProps> = ({
  cavityRef,
  isDoorOpen,
  isFreezerOpen,
  onToggleFreezer,
  freezerProducts,
  cavityProducts,
  isEditable = false,
  activeDragShelf,
  activeDragPositionX,
  highlightedProductId,
  activeDragProductId,
  onProductPointerDown,
  onProductClick,
}) => {
  return (
    <div
      ref={cavityRef}
      style={{
        position: 'absolute',
        inset: 0,
        transform: isDoorOpen ? 'translateZ(-2px)' : 'translateZ(-30px)',
        transformStyle: isDoorOpen ? 'preserve-3d' : 'flat',
        zIndex: isDoorOpen ? 25 : 5,
        pointerEvents: isDoorOpen ? 'auto' : 'none',
        overflow: isDoorOpen ? 'visible' : 'hidden',
      }}
      className="rounded-lg shadow-2xl bg-slate-100 border border-slate-400/80 select-none"
    >
      {/* 
        1. Natural Architectural Interior Walls, Rear Cooling Panel, Ceiling, & Lighting
      */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        {/* Clean Food-Grade Interior Walls and Rear Panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200" />

        {/* Photorealistic Cavity Lighting & Textures */}
        <img
          src="/fridges/realistic-fridge-interior.png"
          alt="Illuminated Refrigerator Interior Cavity"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg opacity-95"
        />

        {/* 5000K Daylight LED Ceiling Light Source */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
            isDoorOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Daylight Light Spill */}
          <div className="absolute top-0 inset-x-4 h-32 bg-gradient-to-b from-white/90 via-sky-100/30 to-transparent blur-xs pointer-events-none" />
          {/* Lateral diffuse shelf lights */}
          <div className="absolute top-[28%] inset-x-2 h-8 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          <div className="absolute top-[50%] inset-x-2 h-8 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* 
        2. Fresh Sub-Zero Freezer Compartment (Top 3.5% - 26%)
        Stationary housing and cavity, with right-hinged door opening outward.
      */}
      <FridgeFreezerCompartment
        isOpen={isFreezerOpen}
        onToggle={onToggleFreezer}
        products={freezerProducts}
        isEditable={isEditable}
        activeDragShelf={activeDragShelf}
        highlightedProductId={highlightedProductId}
        activeDragProductId={activeDragProductId}
        onProductPointerDown={
          onProductPointerDown ? (e, p) => onProductPointerDown(e, p, 'freezer') : undefined
        }
        onProductClick={onProductClick}
      />

      {/* 
        3. Fresh Main Interior Shelves
        Upper tempered glass shelf at 46.8% and lower shelf at 66.0% with chrome lips and wall brackets.
      */}
      <FridgeMainShelves
        isEditable={isEditable}
        activeDragShelf={activeDragShelf}
        activeDragPositionX={activeDragPositionX}
      />

      {/* 
        4. Main Cavity Products Container (Resting on glass shelves and floor)
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
          zIndex: 24,
        }}
      >
        {cavityProducts.map((product) => {
          const shelfKey: FridgeShelf =
            product.shelf === 'top_shelf'
              ? 'top_shelf'
              : product.shelf === 'bottom_shelf'
                ? 'bottom_shelf'
                : 'middle_shelf'
          const shelfDef = SHELF_DEFINITIONS[shelfKey] || SHELF_DEFINITIONS.middle_shelf
          const leftPos = Math.max(
            shelfDef.horizontalRange[0],
            Math.min(shelfDef.horizontalRange[1], product.positionX)
          )
          const baselinePos = shelfDef.surfaceTopPercent
          const scale = Math.max(0.4, Math.min(2.0, product.displayScale || 1.0))

          return (
            <FridgeProductCluster
              key={product.id}
              product={product}
              baseLeftPercent={leftPos}
              baseBaselinePercent={baselinePos}
              baseScale={scale}
              containerType="shelf"
              isEditable={isEditable}
              isHighlighted={Boolean(
                highlightedProductId && product.id === highlightedProductId
              )}
              isBeingDragged={activeDragProductId === product.id}
              onPointerDown={
                onProductPointerDown
                  ? (e) => onProductPointerDown(e, product, 'shelf')
                  : undefined
              }
              onClick={onProductClick ? () => onProductClick(product) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
