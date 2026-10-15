import React, { useRef } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import { Lightbulb, DoorClosed } from 'lucide-react'

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
  aspectRatio = 0.47,
  yaw = 0,
  onYawChange,
}) => {
  const isEffectiveOpen =
    isDoorOpen !== undefined
      ? isDoorOpen
      : Boolean(isMainDoorOpen || isFreezerDoorOpen)

  const isAnimatingRef = useRef(false)

  const handleToggle = () => {
    // Debounce rapid clicking during transition to prevent animation glitching
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 600)

    const willBeOpen = !isEffectiveOpen
    if (onYawChange) {
      onYawChange(willBeOpen ? -45 : 0)
    }

    if (onToggleDoor) {
      onToggleDoor()
    } else if (onToggleMainDoor) {
      onToggleMainDoor()
    }
  }

  return (
    <div className="w-full flex flex-col items-center select-none overflow-visible">
      {/* 
        ========================================================================
        THE REFRIGERATOR 3D APPLIANCE STAGE
        Isolated appliance with overflow-visible to guarantee the swinging door is never clipped.
        ========================================================================
      */}
      <div
        style={{
          width: 'clamp(250px, 74vw, 310px)',
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
            background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.1) 45%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
            transform: `translateX(${isEffectiveOpen ? 15 : 0}px)`,
            transition: 'transform 600ms cubic-bezier(0.25, 1, 0.4, 1)',
          }}
        />

        {/* 
          3D Turntable Wrapper
          Orbits smoothly around the Y-axis as controlled by the slider below.
          Shifts slightly right when the door opens to ensure the swinging door remains centered and uncropped.
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
          }}
        >
          {/* 3D Left Cabinet Side Panel (folds into -Z depth behind the front face) */}
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
            {/* Subtle brushed metal grain & ambient depth shading receding away from front face */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] pointer-events-none" />
          </div>

          {/* Top Heavy-Duty Chrome/Steel Hinge Bracket */}
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

          {/* 3D Right Cabinet Side Panel (folds into -Z depth behind the front face) */}
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
            {/* Subtle brushed metal grain & ambient depth shading receding away from front face */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* 3D Top Cabinet Roof (folds into -Z depth behind the front top edge) */}
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
            1. REFRIGERATOR INTERIOR CAVITY
            Pure doorless symmetrical interior cavity photograph with tempered glass shelves,
            chilled beverages, bottom citrus crisper drawer, and 5000K daylight LED.
            ========================================================================
          */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'translateZ(-6px)',
            }}
            className={`rounded-lg shadow-2xl overflow-hidden bg-slate-900 border border-slate-500 ${
              isEffectiveOpen ? 'cursor-pointer' : ''
            }`}
            onClick={isEffectiveOpen ? handleToggle : undefined}
            title={isEffectiveOpen ? 'Click to close refrigerator door' : undefined}
          >
            {/* Photorealistic Pure Cavity Image (No secondary doors!) */}
            <img
              src="/fridges/realistic-fridge-interior.png"
              alt="Illuminated Refrigerator Interior Cavity"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
            />

            {/* 5000K Daylight LED Interior Lighting Engine */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${
                isEffectiveOpen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="absolute top-0 inset-x-4 h-28 bg-gradient-to-b from-white/80 via-sky-100/20 to-transparent blur-xs pointer-events-none" />
              <div className="absolute top-[28%] inset-x-2 h-6 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
              <div className="absolute top-[48%] inset-x-2 h-6 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white border border-white/20 text-[8px] font-heading font-bold flex items-center gap-1 shadow-md">
                <Lightbulb className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                <span>5000K LED ACTIVE</span>
              </div>
            </div>
          </div>

          {/* 
            ========================================================================
            2. 3D SWINGING REFRIGERATOR DOOR
            Rotates around its left hinge when clicked.
            Magnets live on the front face of this door and move WITH it in 3D!
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
              zIndex: 30,
            }}
          >
            {/* 
              FRONT FACE OF THE DOOR (EXTERIOR):
              Brushed platinum stainless steel with integrated "MAGNETO" OLED display,
              chrome handle, and the unified magnetic surface.
            */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'translateZ(8px)',
                backfaceVisibility: 'hidden',
              }}
              className="rounded-lg shadow-2xl overflow-hidden bg-slate-200 border border-slate-400"
            >
              {/* Clean Cropped Stainless Steel Door Image (Zero White Margins) */}
              <img
                src="/fridges/premium-steel-door-closed.png"
                alt="Stainless Steel Refrigerator Door"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Ambient Specular Highlight Sheen */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* 
                UNIFIED USABLE MAGNETIC SURFACE
                Spans the face of the door so magnets can be dragged from near the top edge
                all the way down without clipping or artificial boundary restrictions.
              */}
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

              {/* 
                INTERACTIVE REFRIGERATOR CHROME HANDLE
                Only clicking this dedicated handle opens the refrigerator door!
              */}
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
                {/* Visual hover affordance: subtle metallic shimmer highlight on the handle */}
                <div className="absolute inset-0 rounded-r-lg group-hover:bg-gradient-to-l group-hover:from-white/30 group-hover:via-white/10 group-hover:to-transparent transition-all duration-200 pointer-events-none" />

                {/* Subtle handle pull hint on hover */}
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
              {/* Magnetic Gasket Seam */}
              <div className="w-1 h-[98%] rounded-full bg-slate-400/60 shadow-inner" />
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
                transform: 'rotateY(180deg) translateZ(8px)',
                backfaceVisibility: 'hidden',
              }}
              className="rounded-lg shadow-2xl overflow-hidden bg-white border border-slate-300 flex flex-col cursor-pointer"
              onClick={handleToggle}
              title="Click anywhere to close refrigerator door"
            >
              {/* Photorealistic Door-Side Storage Image (Cropped strictly to door face!) */}
              <img
                src="/fridges/realistic-door-storage.png"
                alt="Refrigerator Door-Side Storage Bins"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-lg"
              />

              {/* Acrylic Gloss Reflection */}
              <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

              {/* Door Storage Header Badge & Close Affordance */}
              <div className="relative z-10 m-2.5 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-white flex items-center justify-between border border-white/20 shadow-md">
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
      </div>

    </div>
  )
}
