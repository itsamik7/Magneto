import React from 'react'
import type {
  FridgeProduct,
  StackingArrangement,
  ProductVisualDimensions,
} from '../../../types/fridgeProduct'
import { getProductDimensions } from '../../../types/fridgeProduct'

export interface RenderUnit {
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
export function calculateProductUnits(
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
    const effStep = dims ? Math.max(12, dims.heightPx * 0.72) : Math.max(12, spacing * 0.7)
    for (let i = 0; i < safeCount; i++) {
      units.push({
        key: `unit-${i}`,
        offsetX: 0,
        offsetY: -i * effStep,
        scaleFactor: 1.0,
        zIndex: 10 + i,
      })
    }
    return units
  }

  return [{ key: 'unit-0', offsetX: 0, offsetY: 0, scaleFactor: 1.0, zIndex: 10 }]
}

export interface FridgeProductClusterProps {
  product: FridgeProduct
  baseLeftPercent: number
  baseBaselinePercent: number
  baseScale?: number
  containerType?: 'shelf' | 'freezer' | 'door'
  isEditable?: boolean
  isHighlighted?: boolean
  isBeingDragged?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
  onClick?: (e: React.MouseEvent) => void
}

export const FridgeProductCluster: React.FC<FridgeProductClusterProps> = ({
  product,
  baseLeftPercent,
  baseBaselinePercent,
  baseScale = 1.0,
  containerType = 'shelf',
  isEditable = false,
  isHighlighted = false,
  isBeingDragged = false,
  onPointerDown,
  onClick,
}) => {
  const count = Math.max(1, Math.min(12, product.itemCount || 1))
  const arrangement = product.arrangement || 'single'
  const spacing = Math.max(10, Math.min(45, product.spacing || 18))
  const dims = getProductDimensions(product)
  const units = calculateProductUnits(count, arrangement, spacing, dims)

  return (
    <div
      style={{
        position: 'absolute',
        top: `${baseBaselinePercent}%`,
        left: `${baseLeftPercent}%`,
        transform: `translate(-50%, -100%) scale(${baseScale})`,
        transformOrigin: 'bottom center',
        zIndex: isHighlighted || isBeingDragged ? 45 : 20,
        touchAction: 'none',
      }}
      className={`group/product transition-transform duration-150 select-none pointer-events-auto ${
        isEditable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
      } ${isHighlighted ? 'scale-105' : ''} ${isBeingDragged ? 'opacity-90 scale-105' : ''}`}
      title={
        isEditable
          ? `${product.name} (${product.category}${product.quantity ? ` • ${product.quantity}` : ''}${
              count > 1 ? ` • ${count} units` : ''
            }) - Drag to reposition on shelf`
          : `${product.name} (${product.category}${product.quantity ? ` • ${product.quantity}` : ''})`
      }
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {/* Live edit badge */}
      {isEditable && isHighlighted && (
        <div className="absolute left-1/2 -top-8 -translate-x-1/2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap pointer-events-none z-50 animate-pulse border border-white/50 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Live Edit {count > 1 ? `(${count})` : ''}</span>
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
          <span className="text-amber-300 font-semibold text-[8px]">[{product.quantity}]</span>
        )}
      </div>

      {/* Render Units anchored to bottom surface */}
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
              {/* Physical Contact Shadow & Ambient Occlusion */}
              {isGroundUnit && (
                <>
                  {/* Core Ambient Occlusion */}
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

                  {/* Soft Ambient Contact Shadow */}
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

                  {/* Translucent Glass Specular Highlight on Shelves */}
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

              {/* Stacked Inter-Unit Contact Shadow */}
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

              {/* Product Graphic */}
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
