import React, { useState } from 'react'
import type { MagnetUnlockState } from '../../types/trip'
import { Sparkles, CheckCircle2, Compass, Moon } from 'lucide-react'

interface MagnetGraphicProps {
  magnetKey?: string
  assetUrl?: string
  destinationName: string
  state?: MagnetUnlockState
  progressPercentage?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isInteractive?: boolean
  onClick?: () => void
  className?: string
  floatVariant?: 1 | 2 | 3
}

export const MagnetGraphic: React.FC<MagnetGraphicProps> = ({
  magnetKey = 'paris',
  assetUrl,
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
  const key = (magnetKey || 'paris').toLowerCase()

  // Proportions matching real souvenir badges from the screenshot
  const dimensions = {
    xs: 'w-20 h-auto',
    sm: 'w-24 sm:w-28 h-auto',
    md: 'w-28 sm:w-32 md:w-36 h-auto',
    lg: 'w-36 sm:w-44 md:w-48 h-auto',
    xl: 'w-48 sm:w-56 md:w-64 h-auto',
  }[size]

  const resolveImgSrc = (): string => {
    if (assetUrl) {
      if (assetUrl.endsWith('.svg')) {
        return assetUrl.replace(/\.svg$/, '.png')
      }
      return assetUrl
    }

    // Photorealistic Indian Assets
    if (key.includes('taj-mahal') || key === 'agra') return '/assets/magnets/india/taj-mahal.png'
    if (key.includes('india-gate') || key === 'delhi' || key === 'new-delhi') return '/assets/magnets/india/india-gate.png'
    if (key.includes('hawa-mahal') || key === 'jaipur') return '/assets/magnets/india/hawa-mahal.png'
    if (key.includes('gateway-of-india') || key === 'mumbai') return '/assets/magnets/india/gateway-of-india.png'
    if (key.includes('golden-temple') || key === 'amritsar') return '/assets/magnets/india/golden-temple.png'
    if (key.includes('kerala') || key.includes('houseboat')) return '/assets/magnets/india/kerala-backwaters.png'
    if (key.includes('goa')) return '/assets/magnets/india/goa-beach.png'
    if (key.includes('ladakh') || key.includes('leh')) return '/assets/magnets/india/ladakh.png'
    if (key.includes('elephant') || key.includes('royal')) return '/assets/magnets/india/royal-elephant.png'

    // Photorealistic International Assets
    if (key.includes('eiffel') || key === 'paris') return '/assets/magnets/international/eiffel-tower.png'
    if (key.includes('colosseum') || key.includes('roma') || key === 'rome') return '/assets/magnets/international/colosseum-rome.png'
    if (key.includes('london') || key.includes('bus')) return '/assets/magnets/international/london.png'
    if (key.includes('japan') || key.includes('fuji') || key === 'tokyo') return '/assets/magnets/international/fuji-japan.png'
    if (key.includes('bali') || key.includes('indonesia')) return '/assets/magnets/international/bali-temple.png'
    if (key.includes('switzerland') || key.includes('alps') || key === 'zermatt') return '/assets/magnets/international/swiss-alps.png'
    if (key.includes('singapore')) return '/assets/magnets/international/singapore.png'

    const benchmarkKeys = ['paris', 'japan', 'london', 'switzerland', 'bali', 'singapore']
    if (benchmarkKeys.includes(key)) {
      return `/magnets/${key}.png`
    }

    return `/magnets/destinations/${key}.png`
  }

  const [currentSrc, setCurrentSrc] = useState(resolveImgSrc)

  React.useEffect(() => {
    setCurrentSrc(resolveImgSrc())
    setImgError(false)
  }, [magnetKey, assetUrl])

  const floatClass =
    floatVariant === 1
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
        isInteractive
          ? 'cursor-pointer magnet-tactile-lift focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl'
          : ''
      } ${state === 'dreaming' ? 'opacity-95' : 'saturate-[1.12]'} ${className}`}
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
      <div className="w-full h-full filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.34)] drop-shadow-[0_3px_5px_rgba(0,0,0,0.22)]">
        {!imgError ? (
          <img
            src={currentSrc}
            alt={`${destinationName} Souvenir Magnet`}
            className="w-full h-auto object-contain pointer-events-none select-none transition-transform"
            onError={() => {
              if (currentSrc.endsWith('.png')) {
                // If png failed, fallback to svg
                const fallbackSvg = `/magnets/destinations/${key}.svg`
                if (currentSrc !== fallbackSvg) {
                  setCurrentSrc(fallbackSvg)
                  return
                }
              }
              setImgError(true)
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full min-h-[120px] bg-white border-4 border-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-heading font-black text-xs uppercase tracking-wider text-slate-800 line-clamp-1">
              {destinationName}
            </span>
          </div>
        )}
      </div>

      {/* Dynamic State Overlay */}
      {getStateBadge()}
    </div>
  )
}
