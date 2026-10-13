import React from 'react'
import type { MagnetKey, MagnetUnlockState } from '../../types/trip'
import { Sparkles, CheckCircle2, Moon, Compass } from 'lucide-react'

interface MagnetGraphicProps {
  magnetKey: MagnetKey | string
  destinationName: string
  state?: MagnetUnlockState
  progressPercentage?: number
  size?: 'sm' | 'md' | 'lg'
  isInteractive?: boolean
  onClick?: () => void
  className?: string
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
}) => {
  // Normalize magnetKey
  const key = (magnetKey.toLowerCase() as MagnetKey) || 'paris'

  // Size dimensions
  const dimensions = {
    sm: 'w-32 h-36',
    md: 'w-44 h-52 sm:w-48 sm:h-56',
    lg: 'w-56 h-64 sm:w-64 sm:h-72',
  }[size]

  // Render SVG Artwork based on destination
  const renderArtwork = () => {
    switch (key) {
      case 'paris':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="parisBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF1EB" />
                <stop offset="100%" stopColor="#ACE0F9" />
              </linearGradient>
              <linearGradient id="parisGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5D061" />
                <stop offset="100%" stopColor="#E6AF2E" />
              </linearGradient>
              <linearGradient id="parisTower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5D4037" />
                <stop offset="100%" stopColor="#3E2723" />
              </linearGradient>
              <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Vintage Souvenir Badge Shield */}
            <path
              d="M80 8 C120 8 148 20 148 55 C148 115 80 165 80 165 C80 165 12 115 12 55 C12 20 40 8 80 8 Z"
              fill="url(#parisBg)"
              stroke="#D4AF37"
              strokeWidth="4"
              filter="url(#badgeShadow)"
            />

            {/* French Tricolor Banner at top */}
            <g opacity="0.85">
              <rect x="62" y="14" width="12" height="6" rx="2" fill="#0055A5" />
              <rect x="74" y="14" width="12" height="6" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
              <rect x="86" y="14" width="12" height="6" rx="2" fill="#EF4135" />
            </g>

            {/* Detailed Eiffel Tower */}
            {/* Spire */}
            <line x1="80" y1="28" x2="80" y2="44" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="27" r="2.5" fill="#D4AF37" />
            
            {/* Top lantern & dome */}
            <path d="M76 44 L84 44 L83 54 L77 54 Z" fill="url(#parisTower)" />
            <rect x="73" y="54" width="14" height="3" rx="1.5" fill="#D4AF37" />

            {/* Middle tier */}
            <path d="M75 57 L85 57 L89 88 L71 88 Z" fill="url(#parisTower)" />
            {/* Middle lattice crosses */}
            <line x1="75" y1="60" x2="85" y2="85" stroke="#FFF1EB" strokeWidth="0.8" opacity="0.6" />
            <line x1="85" y1="60" x2="75" y2="85" stroke="#FFF1EB" strokeWidth="0.8" opacity="0.6" />
            <rect x="65" y="88" width="30" height="4" rx="2" fill="#D4AF37" />

            {/* Lower arches & legs */}
            <path d="M69 92 L61 135 L71 135 L76 106 Q80 102 84 106 L89 135 L99 135 L91 92 Z" fill="url(#parisTower)" />
            <path d="M72 135 Q80 110 88 135 Z" fill="none" stroke="#D4AF37" strokeWidth="2" />
            {/* Base leg lattice */}
            <line x1="63" y1="100" x2="75" y2="130" stroke="#FFF1EB" strokeWidth="0.8" opacity="0.5" />
            <line x1="97" y1="100" x2="85" y2="130" stroke="#FFF1EB" strokeWidth="0.8" opacity="0.5" />

            {/* Little clouds */}
            <ellipse cx="40" cy="48" rx="14" ry="7" fill="#FFFFFF" opacity="0.75" />
            <ellipse cx="120" cy="40" rx="16" ry="8" fill="#FFFFFF" opacity="0.75" />

            {/* Banner Ribbon */}
            <path d="M34 138 L126 138 L120 156 L40 156 Z" fill="#243447" />
            <path d="M26 142 L34 138 L34 156 L26 150 Z" fill="#1A2736" />
            <path d="M134 142 L126 138 L126 156 L134 150 Z" fill="#1A2736" />
            <text x="80" y="151" textAnchor="middle" fill="#F7F5F0" fontSize="11" fontWeight="700" letterSpacing="1.5" fontFamily="system-ui">
              PARIS
            </text>
          </svg>
        )

      case 'japan':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="japanBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF5EB" />
                <stop offset="60%" stopColor="#FEE2E2" />
                <stop offset="100%" stopColor="#FECDD3" />
              </linearGradient>
              <linearGradient id="fujiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
            </defs>

            {/* Oval Lacquer Plate */}
            <ellipse cx="80" cy="90" rx="70" ry="78" fill="url(#japanBg)" stroke="#DC2626" strokeWidth="5" />
            <ellipse cx="80" cy="90" rx="66" ry="74" fill="none" stroke="#F59E0B" strokeWidth="1.5" />

            {/* Rising Sun */}
            <circle cx="80" cy="62" r="34" fill="#EF4444" opacity="0.9" />

            {/* Mount Fuji */}
            <polygon points="80,48 40,118 120,118" fill="url(#fujiGrad)" />
            {/* Snowcap */}
            <path d="M80 48 L68 70 Q74 74 80 69 Q86 74 92 70 Z" fill="#FFFFFF" />

            {/* Cherry Blossom Petals */}
            <circle cx="38" cy="50" r="3.5" fill="#F472B6" />
            <circle cx="48" cy="40" r="2.5" fill="#F472B6" />
            <circle cx="122" cy="54" r="3" fill="#F472B6" />
            <circle cx="114" cy="42" r="2.5" fill="#F472B6" />

            {/* Traditional Red Torii Gate */}
            {/* Top Lintels */}
            <path d="M38 102 C60 97 100 97 122 102 L120 106 C100 102 60 102 40 106 Z" fill="#B91C1C" />
            <rect x="44" y="109" width="72" height="4" fill="#991B1B" rx="1" />
            {/* Vertical Pillars */}
            <polygon points="53,109 50,146 56,146 57,109" fill="#DC2626" />
            <polygon points="107,109 104,146 110,146 109,109" fill="#DC2626" />
            {/* Cross tie */}
            <rect x="49" y="117" width="62" height="3" fill="#B91C1C" />
            <rect x="76" y="109" width="8" height="9" fill="#18181B" />

            {/* Golden Kanji/Plate ribbon */}
            <rect x="44" y="148" width="72" height="20" rx="4" fill="#1F2937" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="80" y="162" textAnchor="middle" fill="#FEF08A" fontSize="11" fontWeight="800" letterSpacing="2" fontFamily="sans-serif">
              JAPAN
            </text>
          </svg>
        )

      case 'goa':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goaSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="50%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>

            {/* Surfboard / Coastal Badge Shape */}
            <rect x="18" y="12" width="124" height="154" rx="28" fill="url(#goaSky)" stroke="#EA580C" strokeWidth="4.5" />
            <rect x="22" y="16" width="116" height="146" rx="24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />

            {/* Glowing Golden Sun */}
            <circle cx="80" cy="58" r="22" fill="#FEF08A" />

            {/* Ocean Waves */}
            <path d="M18 108 Q45 98 80 108 T142 108 L142 166 L18 166 Z" fill="#0284C7" />
            <path d="M18 116 Q50 108 80 118 T142 116 L142 166 L18 166 Z" fill="#0369A1" />
            <path d="M18 126 Q40 120 80 128 T142 126 L142 166 L18 166 Z" fill="#075985" />

            {/* Palm Tree Left */}
            <path d="M46 130 Q42 85 58 68 Q54 85 52 130 Z" fill="#78350F" />
            {/* Fronds */}
            <path d="M58 68 Q40 55 26 66 Q42 68 58 68 Z" fill="#15803D" />
            <path d="M58 68 Q48 46 36 50 Q48 58 58 68 Z" fill="#16A34A" />
            <path d="M58 68 Q68 46 80 52 Q68 60 58 68 Z" fill="#15803D" />
            <path d="M58 68 Q78 60 86 74 Q70 72 58 68 Z" fill="#22C55E" />

            {/* Coastal Surfboard Graphic */}
            <g transform="rotate(18 112 105)">
              <ellipse cx="112" cy="105" rx="7" ry="24" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.5" />
              <line x1="112" y1="81" x2="112" y2="129" stroke="#FFE4E6" strokeWidth="1.5" />
            </g>

            {/* Goa Label */}
            <rect x="36" y="136" width="88" height="22" rx="6" fill="#FDE047" stroke="#D97706" strokeWidth="2" />
            <text x="80" y="152" textAnchor="middle" fill="#9A3412" fontSize="13" fontWeight="900" letterSpacing="3" fontFamily="sans-serif">
              GOA
            </text>
          </svg>
        )

      case 'switzerland':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="swissSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#DBEAFE" />
              </linearGradient>
            </defs>

            {/* Swiss Wooden Crest Shield */}
            <path
              d="M20 18 L140 18 Q140 100 80 166 Q20 100 20 18 Z"
              fill="url(#swissSky)"
              stroke="#B91C1C"
              strokeWidth="5"
            />
            <path
              d="M25 23 L135 23 Q135 98 80 159 Q25 98 25 23 Z"
              fill="none"
              stroke="#FEF2F2"
              strokeWidth="2"
            />

            {/* Snow Peak Alps */}
            <polygon points="80,38 32,118 128,118" fill="#475569" />
            <polygon points="80,38 52,82 72,78 80,85 88,78 108,82" fill="#FFFFFF" />
            {/* Shading */}
            <polygon points="80,38 80,85 88,78 108,82 128,118 80,118" fill="#334155" opacity="0.35" />

            {/* Swiss Red & White Cross Shield */}
            <rect x="62" y="106" width="36" height="36" rx="8" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="74" y="113" width="12" height="22" rx="2" fill="#FFFFFF" />
            <rect x="69" y="118" width="22" height="12" rx="2" fill="#FFFFFF" />

            {/* Mountain Label */}
            <rect x="30" y="146" width="100" height="18" rx="4" fill="#1E293B" />
            <text x="80" y="159" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" letterSpacing="1.5" fontFamily="sans-serif">
              SWITZERLAND
            </text>
          </svg>
        )

      case 'london':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="londonSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
            </defs>

            {/* Vintage Postal Stamp Shape */}
            <rect x="18" y="14" width="124" height="152" rx="10" fill="url(#londonSky)" stroke="#1E3A8A" strokeWidth="4.5" />
            <rect x="23" y="19" width="114" height="142" rx="8" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="5,3" />

            {/* Big Ben Clock Tower */}
            <rect x="64" y="55" width="32" height="85" fill="#78350F" />
            <polygon points="80,24 66,55 94,55" fill="#451A03" />
            <circle cx="80" cy="22" r="3" fill="#D97706" />

            {/* Clock Face */}
            <circle cx="80" cy="68" r="10" fill="#FEF3C7" stroke="#451A03" strokeWidth="1.5" />
            <line x1="80" y1="68" x2="80" y2="61" stroke="#1F2937" strokeWidth="1.5" />
            <line x1="80" y1="68" x2="85" y2="68" stroke="#1F2937" strokeWidth="1.5" />

            {/* Red Telephone Box & Bus Silhouette */}
            <rect x="42" y="105" width="14" height="32" rx="2" fill="#DC2626" />
            <rect x="44" y="108" width="10" height="12" fill="#FEF2F2" opacity="0.8" />
            
            <rect x="104" y="115" width="22" height="22" rx="3" fill="#DC2626" />
            <rect x="106" y="118" width="18" height="7" fill="#FEF2F2" opacity="0.8" />
            <circle cx="109" cy="138" r="3" fill="#1F2937" />
            <circle cx="121" cy="138" r="3" fill="#1F2937" />

            {/* London Wordmark */}
            <rect x="36" y="142" width="88" height="20" rx="4" fill="#B91C1C" />
            <text x="80" y="156" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" letterSpacing="2" fontFamily="sans-serif">
              LONDON
            </text>
          </svg>
        )

      case 'bali':
        return (
          <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="baliSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="60%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FED7AA" />
              </linearGradient>
            </defs>

            {/* Balinese Medallion */}
            <rect x="18" y="12" width="124" height="156" rx="22" fill="url(#baliSky)" stroke="#059669" strokeWidth="4.5" />
            <circle cx="80" cy="55" r="28" fill="#FDE047" opacity="0.75" />

            {/* Candi Bentar (Balinese Split Gate) */}
            {/* Left Gate Wing */}
            <path d="M46 130 L46 65 L60 52 L60 62 L66 62 L68 76 L74 76 L74 130 Z" fill="#44403C" />
            {/* Right Gate Wing */}
            <path d="M114 130 L114 65 L100 52 L100 62 L94 62 L92 76 L86 76 L86 130 Z" fill="#44403C" />

            {/* Central Stairs & Pathway */}
            <polygon points="74,130 86,130 83,115 77,115" fill="#78716C" />

            {/* Frangipani Tropical Flower */}
            <g transform="translate(80, 122) scale(0.65)">
              <ellipse cx="0" cy="-10" rx="5" ry="10" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="1" />
              <ellipse cx="10" cy="-3" rx="5" ry="10" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="1" />
              <ellipse cx="6" cy="9" rx="5" ry="10" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="1" />
              <ellipse cx="-6" cy="9" rx="5" ry="10" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="1" />
              <ellipse cx="-10" cy="-3" rx="5" ry="10" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="1" />
              <circle cx="0" cy="0" r="4.5" fill="#F59E0B" />
            </g>

            {/* Bali Banner */}
            <rect x="36" y="142" width="88" height="20" rx="5" fill="#065F46" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="80" y="156" textAnchor="middle" fill="#FDF6B2" fontSize="11" fontWeight="800" letterSpacing="3" fontFamily="sans-serif">
              BALI
            </text>
          </svg>
        )

      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-2xl border-4 border-slate-700 p-2 text-center">
            <Compass className="w-10 h-10 text-teal-600 mb-1" />
            <span className="font-heading font-bold text-sm tracking-wider uppercase">{destinationName}</span>
          </div>
        )
    }
  }

  // State styling modifications
  const getStateOverlay = () => {
    switch (state) {
      case 'ready_to_go':
        return (
          <div className="absolute inset-0 pointer-events-none rounded-2xl ring-4 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.55)]">
            <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-heading text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-white">
              <Sparkles className="w-3 h-3 text-slate-900 fill-slate-900" />
              READY TO GO!
            </div>
            <div className="absolute -bottom-2.5 inset-x-3 bg-emerald-600 text-white text-[10px] font-semibold py-0.5 rounded-full shadow-md text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% Funded
            </div>
          </div>
        )

      case 'saving':
        return (
          <div className="absolute inset-0 pointer-events-none rounded-2xl">
            <div className="absolute -top-2.5 -right-2 bg-teal-600 text-white font-heading text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
              <Compass className="w-3 h-3" />
              SAVING
            </div>
            <div className="absolute -bottom-2 inset-x-4 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-medium py-0.5 rounded-full shadow text-center">
              {Math.round(progressPercentage)}% Saved
            </div>
          </div>
        )

      case 'dreaming':
      default:
        return (
          <div className="absolute inset-0 pointer-events-none rounded-2xl">
            <div className="absolute -top-2.5 -right-2 bg-slate-600/90 text-white font-heading text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/60">
              <Moon className="w-3 h-3 text-amber-300" />
              DREAMING
            </div>
          </div>
        )
    }
  }

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`relative select-none ${dimensions} ${
        isInteractive ? 'cursor-pointer magnet-tactile focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-2xl' : ''
      } ${
        state === 'dreaming' ? 'opacity-90 saturate-[0.85]' : 'saturate-[1.1]'
      } ${className}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${destinationName} magnet - State: ${state}`}
      onKeyDown={(e) => {
        if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* 3D Realistic Drop Shadow Layer */}
      <div className="w-full h-full p-1 transition-transform">
        {renderArtwork()}
      </div>

      {/* State-specific badges and overlays */}
      {getStateOverlay()}
    </div>
  )
}
