import React, { useState } from 'react'
import type { MagnetKey, MagnetUnlockState } from '../../types/trip'
import { Sparkles, CheckCircle2, Compass, Moon } from 'lucide-react'

interface MagnetGraphicProps {
  magnetKey: MagnetKey | string
  destinationName: string
  state?: MagnetUnlockState
  progressPercentage?: number
  size?: 'sm' | 'md' | 'lg'
  isInteractive?: boolean
  onClick?: () => void
  className?: string
  floatVariant?: 1 | 2 | 3
}

export const MagnetGraphic: React.FC<MagnetGraphicProps> = ({
  magnetKey,
  destinationName,
  state = 'dreaming',
  progressPercentage = 0,
  size = 'md',
  isInteractive = true,
  onClick,
  className = '',
  floatVariant = 1,
}) => {
  const [imgError, setImgError] = useState(false)
  const key = (magnetKey.toLowerCase() as MagnetKey) || 'paris'

  // Proportions matching real souvenir badges from the screenshot
  const dimensions = {
    sm: 'w-24 h-28',
    md: 'w-28 sm:w-32 md:w-36 h-auto',
    lg: 'w-36 sm:w-44 md:w-48 h-auto',
  }[size]

  // Image source path from extracted authentic high-definition assets
  const imgSrc = `/magnets/${key}.png`

  const floatClass = floatVariant === 1
    ? 'magnet-float-1'
    : floatVariant === 2
    ? 'magnet-float-2'
    : 'magnet-float-3'

  // State Badge Overlay
  const getStateBadge = () => {
    switch (state) {
      case 'ready_to_go':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 rounded-2xl ring-4 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse" />
            <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-heading text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-white">
              <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
              READY!
            </div>
            <div className="absolute -bottom-2 inset-x-2 bg-emerald-600 text-white text-[9px] font-bold py-0.5 rounded-full shadow text-center flex items-center justify-center gap-1 border border-white">
              <CheckCircle2 className="w-2.5 h-2.5" />
              100%
            </div>
          </div>
        )

      case 'saving':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-2.5 -right-2 bg-emerald-600 text-white font-heading text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border-2 border-white">
              <Compass className="w-2.5 h-2.5" />
              SAVING
            </div>
            <div className="absolute -bottom-2 inset-x-3 bg-slate-900/90 backdrop-blur-sm text-white text-[9px] font-bold py-0.5 rounded-full shadow text-center border border-white/60">
              {Math.round(progressPercentage)}%
            </div>
          </div>
        )

      case 'dreaming':
      default:
        return (
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute -top-2 -right-1 bg-slate-700 text-white font-heading text-[9px] font-medium px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-white/70">
              <Moon className="w-2.5 h-2.5 text-amber-300" />
              DREAMING
            </div>
          </div>
        )
    }
  }

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`relative select-none ${dimensions} ${floatClass} ${
        isInteractive ? 'cursor-pointer magnet-tactile-lift focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl' : ''
      } ${
        state === 'dreaming' ? 'opacity-95' : 'saturate-[1.12]'
      } ${className}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${destinationName} collectible souvenir magnet`}
      onKeyDown={(e) => {
        if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Real 3D Die-Cut Souvenir Magnet with Floating Drop Shadows */}
      <div className="w-full h-full filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.22)]">
        {!imgError ? (
          <img
            src={imgSrc}
            alt={`${destinationName} Souvenir Magnet`}
            className="w-full h-auto object-contain pointer-events-none select-none transition-transform"
            onError={() => setImgError(true)}
            loading="eager"
          />
        ) : (
          <div className="w-full h-28 bg-white border-4 border-white rounded-2xl shadow flex flex-col items-center justify-center p-2 text-center">
            <Compass className="w-8 h-8 text-emerald-600 mb-1" />
            <span className="font-heading font-black text-xs uppercase tracking-wider">{destinationName}</span>
          </div>
        )}
      </div>

      {/* Dynamic State Overlay */}
      {getStateBadge()}
    </div>
  )
}
