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

      // Dynamically compute visual half-dimensions relative to the surface
      let halfW = 0.05
      let halfH = 0.035
      if (magnetRef.current && rect.width > 0 && rect.height > 0) {
        const mRect = magnetRef.current.getBoundingClientRect()
        // mRect and rect scale identically with any zoom factor
        halfW = (mRect.width / 2) / rect.width
        halfH = (mRect.height / 2) / rect.height
      } else {
        halfW = 0.055 * placement.scale
        halfH = 0.04 * placement.scale
      }

      // Permitted bounds: magnet's visible bounding box stays strictly inside the usable surface [0, 1]
      // Top edge of the magnet can reach 0.00 (the very upper edge of the door)
      const minX = Math.max(0.015, halfW)
      const maxX = Math.min(0.985, 1 - halfW)
      const minY = Math.max(0.015, halfH)
      const maxY = Math.min(0.985, 1 - halfH)

      const targetX = pointerStartRef.current.startX + normDeltaX
      const targetY = pointerStartRef.current.startY + normDeltaY

      const newX = Math.min(maxX, Math.max(minX, targetX))
      const newY = Math.min(maxY, Math.max(minY, targetY))

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
      data-magnet="true"
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
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
        {(placement.isFundedPending ||
          placement.unlockState === 'ready_to_go' ||
          placement.progressPercentage === 100) ? (
          /* State 1: Funded / Ready to Go Pill */
          <div className="mt-1 px-2 py-0.5 bg-emerald-600/95 backdrop-blur-md text-white text-[8px] font-heading font-extrabold rounded-lg shadow-sm flex items-center justify-center gap-1 border border-emerald-300/70 pointer-events-none whitespace-nowrap">
            <Lock className="w-2 h-2 fill-white" />
            <span>Funded • ₹{((placement.totalSavedMinor ?? 0) / 100).toLocaleString('en-IN')}</span>
          </div>
        ) : (
          /* State 2: Saving in Progress Pill with Progress Bar */
          <div className="mt-1 px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-lg shadow-xs border border-slate-200/90 pointer-events-none flex flex-col items-center gap-0.5 min-w-[70px] max-w-[95px]">
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-heading font-black text-slate-400 uppercase tracking-wider">SAVED</span>
              <span className="text-[8px] font-heading font-black text-blue-600 tracking-tight whitespace-nowrap">
                ₹ {((placement.totalSavedMinor ?? 0) / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-200/90 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((placement.totalSavedMinor ?? 0) / Math.max(1, placement.targetBudgetMinor ?? 15000000)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
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

          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 text-white z-50 text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 ${
              placement.y < 0.16 ? 'top-full mt-3.5' : '-top-12'
            }`}
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
