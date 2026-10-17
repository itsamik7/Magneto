import React from 'react'
import type { FridgeProduct, FridgeShelf } from '../../../types/fridgeProduct'
import { SHELF_DEFINITIONS } from '../../../types/fridgeProduct'
import { FridgeProductCluster } from './FridgeProductCluster'

export interface FridgeDoorBinsProps {
  products: FridgeProduct[]
  isEditable?: boolean
  activeDragShelf?: FridgeShelf | null
  activeDragPositionX?: number
  highlightedProductId?: string
  activeDragProductId?: string
  onProductPointerDown?: (
    e: React.PointerEvent,
    product: FridgeProduct,
    containerType: 'door'
  ) => void
  onProductClick?: (product: FridgeProduct) => void
}

interface DoorBinConfig {
  shelfKey: 'door_bin_top' | 'door_bin_middle' | 'door_bin_bottom'
  topPercent: number
  heightPercent: number
  frontRailHeight: number
  tierName: string
}

const DOOR_BINS_CONFIG: DoorBinConfig[] = [
  {
    shelfKey: 'door_bin_top',
    topPercent: 14,
    heightPercent: 16,
    frontRailHeight: 22,
    tierName: 'DAIRY & CONDIMENTS',
  },
  {
    shelfKey: 'door_bin_middle',
    topPercent: 38,
    heightPercent: 18,
    frontRailHeight: 26,
    tierName: 'SAUCES & BEVERAGES',
  },
  {
    shelfKey: 'door_bin_bottom',
    topPercent: 64,
    heightPercent: 24,
    frontRailHeight: 34,
    tierName: 'DEEP GALLON STORAGE',
  },
]

