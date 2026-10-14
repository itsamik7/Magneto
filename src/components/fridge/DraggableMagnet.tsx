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
  Lock,
} from 'lucide-react'

interface DraggableMagnetProps {
  placement: MagnetPlacement
  isSelected: boolean
  surfaceRef: React.RefObject<HTMLDivElement | null>
  isEditable?: boolean
  onSelect: () => void
  onUpdatePlacement: (updated: MagnetPlacement, isCommit?: boolean) => void
  onRemove: () => void
  onBringToFront: () => void
  onClick?: () => void
}

export const DraggableMagnet: React.FC<DraggableMagnetProps> = ({
  placement,
  isSelected,
  surfaceRef,
  isEditable = true,
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

    if (!isEditable) {
      if (onClick) onClick()
      return
    }

    const surface = surfaceRef.current
    if (!surface) return

    isDraggingRef.current = true
    setIsDragging(true)
    hasMovedRef.current = false

    const basePlacement = { ...placement }
    let lastCoords = { x: placement.x, y: placement.y }

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

      lastCoords = { x: newX, y: newY }

      // Update position visually without saving to disk on every frame
      onUpdatePlacement({
        ...basePlacement,
        x: newX,
        y: newY,
      }, false)
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

      if (hasMovedRef.current) {
        // Commit final coordinates to persistent storage once drag finishes!
        onUpdatePlacement({
          ...basePlacement,
          x: lastCoords.x,
          y: lastCoords.y,
        }, true)
      } else if (onClick) {
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
    const basePlacement = { ...placement }
    let lastScale = placement.scale

    const onMove = (moveEvt: PointerEvent) => {
      const deltaY = (startClientY - moveEvt.clientY) * (corner.includes('n') ? 0.01 : -0.01)
      const newScale = Math.min(1.8, Math.max(0.55, Number((startScale + deltaY).toFixed(2))))
      lastScale = newScale
      onUpdatePlacement({
        ...basePlacement,
        scale: newScale,
      }, false)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      onUpdatePlacement({
        ...basePlacement,
        scale: lastScale,
      }, true)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Quick Action Buttons
  const handleScaleDelta = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newScale = Math.min(1.8, Math.max(0.55, Number((placement.scale + delta).toFixed(2))))
    onUpdatePlacement({ ...placement, scale: newScale }, true)
  }

  const handleRotateDelta = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation()
    let newRotation = placement.rotation + delta
    if (newRotation > 180) newRotation -= 360
    if (newRotation < -180) newRotation += 360
    onUpdatePlacement({ ...placement, rotation: newRotation }, true)
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
      className={`group select-none ${
        isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:scale-[1.02]'
      } ${isDragging ? 'opacity-90 scale-105' : 'transition-all duration-150'}`}
    >
      {/* Visual Magnet Body */}
      <div className="relative flex flex-col items-center">
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

          {/* Lock Icon Badge (Top Right of Magnet) */}
          {(placement.hasLock ||
            placement.isFundedPending ||
            placement.magnetSlug === 'rome' ||
            placement.magnetSlug === 'santorini' ||
            placement.magnetSlug === 'thailand') && (
            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/85 backdrop-blur-xs text-white flex items-center justify-center shadow-md border border-white/40 pointer-events-none">
              <Lock className="w-2.5 h-2.5 fill-white" />
            </div>
          )}

          {/* Selection Indicator Ring */}
          {isSelected && (
            <div
              className={`absolute -inset-2.5 rounded-3xl pointer-events-none ${
                isEditable
                  ? 'border-2 border-dashed border-emerald-500/90 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse'
                  : 'border-2 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
              }`}
            />
          )}
        </div>

        {/* State Badge Pill (Directly Below Magnet) */}
        {/* State 1: Funded (Trip Pending) Amber Frosted Pill */}
        {(placement.isFundedPending ||
          placement.magnetSlug === 'rome' ||
          placement.magnetSlug === 'bali') ? (
          <div className="mt-1.5 px-3 py-1 bg-amber-500/85 backdrop-blur-md text-white text-[9px] font-heading font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 border border-amber-300/70 pointer-events-none whitespace-nowrap">
            <Lock className="w-2.5 h-2.5 fill-white" />
            <span>Funded (Trip Pending)</span>
          </div>
        ) : (placement.totalSavedMinor !== undefined && placement.targetBudgetMinor !== undefined) ? (
          /* State 2: Saving in Progress Pill with Progress Bar */
          <div className="mt-1.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 pointer-events-none flex flex-col items-center gap-1 min-w-[110px]">
            <span className="text-[9px] font-heading font-black text-blue-600 tracking-tight whitespace-nowrap">
              ₹ {(placement.totalSavedMinor / 100).toLocaleString('en-IN')} / ₹ {(placement.targetBudgetMinor / 100).toLocaleString('en-IN')}
            </span>
            <div className="w-full h-1 bg-slate-200/90 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((placement.totalSavedMinor / placement.targetBudgetMinor) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Resize Corner Handles & Floating Actions (Only in Edit Mode) */}
      {isSelected && isEditable && (
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
