import React from 'react'
import type { FridgeShelf } from '../../../types/fridgeProduct'
import { SHELF_DEFINITIONS } from '../../../types/fridgeProduct'

export interface FridgeMainShelvesProps {
  isEditable?: boolean
  activeDragShelf?: FridgeShelf | null
  activeDragPositionX?: number
}

interface ShelfRenderConfig {
  key: 'top_shelf' | 'middle_shelf' | 'bottom_shelf'
  surfaceTopPercent: number
  label: string
}

const SHELVES_CONFIG: ShelfRenderConfig[] = [
  {
    key: 'top_shelf',
    surfaceTopPercent: SHELF_DEFINITIONS.top_shelf.surfaceTopPercent,
    label: 'Upper Shelf',
  },
  {
    key: 'middle_shelf',
    surfaceTopPercent: SHELF_DEFINITIONS.middle_shelf.surfaceTopPercent,
    label: 'Lower Shelf',
  },
  {
    key: 'bottom_shelf',
    surfaceTopPercent: SHELF_DEFINITIONS.bottom_shelf.surfaceTopPercent,
    label: 'Cavity Floor',
  },
]

export const FridgeMainShelves: React.FC<FridgeMainShelvesProps> = ({
  isEditable = false,
  activeDragShelf,
}) => {
  // Only render visual drop targets when actively dragging a product.
  // In idle state, the photorealistic tempered glass shelves and floor of the appliance photo
  // shine through naturally without any conflicting or duplicate CSS geometry.
  if (!isEditable || !activeDragShelf) {
    return null
  }

  return (
    <>
      {SHELVES_CONFIG.map(({ key, surfaceTopPercent, label }) => {
        const isTargeted = activeDragShelf === key
        if (!isTargeted) return null

        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: `${surfaceTopPercent}%`,
              left: '12%',
              right: '12%',
              height: '2px',
              zIndex: 35,
              pointerEvents: 'none',
            }}
            className="select-none animate-pulse"
          >
            {/* Luminous Snap Guide Line */}
            <div className="absolute inset-x-0 top-0 h-1 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.95)]" />

            {/* Active Snap Badge */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-cyan-600/95 text-white text-[7.5px] font-black tracking-wider uppercase shadow-lg border border-cyan-300 animate-bounce flex items-center gap-1 z-30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-ping" />
              <span>Snap to {label}</span>
            </div>
          </div>
        )
      })}
    </>
  )
}
