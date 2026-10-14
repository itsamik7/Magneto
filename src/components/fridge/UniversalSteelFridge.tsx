import React, { useRef } from 'react'
import type { MagneticRegion } from '../../types/fridge'
import { Snowflake, Lightbulb, DoorClosed, Sparkles } from 'lucide-react'

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
}

export const UniversalSteelFridge: React.FC<UniversalSteelFridgeProps> = ({
  isDoorOpen,
  onToggleDoor,
  isMainDoorOpen,
  isFreezerDoorOpen,
  onToggleMainDoor,
  onToggleFreezerDoor,
  magneticRegion,
  surfaceRef,
  children,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onSurfaceClick,
  aspectRatio = 0.56,
  isEditable = true,
}) => {
  const isEffectiveOpen =
    isDoorOpen !== undefined
      ? isDoorOpen
      : Boolean(isMainDoorOpen || isFreezerDoorOpen)
  const isAnimatingRef = useRef(false)

  const handleToggle = () => {
    // Debounce rapid clicking during transition to prevent glitching
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

  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: '100%',
        maxWidth: '380px',
        aspectRatio: `${aspectRatio}`,
        maxHeight: '760px',
        perspective: '1400px',
      }}
    >
      {/* 
        ========================================================================
        1. APPLIANCE CHASSIS & ILLUMINATED INTERIOR CAVITY
        Fixed-dimension outer cabinet housing the photorealistic interior
        ========================================================================
      */}
      <div className="absolute inset-0 rounded-[2.2rem] border-[3px] border-slate-400/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_10px_20px_-8px_rgba(0,0,0,0.18)] overflow-hidden bg-slate-950 flex flex-col justify-between">
        
        {/* Top Hinge Assembly & Brand Accent */}
        <div className="relative h-6 w-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 flex items-center justify-between px-5 border-b border-slate-500/50 shadow-inner z-10 shrink-0">
          {/* Heavy Duty Left Pivot Hinge */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-2.5 rounded-xs bg-gradient-to-r from-slate-500 via-slate-300 to-slate-600 shadow-xs border border-slate-600/60" />
            <div className="w-2 h-2 rounded-full bg-slate-400 shadow-inner" />
          </div>

          {/* Digital Brand Emblem */}
          <div className="flex items-center gap-1">
            <span className="font-heading font-black text-[8px] tracking-widest text-slate-700 uppercase">
              MAGNETO STUDIO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>

          {/* Right Alignment Guide */}
          <div className="w-3 h-2 rounded-xs bg-slate-400/80 border border-slate-500/40" />
        </div>

        {/* 
          PHOTOREALISTIC ILLUMINATED INTERIOR
          Revealed smoothly as the door swings open around its hinge
        */}
        <div className="relative flex-1 w-full overflow-hidden bg-slate-100">
          {/* Photorealistic Interior Cavity Image */}
          <img
            src="/fridges/realistic-fridge-interior.png"
            alt="Illuminated Refrigerator Interior"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
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
            <div className="absolute top-0 inset-x-6 h-36 bg-gradient-to-b from-white/75 via-sky-100/25 to-transparent blur-sm pointer-events-none" />
            
            {/* Upper Glass Shelf Specular Highlight */}
            <div className="absolute top-[26%] inset-x-2 h-8 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
            
            {/* Middle Glass Shelf Specular Highlight */}
            <div className="absolute top-[46%] inset-x-2 h-8 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            
            {/* Crisper Drawer Bottom Ambient Glow */}
            <div className="absolute bottom-4 inset-x-4 h-24 bg-gradient-to-t from-amber-100/25 via-sky-50/15 to-transparent pointer-events-none" />

            {/* Live Status Pill Inside Cabinet */}
            <div className="absolute top-3 left-4 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white border border-white/20 text-[8px] font-heading font-bold flex items-center gap-1 shadow-md">
              <Lightbulb className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
              <span>5000K LED ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Bottom Ventilated Kickplate & Leveling Feet */}
        <div className="relative h-6 w-full bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 border-t border-slate-600/80 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="w-4 h-2.5 rounded-xs bg-slate-700 shadow-inner" />
          <div className="flex items-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-2.5 h-1 rounded-full bg-slate-700/60" />
            ))}
          </div>
          <div className="w-4 h-2.5 rounded-xs bg-slate-700 shadow-inner" />
        </div>

      </div>

      {/* 
        ========================================================================
        2. 3D SWINGING REFRIGERATOR DOOR
        Rotates on its left hinge in authentic CSS 3D perspective.
        Magnets live on the front face of this door and move WITH it in 3D!
        ========================================================================
      */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'left center',
          transform: isEffectiveOpen ? 'rotateY(-78deg)' : 'rotateY(0deg)',
          transition: 'transform 650ms cubic-bezier(0.25, 1, 0.4, 1)',
          transformStyle: 'preserve-3d',
          zIndex: 30,
        }}
        className="group"
      >
        {/* 
          FRONT FACE OF THE DOOR:
          High-resolution brushed platinum stainless steel with metallic sheen,
          chrome handle, and the unified magnetic surface holding all souvenir magnets.
        */}
        <div className="absolute inset-0 rounded-[2.2rem] shadow-2xl overflow-hidden bg-slate-800">
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

        {/* 
          BACK FACE OF THE DOOR:
          Revealed as the door swings open! Features food-grade door liner,
          perimeter sealing gasket, and inner door storage bins.
        */}
        <div
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 rounded-[2.2rem] border-4 border-slate-300 bg-slate-100 shadow-2xl p-4 flex flex-col justify-between cursor-pointer"
          onClick={handleToggle}
          title="Click to close refrigerator door"
        >
          {/* Inner Door Seal Gasket Texture */}
          <div className="text-center pt-2">
            <span className="text-[8px] font-heading font-black text-slate-500 uppercase tracking-wider">
              Inner Door Storage
            </span>
          </div>

          {/* Inner Door Storage Racks */}
          <div className="space-y-4 my-auto">
            {/* Rack 1: Eggs & Condiments */}
            <div className="w-full p-2.5 bg-white/95 rounded-xl border border-slate-200 shadow-xs flex items-center justify-around text-base">
              <span title="Fresh Eggs">🥚</span>
              <span title="Farmhouse Butter">🧈</span>
              <span title="Organic Honey">🍯</span>
            </div>

            {/* Rack 2: Chilled Beverages */}
            <div className="w-full p-2.5 bg-white/95 rounded-xl border border-slate-200 shadow-xs flex items-center justify-around text-base">
              <span title="Sparkling Soda">🥤</span>
              <span title="Fresh Fruit Juice">🧃</span>
              <span title="Brut Champagne">🍾</span>
            </div>

            {/* Rack 3: Dairy & Sauces */}
            <div className="w-full p-2.5 bg-white/95 rounded-xl border border-slate-200 shadow-xs flex items-center justify-around text-base">
              <span title="Organic Milk">🥛</span>
              <span title="Coconut Water">🥥</span>
              <span title="San Marzano Sauce">🥫</span>
            </div>
          </div>

          {/* Intuitive Click to Close Affordance */}
          <div className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-center text-[10px] font-heading font-bold flex items-center justify-center gap-1.5 transition-colors">
            <DoorClosed className="w-3.5 h-3.5" />
            <span>Click to Close Door</span>
          </div>
        </div>

      </div>

    </div>
  )
}
