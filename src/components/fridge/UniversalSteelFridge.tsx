import React from 'react'
import type { MagneticRegion } from '../../types/fridge'
import { Lock, Sparkles, Snowflake, Lightbulb, Compass } from 'lucide-react'

export interface UniversalSteelFridgeProps {
  isMainDoorOpen: boolean
  isFreezerDoorOpen: boolean
  onToggleMainDoor: () => void
  onToggleFreezerDoor: () => void
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
  aspectRatio = 0.58,
  isEditable = true,
}) => {
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
        CHASSIS / CABINET FRAME
        Outer heavy-gauge brushed stainless steel housing with metallic bevels
      */}
      <div className="absolute inset-0 rounded-[2.2rem] sm:rounded-[2.6rem] border-[3px] border-slate-400/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_10px_20px_-8px_rgba(0,0,0,0.18)] overflow-hidden bg-slate-900 flex flex-col justify-between">
        
        {/* Top Hinge Assembly & Header Bar */}
        <div className="relative h-6 w-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 flex items-center justify-between px-5 border-b border-slate-500/50 shadow-inner z-10">
          {/* Top Left Heavy Duty Door Hinge */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-2.5 rounded-sm bg-gradient-to-r from-slate-500 via-slate-300 to-slate-600 shadow-xs border border-slate-600/60" />
            <div className="w-2 h-2 rounded-full bg-slate-400 shadow-inner" />
          </div>

          {/* Digital Brand Emblem */}
          <div className="flex items-center gap-1">
            <span className="font-heading font-black text-[8px] tracking-widest text-slate-700 uppercase">
              MAGNETO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>

          {/* Top Right Alignment Pivot */}
          <div className="w-3 h-2 rounded-sm bg-slate-400/80 border border-slate-500/40" />
        </div>

        {/* 
          CABINET INTERIOR CAVITY (Revealed when doors swing open)
        */}
        <div className="relative flex-1 w-full bg-gradient-to-b from-slate-100 via-white to-slate-200 flex flex-col justify-between overflow-hidden">
          
          {/* TOP FREEZER INTERIOR (Top ~32% Height) */}
          <div className="relative h-[32%] w-full bg-gradient-to-b from-sky-100/90 via-sky-50 to-slate-100 border-b-4 border-slate-800 p-3 flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Frost & LED Backlight */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-sky-300/40 to-transparent pointer-events-none" />
            <div className="absolute top-1.5 left-3 flex items-center gap-1 text-[8px] font-heading font-black text-sky-800 tracking-wider">
              <Snowflake className="w-3 h-3 text-sky-600 animate-spin-slow" />
              <span>SUPER FROST -18°C</span>
            </div>

            {/* Freezer Wire Shelf */}
            <div className="mt-5 w-full h-1 bg-slate-300 shadow-sm border-t border-white" />

            {/* Chilled Freezer Souvenirs & Treats */}
            <div className="flex items-center justify-around px-2 z-10">
              {/* Gelato Tub 1 (Rome) */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-8 rounded-lg bg-emerald-600 border border-emerald-400 shadow-md flex items-center justify-center text-white text-[8px] font-black">
                  GELATO
                </div>
                <span className="text-[7px] font-bold text-slate-600 mt-0.5">Pistachio</span>
              </div>

              {/* Ice Cube Tray */}
              <div className="w-16 h-7 rounded-md bg-sky-200/90 border border-sky-400/60 shadow-inner grid grid-cols-4 gap-1 p-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-2.5 h-2 rounded-xs bg-white/80 shadow-xs" />
                ))}
              </div>

              {/* Swiss Alpine Chocolate */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-md bg-amber-900 border border-amber-700 shadow-md flex items-center justify-center text-amber-200 text-[7px] font-black tracking-tight text-center px-1">
                  SWISS CHOCO
                </div>
                <span className="text-[7px] font-bold text-slate-600 mt-0.5">Alps 85%</span>
              </div>
            </div>

            <div className="text-[8px] font-medium text-slate-400 text-center">
              Freezer Zone • Clean Air Frost-Free
            </div>
          </div>

          {/* MIDDLE GASKET & COMPRESSOR SEAM BAR */}
          <div className="relative h-2 w-full bg-slate-800 border-y border-slate-700 flex items-center justify-center">
            <div className="w-20 h-0.5 bg-slate-600 rounded-full" />
          </div>

          {/* BOTTOM MAIN REFRIGERATOR INTERIOR (Bottom ~65% Height) */}
          <div className="relative flex-1 w-full bg-gradient-to-b from-white via-slate-50 to-slate-100 p-3 flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Top Daylight 5000K LED Interior Light Strip */}
            <div className="w-full flex items-center justify-between pb-1.5 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-[9px] font-heading font-black text-blue-700">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>FRESH MULTI-AIRFLOW 3°C</span>
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                Travel Pantry
              </span>
            </div>

            {/* Shelf 1 (Top Glass Shelf) */}
            <div className="space-y-1">
              <div className="flex items-center justify-around px-2">
                {/* Paris Champagne Bottle */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-12 rounded-t-full bg-emerald-900 border border-emerald-700 shadow-md flex items-center justify-center text-[7px] text-amber-300 font-serif font-bold">
                    🍾
                  </div>
                  <span className="text-[7px] font-bold text-slate-600">Paris Brut</span>
                </div>

                {/* Goa Coconut Water */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-11 rounded-xl bg-teal-500 border border-teal-300 shadow-md flex flex-col items-center justify-center text-white text-[7px] font-black">
                    <span>GOA</span>
                    <span className="text-[6px]">COCONUT</span>
                  </div>
                  <span className="text-[7px] font-bold text-slate-600">Chilled</span>
                </div>

                {/* Rome Espresso Cold Brew */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-10 rounded-lg bg-stone-900 border border-amber-600 shadow-md flex items-center justify-center text-amber-400 text-[6px] font-black">
                    ROMA
                  </div>
                  <span className="text-[7px] font-bold text-slate-600">Espresso</span>
                </div>
              </div>
              {/* Tempered Glass Shelf 1 with Brushed Chrome Lip */}
              <div className="w-full h-1.5 bg-sky-100/90 rounded-sm border-t border-white border-b border-slate-300 shadow-xs flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300" />
              </div>
            </div>

            {/* Shelf 2 (Middle Glass Shelf) */}
            <div className="space-y-1">
              <div className="flex items-center justify-around px-2">
                {/* Tokyo Matcha Can */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-9 rounded-lg bg-lime-700 border border-lime-500 shadow-md flex items-center justify-center text-white text-[6px] font-black">
                    MATCHA
                  </div>
                  <span className="text-[7px] font-bold text-slate-600">Tokyo</span>
                </div>

                {/* Chilled Pure Milk Carton */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-10 rounded-sm bg-blue-600 border border-blue-400 shadow-md flex items-center justify-center text-white text-[7px] font-bold">
                    MILK
                  </div>
                  <span className="text-[7px] font-bold text-slate-600">Pure Organic</span>
                </div>

                {/* Sparkling Water */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-9 rounded-lg bg-cyan-600 border border-cyan-400 shadow-md flex items-center justify-center text-white text-[7px] font-bold">
                    SPARK
                  </div>
                  <span className="text-[7px] font-bold text-slate-600">Mineral</span>
                </div>
              </div>
              {/* Tempered Glass Shelf 2 */}
              <div className="w-full h-1.5 bg-sky-100/90 rounded-sm border-t border-white border-b border-slate-300 shadow-xs" />
            </div>

            {/* Bottom Fresh Crisper Drawer (Fruit & Veg) */}
            <div className="w-full h-14 rounded-2xl bg-white/70 border border-slate-300/80 shadow-md p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🍋</span>
                <span className="text-base">🍊</span>
                <span className="text-base">🍇</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-heading font-black text-slate-700 uppercase tracking-wider">
                  Moist Balance Crisper
                </span>
                <span className="text-[7px] font-semibold text-emerald-600">
                  Humidity 85% Optimal
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Kickplate & Leveling Feet */}
        <div className="relative h-6 w-full bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 border-t border-slate-600/80 flex items-center justify-between px-6 z-10">
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
        ====================================================================
        LAYER: 3D OPENABLE DOORS
        Engineered with true CSS 3D perspective and brushed stainless steel
        ====================================================================
      */}

      {/* 
        DOOR 1: TOP FREEZER DOOR (0% to 32% Height)
      */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '0px',
          right: '0px',
          height: '31%',
          transformOrigin: 'left center',
          transform: isFreezerDoorOpen ? 'rotateY(-84deg)' : 'rotateY(0deg)',
          transition: 'transform 650ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          transformStyle: 'preserve-3d',
          zIndex: 30,
        }}
        className="cursor-pointer group"
      >
        {/* Front Face of Freezer Door */}
        <div className="absolute inset-0 rounded-t-[1.8rem] rounded-b-lg border-2 border-slate-300 shadow-lg overflow-hidden fridge-steel-finish flex flex-col justify-between p-3">
          {/* Subtle Specular Metallic Highlight */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-1/4 transform -skew-x-12" />

          {/* Top Freezer Display Badge */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white border border-white/20 shadow-xs">
              <Snowflake className="w-2.5 h-2.5 text-sky-400" />
              <span className="text-[8px] font-heading font-black tracking-wider text-sky-300">
                -18°C
              </span>
            </div>

            <span className="text-[7px] font-heading font-extrabold tracking-widest text-slate-500 uppercase">
              LINEAR INVERTER
            </span>
          </div>

          {/* Freezer Door Handle on Right Side */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              onToggleFreezerDoor()
            }}
            className="absolute right-3 bottom-3 w-5 h-12 rounded-full fridge-handle flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group-hover:ring-2 group-hover:ring-blue-400/50 shadow-md"
            title={isFreezerDoorOpen ? 'Click to close freezer' : 'Click to open freezer door'}
          >
            <div className="w-1 h-8 rounded-full bg-slate-400/50" />
          </div>

          {/* Subtle Bottom Door Seam Shadow */}
          <div className="w-full h-1 bg-gradient-to-b from-transparent to-slate-400/40 pointer-events-none" />
        </div>

        {/* Back Face of Freezer Door (Visible when open) */}
        <div
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 rounded-t-[1.8rem] rounded-b-lg border-2 border-slate-300 bg-slate-100 shadow-2xl p-2.5 flex flex-col justify-around"
        >
          <div className="w-full p-2 bg-white rounded-lg border border-slate-200 shadow-xs text-center">
            <span className="text-[8px] font-heading font-bold text-slate-700">
              Freezer Door Bin
            </span>
          </div>
          <div className="w-full p-1 text-center text-[7px] text-slate-500 font-semibold">
            Click to close
          </div>
        </div>
      </div>

      {/* 
        DOOR 2: BOTTOM MAIN REFRIGERATOR DOOR (35% to 96% Height)
        Houses the User's Travel Souvenir Magnets on its Magnetic Face!
      */}
      <div
        style={{
          position: 'absolute',
          top: '34%',
          left: '0px',
          right: '0px',
          height: '62%',
          transformOrigin: 'left center',
          transform: isMainDoorOpen ? 'rotateY(-80deg)' : 'rotateY(0deg)',
          transition: 'transform 700ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          transformStyle: 'preserve-3d',
          zIndex: 25,
        }}
        className="group"
      >
        {/* Front Face of Main Refrigerator Door */}
        <div className="absolute inset-0 rounded-t-lg rounded-b-[1.8rem] border-2 border-slate-300 shadow-xl overflow-hidden fridge-steel-finish flex flex-col justify-between">
          {/* Layer 1: Specular Glare Line */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-1/4 transform -skew-x-12" />

          {/* Layer 2: Main Door Chrome Handle on Right Edge */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              onToggleMainDoor()
            }}
            className="absolute right-3.5 top-8 w-4 h-48 rounded-full fridge-handle flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group-hover:ring-2 group-hover:ring-blue-400/50 shadow-md z-30"
            title={isMainDoorOpen ? 'Click handle to close fridge' : 'Click handle to open fridge'}
          >
            <div className="w-0.5 h-40 rounded-full bg-slate-400/50" />
          </div>

          {/* 
            Layer 3: USABLE FRONT MAGNETIC SURFACE
            Where DraggableMagnets are rendered and interacted with!
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
            className={`relative select-none cursor-default transition-all duration-200 z-20 ${
              isDragOver ? 'ring-4 ring-blue-500/50 bg-blue-500/10 rounded-2xl' : ''
            }`}
          >
            {children}
          </div>

          {/* Bottom Brushed Lip */}
          <div className="h-3 w-full bg-gradient-to-b from-transparent to-slate-400/30 pointer-events-none" />
        </div>

        {/* Back Face of Main Door (Inner Door Racks with Chilled Cans when Open) */}
        <div
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 rounded-t-lg rounded-b-[1.8rem] border-2 border-slate-300 bg-slate-100 shadow-2xl p-3 flex flex-col justify-between"
          onClick={onToggleMainDoor}
        >
          {/* Inner Door Rack 1 */}
          <div className="w-full p-2 bg-white/90 rounded-xl border border-slate-200 shadow-xs flex items-center justify-around">
            <span className="text-base">🥤</span>
            <span className="text-base">🧃</span>
            <span className="text-base">🍾</span>
          </div>

          {/* Inner Door Rack 2 */}
          <div className="w-full p-2 bg-white/90 rounded-xl border border-slate-200 shadow-xs flex items-center justify-around">
            <span className="text-base">🥛</span>
            <span className="text-base">🥥</span>
            <span className="text-base">🥫</span>
          </div>

          {/* Click to Close Hint */}
          <div className="w-full py-1.5 bg-blue-50 rounded-lg border border-blue-200 text-center text-[9px] font-bold text-blue-700">
            Click door to close
          </div>
        </div>
      </div>

    </div>
  )
}
