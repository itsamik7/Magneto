import React from 'react'
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
  const key = (magnetKey.toLowerCase() as MagnetKey) || 'paris'

  // Dimensions
  const dimensions = {
    sm: 'w-28 h-32',
    md: 'w-36 h-44 sm:w-40 sm:h-48 md:w-44 md:h-52',
    lg: 'w-48 h-56 sm:w-56 sm:h-64',
  }[size]

  // Render high-fidelity die-cut souvenir magnets
  const renderMagnetIllustration = () => {
    switch (key) {
      /* ======================================================================
         1. PARIS (Sunset Eiffel Tower, Cherry Blossoms & Vintage Banner)
         ====================================================================== */
      case 'paris':
        return (
          <svg viewBox="0 0 170 200" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="parisSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="35%" stopColor="#FDBA74" />
                <stop offset="70%" stopColor="#FED7AA" />
                <stop offset="100%" stopColor="#E0E7FF" />
              </linearGradient>
              <linearGradient id="parisTower" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A3428" />
                <stop offset="100%" stopColor="#2A1B12" />
              </linearGradient>
              <linearGradient id="parisBannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1EAD8" />
              </linearGradient>
              <clipPath id="parisClip">
                <path d="M22 65 C22 25 55 12 85 12 C115 12 148 25 148 65 L148 168 C148 174 142 178 136 178 L34 178 C28 178 22 174 22 168 Z" />
              </clipPath>
            </defs>

            {/* Thick Die-Cut White Vinyl Base Contour */}
            <path
              d="M17 65 C17 21 52 7 85 7 C118 7 153 21 153 65 L153 170 C153 180 144 186 136 186 L34 186 C26 186 17 180 17 170 Z"
              fill="#FFFFFF"
            />

            {/* Inner Magnet Artwork Clipped */}
            <g clipPath="url(#parisClip)">
              {/* Sunset Sky */}
              <rect x="20" y="10" width="130" height="170" fill="url(#parisSky)" />

              {/* Sun Glow */}
              <circle cx="85" cy="85" r="28" fill="#FFF7ED" opacity="0.85" />

              {/* Distant Haussmann Architecture Silhouettes */}
              <rect x="24" y="130" width="40" height="40" fill="#7C5D4F" opacity="0.45" />
              <rect x="106" y="132" width="40" height="38" fill="#7C5D4F" opacity="0.45" />
              <polygon points="34,130 40,118 46,130" fill="#6B4B3D" opacity="0.5" />
              <polygon points="120,132 126,120 132,132" fill="#6B4B3D" opacity="0.5" />

              {/* The Eiffel Tower */}
              {/* Spire */}
              <line x1="85" y1="30" x2="85" y2="52" stroke="#2A1B12" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="85" cy="28" r="2" fill="#F59E0B" />
              {/* Top dome */}
              <ellipse cx="85" cy="52" rx="4" ry="2" fill="url(#parisTower)" />
              {/* Platform 3 */}
              <rect x="81" y="54" width="8" height="12" fill="url(#parisTower)" />
              <rect x="78" y="66" width="14" height="3" rx="1.5" fill="#D97706" />
              {/* Mid-tower section */}
              <polygon points="80,69 90,69 95,110 75,110" fill="url(#parisTower)" />
              {/* Mid lattice lines */}
              <line x1="80" y1="72" x2="93" y2="108" stroke="#FED7AA" strokeWidth="0.8" opacity="0.7" />
              <line x1="90" y1="72" x2="77" y2="108" stroke="#FED7AA" strokeWidth="0.8" opacity="0.7" />
              {/* Platform 2 & Arch */}
              <rect x="71" y="110" width="28" height="5" rx="2" fill="#D97706" />
              <path d="M74 115 L64 165 L76 165 L81 135 Q85 130 89 135 L94 165 L106 165 L96 115 Z" fill="url(#parisTower)" />
              <path d="M78 165 Q85 136 92 165" fill="none" stroke="#F59E0B" strokeWidth="2.5" />

              {/* Cherry Blossom Foliage (Right Side) */}
              <g>
                <path d="M125 40 Q110 55 102 70" stroke="#5D4037" strokeWidth="2.5" fill="none" />
                <path d="M106 65 Q95 72 90 78" stroke="#5D4037" strokeWidth="1.8" fill="none" />
                {/* Blossom clusters */}
                <circle cx="120" cy="40" r="5" fill="#F472B6" />
                <circle cx="126" cy="44" r="4.5" fill="#FDA4AF" />
                <circle cx="112" cy="50" r="5" fill="#F472B6" />
                <circle cx="106" cy="58" r="4" fill="#FDA4AF" />
                <circle cx="116" cy="62" r="5.5" fill="#FB7185" />
                <circle cx="98" cy="68" r="4.5" fill="#F472B6" />
                <circle cx="92" cy="76" r="4" fill="#FDA4AF" />
                <circle cx="132" cy="55" r="4" fill="#FDA4AF" />
              </g>

              {/* Left Subtle Cherry Blossoms */}
              <circle cx="48" cy="65" r="4" fill="#FDA4AF" opacity="0.9" />
              <circle cx="42" cy="72" r="5" fill="#F472B6" opacity="0.9" />
              <circle cx="54" cy="76" r="3.5" fill="#FDA4AF" opacity="0.9" />
            </g>

            {/* Vintage Cream Souvenir Banner at Base */}
            <g transform="translate(0, 5)">
              <path
                d="M38 152 Q85 146 132 152 L132 174 Q85 180 38 174 Z"
                fill="url(#parisBannerGrad)"
                stroke="#854D0E"
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))"
              />
              <text
                x="85"
                y="167"
                textAnchor="middle"
                fill="#451A03"
                fontSize="12"
                fontWeight="900"
                letterSpacing="3"
                fontFamily="Georgia, serif"
              >
                PARIS
              </text>
            </g>
          </svg>
        )

      /* ======================================================================
         2. JAPAN (Mount Fuji, Chureito Red Pagoda & Cherry Blossoms)
         ====================================================================== */
      case 'japan':
        return (
          <svg viewBox="0 0 170 170" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="japanSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="60%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#FCE7F3" />
              </linearGradient>
              <linearGradient id="fujiMountain" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <clipPath id="japanCircleClip">
                <circle cx="85" cy="85" r="74" />
              </clipPath>
            </defs>

            {/* Die-Cut Thick White Vinyl Circular Border */}
            <circle cx="85" cy="85" r="80" fill="#FFFFFF" />

            <g clipPath="url(#japanCircleClip)">
              {/* Sky */}
              <circle cx="85" cy="85" r="74" fill="url(#japanSkyGrad)" />

              {/* Red Sun Circle */}
              <circle cx="95" cy="62" r="32" fill="#EF4444" opacity="0.9" />

              {/* Mount Fuji */}
              <polygon points="105,42 42,122 168,122" fill="url(#fujiMountain)" />
              {/* Snowcap with realistic scallops */}
              <path
                d="M105 42 L80 74 Q92 80 102 75 Q112 80 120 73 Q125 78 130 74 Z"
                fill="#FFFFFF"
              />

              {/* Red 5-Tier Pagoda on Left */}
              <g transform="translate(10, 20)">
                {/* Spire */}
                <line x1="42" y1="42" x2="42" y2="52" stroke="#B91C1C" strokeWidth="2" />
                <circle cx="42" cy="40" r="1.5" fill="#F59E0B" />
                {/* Roof 1 */}
                <path d="M30 56 Q42 52 54 56 L51 52 Q42 50 33 52 Z" fill="#991B1B" />
                {/* Roof 2 */}
                <path d="M28 66 Q42 61 56 66 L53 62 Q42 59 31 62 Z" fill="#991B1B" />
                {/* Roof 3 */}
                <path d="M26 77 Q42 71 58 77 L55 72 Q42 69 29 72 Z" fill="#991B1B" />
                {/* Roof 4 */}
                <path d="M24 89 Q42 82 60 89 L57 84 Q42 80 27 84 Z" fill="#991B1B" />
                {/* Pagoda Body */}
                <rect x="36" y="56" width="12" height="42" fill="#DC2626" />
                <rect x="39" y="67" width="6" height="5" fill="#18181B" />
                <rect x="39" y="78" width="6" height="6" fill="#18181B" />
              </g>

              {/* Japanese Lake / Water */}
              <rect x="10" y="118" width="150" height="45" fill="#0284C7" opacity="0.6" />

              {/* Blooming Cherry Blossom Branches all around bottom & right */}
              <g>
                <path d="M150 90 Q125 105 100 115" stroke="#451A03" strokeWidth="3" fill="none" />
                <path d="M130 102 Q115 118 80 125" stroke="#451A03" strokeWidth="2.5" fill="none" />
                {/* Sakura blossoms */}
                <circle cx="140" cy="85" r="5" fill="#F472B6" />
                <circle cx="148" cy="92" r="5.5" fill="#FDA4AF" />
                <circle cx="132" cy="95" r="6" fill="#F472B6" />
                <circle cx="120" cy="104" r="6.5" fill="#FDA4AF" />
                <circle cx="110" cy="112" r="6" fill="#FB7185" />
                <circle cx="95" cy="118" r="5.5" fill="#FDA4AF" />
                <circle cx="80" cy="122" r="5" fill="#F472B6" />
                <circle cx="65" cy="126" r="4.5" fill="#FDA4AF" />
                <circle cx="125" cy="115" r="5" fill="#F472B6" />
              </g>
            </g>

            {/* Traditional Souvenir Red Ribbon Banner at bottom */}
            <g transform="translate(0, 2)">
              <rect x="48" y="134" width="74" height="22" rx="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" filter="drop-shadow(0 3px 4px rgba(0,0,0,0.3))" />
              <text
                x="85"
                y="149"
                textAnchor="middle"
                fill="#FEF08A"
                fontSize="12"
                fontWeight="900"
                letterSpacing="3"
                fontFamily="system-ui, sans-serif"
              >
                JAPAN
              </text>
            </g>
          </svg>
        )

      /* ======================================================================
         3. LONDON (Contoured Big Ben, Red Bus & Red Telephone Booth)
         ====================================================================== */
      case 'london':
        return (
          <svg viewBox="0 0 170 200" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="londonSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="60%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#F8FAFC" />
              </linearGradient>
              <clipPath id="londonShapeClip">
                <path d="M22 60 L65 60 L68 18 L76 18 L78 60 L146 60 C150 60 152 64 152 68 L152 178 C152 184 146 188 140 188 L26 188 C20 188 16 184 16 178 L16 68 C16 64 18 60 22 60 Z" />
              </clipPath>
            </defs>

            {/* Thick White Vinyl Die-Cut Silhouette */}
            <path
              d="M18 56 L61 56 L64 12 L80 12 L82 56 L150 56 C155 56 158 60 158 65 L158 180 C158 188 152 194 142 194 L24 194 C14 194 10 188 10 180 L10 65 C10 60 14 56 18 56 Z"
              fill="#FFFFFF"
            />

            <g clipPath="url(#londonShapeClip)">
              {/* London Sky */}
              <rect x="10" y="10" width="150" height="180" fill="url(#londonSkyGrad)" />

              {/* Houses of Parliament facade behind */}
              <rect x="76" y="80" width="70" height="90" fill="#D4AF37" opacity="0.35" />
              <line x1="85" y1="80" x2="85" y2="170" stroke="#78350F" strokeWidth="1" opacity="0.4" />
              <line x1="105" y1="80" x2="105" y2="170" stroke="#78350F" strokeWidth="1" opacity="0.4" />
              <line x1="125" y1="80" x2="125" y2="170" stroke="#78350F" strokeWidth="1" opacity="0.4" />

              {/* Elizabeth Tower (Big Ben) */}
              {/* Spire */}
              <polygon points="72,16 68,48 76,48" fill="#451A03" />
              <circle cx="72" cy="16" r="1.5" fill="#F59E0B" />
              <rect x="66" y="48" width="12" height="10" fill="#78350F" />
              {/* Clock Face Room */}
              <rect x="64" y="58" width="16" height="24" fill="#B45309" />
              <circle cx="72" cy="70" r="6" fill="#FEF3C7" stroke="#451A03" strokeWidth="1.2" />
              <line x1="72" y1="70" x2="72" y2="66" stroke="#18181B" strokeWidth="1" />
              <line x1="72" y1="70" x2="75" y2="70" stroke="#18181B" strokeWidth="1" />
              {/* Tower Shaft */}
              <rect x="65" y="82" width="14" height="95" fill="#92400E" />

              {/* Pavement / Street Base */}
              <rect x="10" y="165" width="150" height="30" fill="#64748B" />

              {/* Iconic Red Double-Decker Routemaster Bus */}
              <g transform="translate(26, 126)">
                {/* Bus chassis */}
                <rect x="0" y="0" width="54" height="42" rx="5" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
                {/* Upper windows */}
                <rect x="4" y="4" width="12" height="10" rx="1" fill="#E0F2FE" />
                <rect x="19" y="4" width="14" height="10" rx="1" fill="#E0F2FE" />
                <rect x="36" y="4" width="14" height="10" rx="1" fill="#E0F2FE" />
                {/* Lower windows & windscreen */}
                <rect x="4" y="18" width="12" height="12" rx="1" fill="#E0F2FE" />
                <rect x="19" y="18" width="14" height="12" rx="1" fill="#E0F2FE" />
                <rect x="36" y="18" width="14" height="12" rx="1" fill="#E0F2FE" />
                {/* White route stripe */}
                <rect x="0" y="15" width="54" height="2" fill="#FFFFFF" />
                {/* Wheels */}
                <circle cx="12" cy="42" r="5" fill="#18181B" />
                <circle cx="12" cy="42" r="2" fill="#94A3B8" />
                <circle cx="42" cy="42" r="5" fill="#18181B" />
                <circle cx="42" cy="42" r="2" fill="#94A3B8" />
              </g>

              {/* Red London Telephone Box on Right */}
              <g transform="translate(118, 125)">
                <rect x="0" y="0" width="18" height="45" rx="3" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
                {/* Glass window grid */}
                <rect x="3" y="6" width="12" height="8" fill="#FFFFFF" opacity="0.8" />
                <rect x="3" y="17" width="12" height="8" fill="#FFFFFF" opacity="0.8" />
                <rect x="3" y="28" width="12" height="8" fill="#FFFFFF" opacity="0.8" />
                <rect x="4" y="2" width="10" height="2" fill="#FFFFFF" />
              </g>
            </g>

            {/* Red London Ribbon Banner on Top Left */}
            <g transform="translate(22, 46)">
              <rect x="0" y="0" width="62" height="18" rx="4" fill="#B91C1C" stroke="#FFFFFF" strokeWidth="1.5" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
              <text x="31" y="13" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" letterSpacing="1.5" fontFamily="sans-serif">
                LONDON
              </text>
            </g>
          </svg>
        )

      /* ======================================================================
         4. SWITZERLAND (Matterhorn Alps, Turquoise Lake & Swiss Chalet)
         ====================================================================== */
      case 'switzerland':
        return (
          <svg viewBox="0 0 170 170" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="swissSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="60%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#E0F2FE" />
              </linearGradient>
              <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0891B2" />
              </linearGradient>
              <clipPath id="swissClip">
                <path d="M22 60 C22 25 55 12 85 12 C115 12 148 25 148 60 L148 140 C148 152 138 160 126 160 L44 160 C32 160 22 152 22 140 Z" />
              </clipPath>
            </defs>

            {/* Thick White Vinyl Die-Cut Base */}
            <path
              d="M16 60 C16 20 52 6 85 6 C118 6 154 20 154 60 L154 140 C154 156 142 166 128 166 L42 166 C28 166 16 156 16 140 Z"
              fill="#FFFFFF"
            />

            <g clipPath="url(#swissClip)">
              {/* Sky */}
              <rect x="15" y="10" width="140" height="155" fill="url(#swissSkyGrad)" />

              {/* Snow Peak Mountains (Alps / Matterhorn) */}
              <polygon points="85,24 45,95 125,95" fill="#334155" />
              {/* Snow Caps */}
              <polygon points="85,24 65,58 75,54 85,62 95,54 105,58" fill="#FFFFFF" />

              {/* Secondary Peaks */}
              <polygon points="45,45 15,105 75,105" fill="#475569" />
              <polygon points="45,45 30,75 40,70 50,78 60,70" fill="#FFFFFF" />

              <polygon points="125,48 95,105 155,105" fill="#475569" />
              <polygon points="125,48 110,75 120,70 130,78 140,70" fill="#FFFFFF" />

              {/* Turquoise Alpine Lake */}
              <rect x="15" y="95" width="140" height="35" fill="url(#lakeGrad)" />

              {/* Pine Forest (Dark Emerald Trees) */}
              <g fill="#065F46">
                <polygon points="25,95 20,110 30,110" />
                <polygon points="32,92 27,112 37,112" />
                <polygon points="40,96 35,115 45,115" />
                <polygon points="125,95 120,115 130,115" />
                <polygon points="135,92 130,115 140,115" />
              </g>

              {/* Swiss Alpine Wooden Chalet Cabin */}
              <g transform="translate(64, 102)">
                {/* Chalet Wall */}
                <rect x="4" y="10" width="34" height="22" fill="#78350F" />
                {/* Steep Alpine Roof */}
                <polygon points="21,0 0,12 42,12" fill="#451A03" />
                {/* Chimney */}
                <rect x="28" y="2" width="4" height="8" fill="#991B1B" />
                {/* Cozy glowing windows */}
                <rect x="8" y="14" width="7" height="7" fill="#FEF08A" stroke="#451A03" strokeWidth="1" />
                <rect x="27" y="14" width="7" height="7" fill="#FEF08A" stroke="#451A03" strokeWidth="1" />
                {/* Door */}
                <rect x="17" y="20" width="8" height="12" fill="#451A03" />
              </g>

              {/* Green Meadow foreground */}
              <path d="M15 130 Q85 124 155 130 L155 160 L15 160 Z" fill="#15803D" />
            </g>

            {/* Wooden Engraved Switzerland Banner */}
            <g transform="translate(0, 5)">
              <rect
                x="32"
                y="136"
                width="106"
                height="22"
                rx="5"
                fill="#1E293B"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
              />
              <text
                x="85"
                y="151"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="900"
                letterSpacing="2.5"
                fontFamily="sans-serif"
              >
                SWITZERLAND
              </text>
            </g>
          </svg>
        )

      /* ======================================================================
         5. BALI (Candi Bentar Gate, Tropical Palms & Turquoise Sea)
         ====================================================================== */
      case 'bali':
        return (
          <svg viewBox="0 0 170 170" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="baliSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="65%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#FDBA74" />
              </linearGradient>
              <clipPath id="baliClip">
                <rect x="22" y="14" width="126" height="142" rx="20" />
              </clipPath>
            </defs>

            {/* Thick White Vinyl Die-Cut Base */}
            <rect x="16" y="8" width="138" height="154" rx="26" fill="#FFFFFF" />

            <g clipPath="url(#baliClip)">
              {/* Sky */}
              <rect x="15" y="10" width="140" height="150" fill="url(#baliSkyGrad)" />

              {/* Sun */}
              <circle cx="85" cy="55" r="24" fill="#FEF08A" opacity="0.85" />

              {/* Distant Volcano Silhouette (Mount Agung) */}
              <polygon points="85,55 35,115 135,115" fill="#3B82F6" opacity="0.3" />

              {/* Turquoise Tropical Ocean & White Sands */}
              <rect x="15" y="105" width="140" height="30" fill="#0D9488" />
              <rect x="15" y="125" width="140" height="35" fill="#FDE68A" />

              {/* Candi Bentar (Balinese Split Gate) */}
              {/* Left Gate Wing */}
              <path d="M52 135 L52 75 L66 60 L66 72 L72 72 L74 86 L80 86 L80 135 Z" fill="#44403C" stroke="#292524" strokeWidth="1" />
              {/* Right Gate Wing */}
              <path d="M118 135 L118 75 L104 60 L104 72 L98 72 L96 86 L90 86 L90 135 Z" fill="#44403C" stroke="#292524" strokeWidth="1" />

              {/* Palm Tree on Right */}
              <path d="M136 140 Q130 95 142 70" stroke="#78350F" strokeWidth="3" fill="none" />
              {/* Fronds */}
              <path d="M142 70 Q122 60 108 72" stroke="#15803D" strokeWidth="2.5" fill="none" />
              <path d="M142 70 Q130 50 118 55" stroke="#16A34A" strokeWidth="2.5" fill="none" />
              <path d="M142 70 Q150 50 160 58" stroke="#15803D" strokeWidth="2.5" fill="none" />
            </g>

            {/* Tropical Souvenir Ribbon Banner */}
            <g transform="translate(0, 3)">
              <rect
                x="44"
                y="132"
                width="82"
                height="22"
                rx="6"
                fill="#065F46"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
              />
              <text
                x="85"
                y="147"
                textAnchor="middle"
                fill="#FEF08A"
                fontSize="11"
                fontWeight="900"
                letterSpacing="3"
                fontFamily="sans-serif"
              >
                BALI
              </text>
            </g>
          </svg>
        )

      /* ======================================================================
         6. SINGAPORE (Marina Bay Sands, Merlion & Futuristic Bay)
         ====================================================================== */
      case 'singapore':
        return (
          <svg viewBox="0 0 170 170" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="singSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <clipPath id="singClip">
                <path d="M22 45 C35 15 135 15 148 45 L148 140 C148 152 138 160 126 160 L44 160 C32 160 22 152 22 140 Z" />
              </clipPath>
            </defs>

            {/* Thick White Vinyl Die-Cut Base */}
            <path
              d="M16 45 C30 10 140 10 154 45 L154 140 C154 156 142 166 128 166 L42 166 C28 166 16 156 16 140 Z"
              fill="#FFFFFF"
            />

            <g clipPath="url(#singClip)">
              {/* Sky */}
              <rect x="15" y="10" width="140" height="155" fill="url(#singSky)" />

              {/* Marina Bay Sands 3 Towers */}
              <g transform="translate(42, 45)">
                {/* Tower 1 */}
                <rect x="0" y="20" width="14" height="60" rx="3" fill="#E2E8F0" />
                {/* Tower 2 */}
                <rect x="22" y="16" width="14" height="64" rx="3" fill="#E2E8F0" />
                {/* Tower 3 */}
                <rect x="44" y="20" width="14" height="60" rx="3" fill="#E2E8F0" />
                {/* SkyPark curved ship atop */}
                <path d="M-6 16 Q30 8 72 16 L68 22 Q30 14 -2 22 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                {/* Infinity Pool & Trees on SkyPark */}
                <circle cx="55" cy="12" r="2" fill="#22C55E" />
                <circle cx="60" cy="12" r="2" fill="#22C55E" />
              </g>

              {/* Marina Bay Harbor Water */}
              <rect x="15" y="115" width="140" height="40" fill="#0369A1" />

              {/* Merlion Statue Spouting Water */}
              <g transform="translate(108, 92)">
                <ellipse cx="14" cy="22" rx="10" ry="16" fill="#F8FAFC" />
                <circle cx="14" cy="8" r="7" fill="#F8FAFC" />
                <polygon points="8,7 4,9 8,11" fill="#F8FAFC" />
                {/* Spouting Water stream */}
                <path d="M5 8 Q-12 10 -16 28" stroke="#38BDF8" strokeWidth="2.5" fill="none" opacity="0.9" />
              </g>
            </g>

            {/* Singapore Ribbon Banner */}
            <g transform="translate(0, 5)">
              <rect
                x="34"
                y="136"
                width="102"
                height="22"
                rx="5"
                fill="#1E1B4B"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
              />
              <text
                x="85"
                y="151"
                textAnchor="middle"
                fill="#38BDF8"
                fontSize="10"
                fontWeight="900"
                letterSpacing="2.5"
                fontFamily="sans-serif"
              >
                SINGAPORE
              </text>
            </g>
          </svg>
        )

      /* ======================================================================
         7. GOA (Coastal Sunset, Coconut Palms & Ocean Wave)
         ====================================================================== */
      case 'goa':
      default:
        return (
          <svg viewBox="0 0 170 170" className="w-full h-full filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.32)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
            <defs>
              <linearGradient id="goaSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <clipPath id="goaClip">
                <rect x="22" y="14" width="126" height="142" rx="22" />
              </clipPath>
            </defs>

            {/* Die-Cut White Vinyl Base */}
            <rect x="16" y="8" width="138" height="154" rx="28" fill="#FFFFFF" />

            <g clipPath="url(#goaClip)">
              {/* Sunset Sky */}
              <rect x="15" y="10" width="140" height="150" fill="url(#goaSkyGrad)" />

              {/* Glowing Sun */}
              <circle cx="85" cy="65" r="22" fill="#FEF08A" />

              {/* Waves */}
              <path d="M15 110 Q50 100 85 110 T155 110 L155 160 L15 160 Z" fill="#0284C7" />
              <path d="M15 120 Q50 112 85 120 T155 120 L155 160 L15 160 Z" fill="#0369A1" />

              {/* Palm Tree */}
              <path d="M48 135 Q44 95 62 72 Q56 95 54 135 Z" fill="#78350F" />
              <path d="M62 72 Q42 58 26 70" stroke="#15803D" strokeWidth="2.5" fill="none" />
              <path d="M62 72 Q50 48 36 54" stroke="#16A34A" strokeWidth="2.5" fill="none" />
              <path d="M62 72 Q75 48 88 56" stroke="#15803D" strokeWidth="2.5" fill="none" />
            </g>

            {/* Goa Banner */}
            <g transform="translate(0, 3)">
              <rect
                x="46"
                y="132"
                width="78"
                height="22"
                rx="6"
                fill="#EA580C"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
              />
              <text
                x="85"
                y="147"
                textAnchor="middle"
                fill="#FEF08A"
                fontSize="11"
                fontWeight="900"
                letterSpacing="3"
                fontFamily="sans-serif"
              >
                GOA
              </text>
            </g>
          </svg>
        )
    }
  }

  // State Overlays for physical souvenir states
  const getStateBadge = () => {
    switch (state) {
      case 'ready_to_go':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Golden Halo Shimmer */}
            <div className="absolute inset-1 rounded-2xl ring-4 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.65)] animate-pulse" />
            {/* Top Celebration Badge */}
            <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-heading text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 border-2 border-white">
              <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
              READY TO GO!
            </div>
            {/* Bottom 100% funded pill */}
            <div className="absolute -bottom-2.5 inset-x-4 bg-emerald-600 text-white text-[10px] font-bold py-0.5 rounded-full shadow-md text-center flex items-center justify-center gap-1 border border-white">
              <CheckCircle2 className="w-3 h-3" />
              100% Funded
            </div>
          </div>
        )

      case 'saving':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {/* Saving State Pill */}
            <div className="absolute -top-2.5 -right-2 bg-emerald-600 text-white font-heading text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border-2 border-white">
              <Compass className="w-3 h-3" />
              SAVING
            </div>
            {/* Progress percentage pill */}
            <div className="absolute -bottom-2 inset-x-5 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold py-0.5 rounded-full shadow text-center border border-white/50">
              {Math.round(progressPercentage)}% Saved
            </div>
          </div>
        )

      case 'dreaming':
      default:
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-2.5 -right-2 bg-slate-700 text-white font-heading text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border-2 border-white/80">
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
      className={`relative select-none ${dimensions} transition-all duration-200 ${
        isInteractive
          ? 'cursor-pointer hover:-translate-y-1.5 hover:scale-105 active:translate-y-0 active:scale-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl'
          : ''
      } ${
        state === 'dreaming' ? 'opacity-95' : 'saturate-[1.15]'
      } ${className}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${destinationName} collectible magnet - State: ${state}`}
      onKeyDown={(e) => {
        if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* 3D Magnet Illustration */}
      <div className="w-full h-full p-1">
        {renderMagnetIllustration()}
      </div>

      {/* State Badge */}
      {getStateBadge()}
    </div>
  )
}