export const FridgeDoorBins: React.FC<FridgeDoorBinsProps> = ({
  products,
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
      className="absolute inset-0 pointer-events-none"
      style={{
        transformStyle: 'preserve-3d',
        zIndex: 20,
      }}
    >
      {DOOR_BINS_CONFIG.map(
        ({ shelfKey, topPercent, heightPercent, frontRailHeight, tierName }) => {
          const shelfDef = SHELF_DEFINITIONS[shelfKey]
          const isTargeted = isEditable && activeDragShelf === shelfKey
          const shelfProducts = products.filter((p) => p.shelf === shelfKey)

          return (
            <div
              key={shelfKey}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: `${topPercent}%`,
                left: '6%',
                right: '6%',
                height: `${heightPercent}%`,
                zIndex: 20,
                transformStyle: 'preserve-3d',
                transform: 'translateZ(6px)',
              }}
              className="select-none pointer-events-auto"
            >
              {/* 1. Underside Ambient Occlusion Contact Shadow onto Door Liner below */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-12px',
                  left: '2%',
                  right: '2%',
                  height: '16px',
                  background:
                    'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.08) 55%, transparent 80%)',
                  filter: 'blur(2px)',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />

              {/* 2. Rear Mounting Panel */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.92) 100%)',
                  borderRadius: '6px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  boxShadow: isTargeted
                    ? '0 0 16px rgba(59, 130, 246, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.9)'
                    : 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(15, 23, 42, 0.1)',
                  zIndex: 2,
                  transition: 'all 200ms ease',
                }}
                className="overflow-hidden"
              >
                <div className="absolute top-1 left-1.5 bottom-1 w-1.5 rounded-xs bg-gradient-to-r from-slate-400 to-slate-200 shadow-inner" />
                <div className="absolute top-1 right-1.5 bottom-1 w-1.5 rounded-xs bg-gradient-to-l from-slate-400 to-slate-200 shadow-inner" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
              </div>

              {/* 3. Sturdy Horizontal Bottom Floor (Product Base) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '14px',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.95)',
                  borderBottom: '1.5px solid rgba(148, 163, 184, 0.8)',
                  borderRadius: '0 0 6px 6px',
                  transform: 'translateZ(10px)',
                  boxShadow:
                    '0 2px 4px rgba(15, 23, 42, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                  zIndex: 4,
                }}
              />

              {/* 4. Left Molded Translucent Acrylic Side Wall */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: '10px',
                  background:
                    'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(226, 232, 240, 0.65) 100%)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.9)',
                  borderLeft: '1px solid rgba(203, 213, 225, 0.85)',
                  borderRadius: '6px 0 0 6px',
                  transform: 'translateZ(8px)',
                  zIndex: 5,
                }}
              />

              {/* 5. Right Molded Translucent Acrylic Side Wall */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '10px',
                  background:
                    'linear-gradient(270deg, rgba(255, 255, 255, 0.9) 0%, rgba(226, 232, 240, 0.65) 100%)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.9)',
                  borderRight: '1px solid rgba(203, 213, 225, 0.85)',
                  borderRadius: '0 6px 6px 0',
                  transform: 'translateZ(8px)',
                  zIndex: 5,
                }}
              />

              {/* 6. Products Container (Resting on floor, behind front retaining rail) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  transform: 'translateZ(14px)',
                  pointerEvents: 'none',
                }}
              >
                {shelfProducts.map((product) => {
                  const leftPos = Math.max(
                    shelfDef.horizontalRange[0],
                    Math.min(shelfDef.horizontalRange[1], product.positionX)
                  )
                  const scale = Math.max(0.4, Math.min(1.8, (product.displayScale || 1.0) * 0.92))
                  return (
                    <FridgeProductCluster
                      key={product.id}
                      product={product}
                      baseLeftPercent={leftPos}
                      baseBaselinePercent={100}
                      baseScale={scale}
                      containerType="door"
                      isEditable={isEditable}
                      isHighlighted={Boolean(
                        highlightedProductId && product.id === highlightedProductId
                      )}
                      isBeingDragged={activeDragProductId === product.id}
                      onPointerDown={
                        onProductPointerDown
                          ? (e) => onProductPointerDown(e, product, 'door')
                          : undefined
                      }
                      onClick={onProductClick ? () => onProductClick(product) : undefined}
                    />
                  )
                })}
              </div>

              {/* 7. Front Retaining Rail with Brushed Stainless Steel Rim */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${frontRailHeight}px`,
                  transform: 'translateZ(18px)',
                  zIndex: 25,
                  pointerEvents: 'none',
                }}
                className="flex flex-col justify-between"
              >
                {/* Brushed Stainless Steel Guardrail Top Edge */}
                <div
                  style={{
                    height: '4px',
                    background: isTargeted
                      ? 'linear-gradient(90deg, #3b82f6 0%, #93c5fd 50%, #3b82f6 100%)'
                      : 'linear-gradient(90deg, #94a3b8 0%, #ffffff 30%, #cbd5e1 60%, #94a3b8 100%)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: isTargeted
                      ? '0 0 12px rgba(59, 130, 246, 0.95)'
                      : '0 1px 3px rgba(15, 23, 42, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.95)',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.6)',
                    transition: 'all 200ms ease',
                  }}
                />

                {/* Frosted Translucent Acrylic Retaining Wall */}
                <div
                  style={{
                    flex: 1,
                    background:
                      'linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, rgba(241, 245, 249, 0.45) 50%, rgba(226, 232, 240, 0.55) 100%)',
                    backdropFilter: 'blur(2px)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.85)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.85)',
                    borderBottom: '1.5px solid rgba(203, 213, 225, 0.9)',
                    borderRadius: '0 0 6px 6px',
                    boxShadow:
                      'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(15, 23, 42, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                  }}
                >
                  <span className="text-[7.5px] font-heading font-black tracking-widest text-slate-500/80 uppercase select-none">
                    {tierName}
                  </span>
                  {isTargeted && (
                    <span className="text-[7.5px] font-bold text-blue-600 bg-blue-100/90 px-1.5 py-0.5 rounded-xs animate-pulse">
                      Drop Zone Active
                    </span>
                  )}
                </div>
              </div>

              {/* 8. Active Drag Guideline */}
              {isTargeted && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: `${activeDragPositionX || 50}%`,
                    transform: 'translateX(-50%) translateZ(24px)',
                    zIndex: 35,
                    pointerEvents: 'none',
                  }}
                  className="flex flex-col items-center animate-bounce"
                >
                  <div className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[8px] font-bold shadow-lg border border-blue-300 whitespace-nowrap">
                    Position: {activeDragPositionX}%
                  </div>
                  <div className="w-0.5 h-4 bg-blue-500 shadow-sm" />
                </div>
              )}
            </div>
          )
        }
      )}
    </div>
  )
}
