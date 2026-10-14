import React, { useRef, useState } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import { Lightbulb, DoorClosed, MoveHorizontal } from 'lucide-react'

export interface UniversalSteelFridgeProps {
  isDoorOpen?: boolean
  onToggleDoor?: () => void
  isMainDoorOpen?: boolean
  isFreezerDoorOpen?: boolean
  onToggleMainDoor?: () => void
  onToggleFreezerDoor?: () => void
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
}

export const UniversalSteelFridge: React.FC<UniversalSteelFridgeProps> = ({
  isDoorOpen,
  onToggleDoor,
  isMainDoorOpen,
  isFreezerDoorOpen,
  onToggleMainDoor,
  magneticRegion,
  surfaceRef,
  children,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onSurfaceClick,
  aspectRatio = 0.56,
  yaw = 0,
  onYawChange,
}) => {
  const isEffectiveOpen =
    isDoorOpen !== undefined
      ? isDoorOpen
      : Boolean(isMainDoorOpen || isFreezerDoorOpen)

  const isAnimatingRef = useRef(false)
  const isPointerDownRef = useRef(false)
  const pointerStartRef = useRef<{ x: number; y: number; startYaw: number }>({
    x: 0,
    y: 0,
    startYaw: 0,
  })
  const hasMovedRef = useRef(false)
  const [isRotating, setIsRotating] = useState(false)

  const handleToggle = () => {
    // Debounce rapid clicking during transition to prevent animation glitching
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 650)

    if (onToggleDoor) {
      onToggleDoor()
    } else if (onToggleMainDoor) {
      onToggleMainDoor()
    }
  }

  // Pointer gesture: Drag horizontally to orbit fridge in 3D; Click to open/close door
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If pointer down is on a magnet, DraggableMagnet's pointerDown will stopPropagation
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[data-magnet="true"]')) {
      return
    }

    isPointerDownRef.current = true
    hasMovedRef.current = false
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startYaw: yaw,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return
    const deltaX = e.clientX - pointerStartRef.current.x
    const deltaY = e.clientY - pointerStartRef.current.y
    const distance = Math.hypot(deltaX, deltaY)

    if (distance > 4) {
      hasMovedRef.current = true
      if (!isRotating) setIsRotating(true)
      const nextYaw = Math.max(-65, Math.min(65, pointerStartRef.current.startYaw + deltaX * 0.35))
      if (onYawChange) {
        onYawChange(nextYaw)
      }
    }
  }

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return
    const wasDragging = hasMovedRef.current
    isPointerDownRef.current = false
    setIsRotating(false)

    // If pointer did not drag significantly, treat as direct click on fridge/door to open/close!
    if (!wasDragging) {
      handleToggle()
    }
  }

  return (
    <div
      className={`relative mx-auto select-none ${
        isRotating ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        width: '100%',
        maxWidth: '430px',
        aspectRatio: `${aspectRatio}`,
        maxHeight: '820px',
        perspective: '1600px',
        transformStyle: 'preserve-3d',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 
        3D Turntable Wrapper
        Orbits smoothly as user drags with cursor or hand across the appliance
      */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${yaw}deg)`,
          transition: isRotating ? 'none' : 'transform 300ms cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        {/* 3D Left Cabinet Side Panel (revealed when rotating to the right) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '75px',
            transformOrigin: 'left center',
            transform: 'rotateY(-90deg)',
            backfaceVisibility: 'hidden',
            zIndex: 5,
          }}
          className="rounded-l-2xl border-l-2 border-slate-400 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 shadow-2xl overflow-hidden pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/25 pointer-events-none" />
        </div>

        {/* 3D Right Cabinet Side Panel (revealed when rotating to the left) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '75px',
            transformOrigin: 'right center',
            transform: 'rotateY(90deg)',
            backfaceVisibility: 'hidden',
            zIndex: 5,
          }}
          className="rounded-r-2xl border-r-2 border-slate-700 bg-gradient-to-l from-slate-800 via-slate-700 to-slate-600 shadow-2xl overflow-hidden pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/35 pointer-events-none" />
        </div>

        {/* 3D Top Cabinet Roof */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '75px',
            transformOrigin: 'center top',
            transform: 'rotateX(90deg)',
            backfaceVisibility: 'hidden',
            zIndex: 5,
          }}
          className="rounded-t-2xl border-t-2 border-slate-400 bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 shadow-inner overflow-hidden pointer-events-none"
        />

        {/* 
          ========================================================================
          1. REFRIGERATOR CAVITY (CABINET & ILLUMINATED INTERIOR)
          Pure appliance shell hosting the photorealistic illuminated interior
          ========================================================================
        */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateZ(-15px)',
          }}
          className="rounded-[2.2rem] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_10px_20px_-8px_rgba(0,0,0,0.18)] overflow-hidden bg-slate-900 border-2 border-slate-300"
        >
          {/* Photorealistic Interior Cavity Image */}
          <img
            src="/fridges/realistic-fridge-interior.png"
            alt="Illuminated Refrigerator Interior"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-[2.2rem]"
          />

          {/* 
            DYNAMIC 5000K DAYLIGHT LED INTERIOR LIGHTING ENGINE
            Switches ON when door opens, illuminates shelves and food items,
            and turns OFF smoothly when door closes!
          */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
              isEffectiveOpen ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Daylight LED Spotlight Beam */}
            <div className="absolute top-0 inset-x-6 h-36 bg-gradient-to-b from-white/80 via-sky-100/25 to-transparent blur-xs pointer-events-none" />
            
            {/* Upper Glass Shelf Specular Highlight */}
            <div className="absolute top-[26%] inset-x-2 h-8 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
            
            {/* Middle Glass Shelf Specular Highlight */}
            <div className="absolute top-[46%] inset-x-2 h-8 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            
            {/* Crisper Drawer Bottom Ambient Glow */}
            <div className="absolute bottom-4 inset-x-4 h-24 bg-gradient-to-t from-amber-100/25 via-sky-50/15 to-transparent pointer-events-none" />

            {/* Live 5000K LED Badge Inside Cabinet */}
            <div className="absolute top-3 left-4 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white border border-white/20 text-[8px] font-heading font-bold flex items-center gap-1 shadow-md">
              <Lightbulb className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
              <span>5000K LED ACTIVE</span>
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          2. 3D SWINGING REFRIGERATOR DOOR
          Rotates around its left hinge in authentic CSS 3D perspective.
          Magnets live on the front face of this door and move WITH it in 3D!
          ========================================================================
        */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transform: isEffectiveOpen ? 'rotateY(-80deg)' : 'rotateY(0deg)',
            transition: 'transform 650ms cubic-bezier(0.25, 1, 0.4, 1)',
            transformStyle: 'preserve-3d',
            zIndex: 30,
          }}
          className="group"
        >
          {/* 
            FRONT FACE OF THE DOOR (EXTERIOR):
            High-resolution brushed platinum stainless steel, chrome handle,
            and the embossed "MAGNETO" brand emblem.
          */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'translateZ(10px)',
              backfaceVisibility: 'hidden',
            }}
            className="rounded-[2.2rem] shadow-2xl overflow-hidden bg-slate-800 border-2 border-slate-300"
          >
            {/* Photorealistic Stainless Steel Appliance Door Image */}
            <img
              src="/fridges/premium-steel-door-closed.png"
              alt="Brushed Stainless Steel Refrigerator Door"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-[2.2rem]"
            />

            {/* Directional Brushed Sheen & Ambient Specular Highlight */}
            <div className="absolute inset-0 pointer-events-none rounded-[2.2rem] bg-gradient-to-tr from-transparent via-white/12 to-transparent -translate-x-1/4 transform -skew-x-12" />

            {/* Right Edge Physical Door Thickness & Shadow Bevel */}
            <div className="absolute top-0 right-0 bottom-0 w-3 rounded-r-[2.2rem] bg-gradient-to-r from-transparent to-black/30 pointer-events-none" />

            {/* 
              ELEGANT "MAGNETO" BRAND LOGO & DIGITAL TEMPERATURE DISPLAY
              Embossed directly onto the refrigerator door like a premium appliance badge
            */}
            <div className="absolute top-[8.2%] left-1/2 -translate-x-1/2 z-25 flex flex-col items-center justify-center px-4 py-1.5 rounded-lg bg-gradient-to-b from-slate-900/90 via-slate-800/95 to-slate-900/95 border border-slate-600/70 shadow-lg pointer-events-none select-none">
              <span className="font-heading font-black text-[11px] sm:text-xs tracking-[0.28em] text-white/95 uppercase drop-shadow-xs">
                MAGNETO
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-[8px] font-mono font-bold text-emerald-400">
                <span>3°C</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>-18°C</span>
              </div>
            </div>

            {/* 
              INTERACTIVE CHROME HANDLE OVERLAY
              Clicking the handle directly toggles the door open/closed with smooth animation!
            */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                handleToggle()
              }}
              style={{
                position: 'absolute',
                top: '28%',
                right: '0px',
                width: '46px',
                height: '38%',
              }}
              className="cursor-pointer group/handle flex items-center justify-end pr-1 z-35"
              title={isEffectiveOpen ? 'Click handle to close fridge' : 'Click handle to open fridge'}
            >
              {/* Subtle interactive hover highlight over the handle */}
              <div className="w-4 h-full rounded-full transition-all duration-200 group-hover/handle:ring-2 group-hover/handle:ring-blue-400/60 group-hover/handle:bg-blue-400/10 active:scale-95" />
            </div>

            {/* 
              UNIFIED USABLE MAGNETIC SURFACE
              Spans the full face of the door so magnets can be dragged from near the top edge
              all the way down to the bottom without clipping or artificial boundary restrictions!
            */}
            <div
              ref={surfaceRef}
              onClick={onSurfaceClick}
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
              } transition-all duration-200 z-20 ${
                isDragOver ? 'ring-4 ring-blue-500/50 bg-blue-500/10 rounded-2xl' : ''
              }`}
            >
              {children}
            </div>
          </div>

          {/* 3D Physical Door Right Edge (Thickness) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '24px',
              transformOrigin: 'right center',
              transform: 'rotateY(90deg)',
              backfaceVisibility: 'hidden',
            }}
            className="rounded-r-lg bg-gradient-to-l from-slate-700 via-slate-600 to-slate-800 border-l border-slate-500 shadow-md pointer-events-none flex flex-col justify-center items-center"
          >
            {/* Magnetic Rubber Gasket Edge */}
            <div className="w-1.5 h-[96%] rounded-full bg-slate-900 shadow-inner" />
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
              transform: 'rotateY(180deg) translateZ(10px)',
              backfaceVisibility: 'hidden',
            }}
            className="rounded-[2.2rem] shadow-2xl overflow-hidden bg-white border-2 border-slate-300 flex flex-col cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
            }}
            title="Click anywhere to close refrigerator door"
          >
            {/* Photorealistic Door-Side Storage Image */}
            <img
              src="/fridges/realistic-door-storage.png"
              alt="Refrigerator Door-Side Storage Bins"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-[2.2rem]"
            />

            {/* Acrylic Gloss Specular Reflection Overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-[2.2rem] bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

            {/* Door Storage Header Badge & Close Affordance */}
            <div className="relative z-10 m-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-xl text-white flex items-center justify-between border border-white/20 shadow-md">
              <div className="flex items-center gap-1.5 text-[9px] font-heading font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>DOOR-SIDE STORAGE</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] text-slate-300 font-medium">
                <DoorClosed className="w-2.5 h-2.5 text-slate-300" />
                <span>Click to Close</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Subtle Drag-to-Rotate Hint Pill at Bottom */}
      <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pointer-events-none">
        <MoveHorizontal className="w-3 h-3 text-slate-400" />
        <span>Drag to rotate 3D view • Click door to open/close</span>
      </div>
    </div>
  )
}
