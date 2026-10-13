import React, { useRef, useState, useEffect } from 'react'
import type { MagnetPlacement } from '../../types/fridge'
import { MagnetGraphic } from './MagnetGraphic'
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ArrowUpToLine,
  Trash2,
  ExternalLink,
} from 'lucide-react'

interface DraggableMagnetProps {
  placement: MagnetPlacement
  isSelected: boolean
  surfaceRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onUpdatePlacement: (updated: MagnetPlacement) => void
  onRemove: () => void
  onBringToFront: () => void
  onClick?: () => void
}

export const DraggableMagnet: React.FC<DraggableMagnetProps> = ({
  placement,
  isSelected,
  surfaceRef,
  onSelect,
  onUpdatePlacement,
  onRemove,
  onBringToFront,
  onClick,
}) => {
  const magnetRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const pointerStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
  })
  const hasMovedRef = useRef(false)

  // Dragging logic via Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary pointer button
    if (e.button !== 0) return

    // Prevent propagation so parent container doesn't deselect
    e.stopPropagation()
    onSelect()

    const surface = surfaceRef.current
    if (!surface) return

    isDraggingRef.current = true
    setIsDragging(true)
    hasMovedRef.current = false

    pointerStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: placement.x,
      startY: placement.y,
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignored if pointer capture not supported
    }

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingRef.current || !surfaceRef.current) return

      const deltaX = moveEvt.clientX - pointerStartRef.current.clientX
      const deltaY = moveEvt.clientY - pointerStartRef.current.clientY

      if (Math.hypot(deltaX, deltaY) > 4) {
        hasMovedRef.current = true
      }

      const rect = surfaceRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const normDeltaX = deltaX / rect.width
      const normDeltaY = deltaY / rect.height

      // Clamp coordinates so magnet remains on usable fridge door
      const newX = Math.min(0.92, Math.max(0.08, pointerStartRef.current.startX + normDeltaX))
      const newY = Math.min(0.92, Math.max(0.08, pointerStartRef.current.startY + normDeltaY))

      onUpdatePlacement({
        ...placement,
        x: newX,
        y: newY,
      })
    }

    const onPointerUp = (upEvt: PointerEvent) => {
      isDraggingRef.current = false
      setIsDragging(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      try {
        if (e.currentTarget.hasPointerCapture(upEvt.pointerId)) {
          e.currentTarget.releasePointerCapture(upEvt.pointerId)
        }
      } catch {
        // Ignore
      }

      // If user clicked without dragging, trigger onClick
      if (!hasMovedRef.current && onClick) {
        onClick()
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Handle Resize Corner Dragging
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    corner: 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    e.stopPropagation()
    const startClientY = e.clientY
    const startScale = placement.scale

    const onMove = (moveEvt: PointerEvent) => {
      const deltaY = (startClientY - moveEvt.clientY) * (corner.includes('n') ? 0.01 : -0.01)
      const newScale = Math.min(1.8, Math.max(0.55, Number((startScale + deltaY).toFixed(2))))
      onUpdatePlacement({
        ...placement,
        scale: newScale,
      })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Quick Action Buttons
  const handleScaleDelta = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newScale = Math.min(1.8, Math.max(0.55, Number((placement.scale + delta).toFixed(2))))
    onUpdatePlacement({ ...placement, scale: newScale })
  }

  const handleRotateDelta = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    let newRotation = placement.rotation + delta
    if (newRotation > 180) newRotation -= 360
    if (newRotation < -180) newRotation += 360
    onUpdatePlacement({ ...placement, rotation: newRotation })
  }

  return (
    <div
      ref={magnetRef}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg) scale(${placement.scale})`,
        zIndex: isSelected ? 100 : placement.zIndex,
        touchAction: 'none',
      }}
      className={`group select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'opacity-90 scale-105' : ''
      }`}
    >
      {/* Visual Magnet Body */}
      <div className="relative">
        <MagnetGraphic
          magnetKey={placement.magnetSlug}
          assetUrl={placement.assetUrl}
          destinationName={placement.destinationName}
          state={placement.unlockState || 'dreaming'}
          progressPercentage={placement.progressPercentage || 0}
          isInteractive={false}
          floatVariant={isDragging ? 1 : 1}
        />

        {/* Selection Indicator Ring */}
        {isSelected && (
          <div className="absolute -inset-2.5 rounded-3xl border-2 border-dashed border-emerald-500/90 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse" />
        )}
      </div>

      {/* Resize Corner Handles (Visible when selected) */}
      {isSelected && (
        <>
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
            className="absolute -top-3 -left-3 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 shadow-md cursor-nwse-resize z-40 hover:scale-125 transition-transform"
            title="Resize Magnet"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
            className="absolute -top-3 -right-3 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 shadow-md cursor-nesw-resize z-40 hover:scale-125 transition-transform"
            title="Resize Magnet"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            className="absolute -bottom-3 -right-3 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 shadow-md cursor-nwse-resize z-40 hover:scale-125 transition-transform"
            title="Resize Magnet"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
            className="absolute -bottom-3 -left-3 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 shadow-md cursor-nesw-resize z-40 hover:scale-125 transition-transform"
            title="Resize Magnet"
          />

          {/* Floating Quick Action Controls Bar */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute left-1/2 -top-12 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 text-white z-50 text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={(e) => handleRotateDelta(-15, e)}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              title="Rotate Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-200" />
            </button>
            <button
              onClick={(e) => handleRotateDelta(15, e)}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              title="Rotate Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-200" />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

            <button
              onClick={(e) => handleScaleDelta(-0.15, e)}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              title="Smaller"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-200" />
            </button>
            <span className="text-[10px] font-mono font-bold text-emerald-400 px-0.5">
              {Math.round(placement.scale * 100)}%
            </span>
            <button
              onClick={(e) => handleScaleDelta(0.15, e)}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              title="Larger"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-200" />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

            <button
              onClick={(e) => {
                e.stopPropagation()
                onBringToFront()
              }}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5 text-amber-300" />
            </button>

            {onClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                title="View Destination / Trip Details"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="p-1 hover:bg-rose-900/60 text-rose-300 rounded-lg transition-colors"
              title="Remove from Fridge"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
