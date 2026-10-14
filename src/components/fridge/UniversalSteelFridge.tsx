import React, { useRef } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import { Lightbulb, DoorClosed, Rotate3d, Undo2 } from 'lucide-react'

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
          width: '100%',
          maxWidth: '360px',
          aspectRatio: `${aspectRatio}`,
          maxHeight: '780px',
          perspective: '1400px',
          transformStyle: 'preserve-3d',
          overflow: 'visible',
        }}
        className="relative mx-auto overflow-visible"
      >
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
            transition: 'transform 500ms cubic-bezier(0.2, 0.9, 0.3, 1)',
            overflow: 'visible',
          }}
        >
          {/* 3D Left Cabinet Side Panel (revealed when rotating to the right or opening door) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '65px',
              transformOrigin: 'left center',
              transform: 'rotateY(-90deg)',
              backfaceVisibility: 'hidden',
              zIndex: 5,
            }}
            className="rounded-l-sm border-l border-slate-600 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] pointer-events-none" />
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
            className="rounded-xs bg-gradient-to-r from-slate-700 via-slate-400 to-slate-700 border border-slate-400/80 shadow-md flex items-center justify-between px-1 pointer-events-none"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-inner" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          </div>

          {/* 3D Right Cabinet Side Panel (revealed when rotating to the left) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '65px',
              transformOrigin: 'right center',
              transform: 'rotateY(90deg)',
              backfaceVisibility: 'hidden',
              zIndex: 5,
            }}
            className="rounded-r-sm border-r border-slate-700 bg-gradient-to-l from-slate-900 via-slate-800 to-slate-700 shadow-2xl overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/45 pointer-events-none" />
          </div>

          {/* 3D Top Cabinet Roof */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '65px',
              transformOrigin: 'center top',
              transform: 'rotateX(90deg)',
              backfaceVisibility: 'hidden',
              zIndex: 5,
            }}
            className="rounded-t-sm border-t border-slate-600 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-inner overflow-hidden pointer-events-none"
          />

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
            className="rounded-lg shadow-2xl overflow-hidden bg-slate-900 border border-slate-500"
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
              className="rounded-lg shadow-2xl overflow-hidden bg-slate-200 border border-slate-400 cursor-pointer"
              onClick={handleToggle}
              title={isEffectiveOpen ? 'Click door to close' : 'Click door to open'}
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
                  e.stopPropagation()
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
            </div>

            {/* 3D Physical Door Right Edge (Thickness) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: '18px',
                transformOrigin: 'right center',
                transform: 'rotateY(90deg)',
                backfaceVisibility: 'hidden',
              }}
              className="rounded-r-xs bg-gradient-to-l from-slate-700 via-slate-600 to-slate-800 border-l border-slate-500 shadow-md pointer-events-none flex flex-col justify-center items-center"
            >
              {/* Magnetic Rubber Gasket Edge */}
              <div className="w-1.5 h-[98%] rounded-full bg-slate-900 shadow-inner" />
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

      {/* 
        ========================================================================
        3D ROTATION SLIDER & CONTROLS DIRECTLY BELOW THE FRIDGE
        Smooth horizontal slider to rotate and inspect the fridge from any angle
        ========================================================================
      */}
      <div className="w-full max-w-[360px] mt-4 px-4 py-3 bg-white/95 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-heading font-bold text-slate-800">
          <div className="flex items-center gap-1.5">
            <Rotate3d className="w-3.5 h-3.5 text-blue-600" />
            <span>3D Angle Rotation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {yaw === 0 ? 'Front (0°)' : `${yaw > 0 ? '+' : ''}${yaw}°`}
            </span>
            {yaw !== 0 && (
              <button
                onClick={() => onYawChange?.(0)}
                className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5 font-bold cursor-pointer transition-colors"
                title="Reset angle to 0° (Front)"
              >
                <Undo2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* The Range Slider */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-medium text-slate-400 shrink-0">-60°</span>
          <input
            type="range"
            min="-60"
            max="60"
            step="1"
            value={yaw}
            onChange={(e) => onYawChange?.(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
            title="Slide to rotate refrigerator in 3D"
          />
          <span className="text-[10px] font-medium text-slate-400 shrink-0">+60°</span>
        </div>

        {/* Quick Angle Presets */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
          <button
            onClick={() => onYawChange?.(-45)}
            className={`py-1 px-1.5 rounded-lg text-center font-heading font-bold transition-all cursor-pointer ${
              yaw === -45
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
            title="Rotate to view door-side storage and inside cabinet"
          >
            Door Storage (-45°)
          </button>
          <button
            onClick={() => onYawChange?.(0)}
            className={`py-1 px-1.5 rounded-lg text-center font-heading font-bold transition-all cursor-pointer ${
              yaw === 0
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
            title="Front straight-on view"
          >
            Front View (0°)
          </button>
          <button
            onClick={() => onYawChange?.(45)}
            className={`py-1 px-1.5 rounded-lg text-center font-heading font-bold transition-all cursor-pointer ${
              yaw === 45
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
            title="Rotate to view right interior depth"
          >
            Right Depth (+45°)
          </button>
        </div>
      </div>
    </div>
  )
}
