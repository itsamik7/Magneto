import React, { useState } from 'react'
import type { AdvertisingCampaign } from '../../types/advertising'
import {
  Smartphone,
  Monitor,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass,
} from 'lucide-react'

interface MerchantLivePreviewProps {
  draftCampaign?: {
    name?: string
    brandName?: string
    productName?: string
    description?: string | null
    destinationUrl?: string
    ctaText?: string
    creativeUrl?: string
    slotId?: string | null
    positionX?: number
    positionY?: number
    displayScale?: number
  } | null
  activeCampaigns?: AdvertisingCampaign[]
  className?: string
}

export const MerchantLivePreview: React.FC<MerchantLivePreviewProps> = ({
  draftCampaign,
  className = '',
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isHovered, setIsHovered] = useState(false)

  // Default coordinates if not set: Door Top Right (72%, 22%)
  const posX = draftCampaign?.positionX ?? 72
  const posY = draftCampaign?.positionY ?? 22
  const scale = draftCampaign?.displayScale ?? 1.05

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Preview Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-heading font-black text-slate-900 leading-tight">
              Virtual Fridge Magnet Preview
            </h4>
            <p className="text-[11px] text-slate-500">
              Live consumer rendering on the refrigerator door surface
            </p>
          </div>
        </div>

        {/* Viewport Frame Mode (Desktop vs Mobile) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewportMode === 'desktop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Desktop Resolution Preview"
          >
            <Monitor className="w-4 h-4" />
            <span className="text-[11px] font-heading font-semibold hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewportMode === 'mobile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Mobile Smartphone Resolution Preview"
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[11px] font-heading font-semibold hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="w-full flex justify-center items-center py-6 bg-slate-950/5 rounded-3xl border border-slate-200/90 overflow-hidden min-h-[560px]">
        <div
          className={`transition-all duration-300 relative bg-white rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden flex flex-col ${
            viewportMode === 'mobile'
              ? 'w-[375px] h-[680px] max-w-full'
              : 'w-full max-w-[960px] h-[580px]'
          }`}
        >
          {/* Mock Browser/App Header */}
          <div className="bg-slate-900 text-slate-400 px-4 py-2 flex items-center justify-between text-[11px] font-mono border-b border-slate-800 flex-shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="bg-slate-800/80 px-4 py-0.5 rounded-md text-[10px] text-slate-300 border border-slate-700/60 truncate max-w-[280px]">
              https://magnetos.in/my-fridge • User View
            </div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>LIVE SIMULATOR</span>
            </div>
          </div>

          {/* App Body Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex flex-col items-center justify-center relative select-none">
            
            {/* The Static Virtual Refrigerator Door Appliance */}
            <div
              className="relative w-full max-w-[340px] rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_10px_20px_-8px_rgba(0,0,0,0.18)] border-4 border-slate-300 overflow-hidden bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300"
              style={{
                aspectRatio: '0.62',
                maxHeight: '480px',
              }}
            >
              {/* Metallic Brushed Texture & Specular Highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none transform -skew-x-12" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 pointer-events-none" />

              {/* Top Freezer Divider Line */}
              <div className="absolute top-[28%] inset-x-0 h-[3px] bg-slate-400/80 border-b border-white/60 shadow-xs pointer-events-none" />

              {/* Refrigerator Door Handle */}
              <div className="absolute top-[34%] right-3 w-2.5 h-28 rounded-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-md border border-slate-400/60 pointer-events-none" />

              {/* Sample User Travel Magnets on Door */}
              {/* Magnet 1: Santorini */}
              <div
                className="absolute flex flex-col items-center pointer-events-none opacity-90"
                style={{ left: '26%', top: '14%', transform: 'translate(-50%, -50%) rotate(-4deg)' }}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-blue-50 flex items-center justify-center">
                  <img src="/assets/magnets/santorini.png" alt="Santorini" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none'
                  }} />
                  <span className="text-[8px] font-bold text-blue-700">Santorini</span>
                </div>
                <span className="mt-0.5 px-1.5 py-0.2 bg-white/90 text-[7px] font-bold text-slate-700 rounded-md shadow-xs">
                  Saved ₹80k
                </span>
              </div>

              {/* Magnet 2: Rome */}
              <div
                className="absolute flex flex-col items-center pointer-events-none opacity-90"
                style={{ left: '28%', top: '48%', transform: 'translate(-50%, -50%) rotate(3deg)' }}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-amber-50 flex items-center justify-center">
                  <img src="/assets/magnets/rome.png" alt="Rome" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none'
                  }} />
                  <span className="text-[8px] font-bold text-amber-700">Rome</span>
                </div>
                <span className="mt-0.5 px-1.5 py-0.2 bg-white/90 text-[7px] font-bold text-slate-700 rounded-md shadow-xs">
                  Saved ₹45k
                </span>
              </div>

              {/* Magnet 3: Goa Beach */}
              <div
                className="absolute flex flex-col items-center pointer-events-none opacity-90"
                style={{ left: '46%', top: '75%', transform: 'translate(-50%, -50%) rotate(-2deg)' }}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-emerald-50 flex items-center justify-center">
                  <img src="/assets/magnets/india/goa-beach.png" alt="Goa" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none'
                  }} />
                  <span className="text-[8px] font-bold text-emerald-700">Goa</span>
                </div>
                <span className="mt-0.5 px-1.5 py-0.2 bg-white/90 text-[7px] font-bold text-slate-700 rounded-md shadow-xs">
                  Saved ₹40k
                </span>
              </div>

              {/* ============================================================== */}
              {/* THE MERCHANT'S SPONSORED MAGNET ADVERTISEMENT                   */}
              {/* Positioned dynamically by slot coordinates                     */}
              {/* ============================================================== */}
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="absolute flex flex-col items-center cursor-pointer transition-transform duration-200 z-30"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: `translate(-50%, -50%) scale(${scale}) ${isHovered ? 'scale(1.1)' : ''}`,
                }}
              >
                {/* Active Indicator Halo Ring */}
                <div className="absolute -inset-2 rounded-2xl border-2 border-amber-400/80 animate-pulse pointer-events-none" />

                {/* Magnet Badge Body */}
                <div
                  className="relative rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.4),0_3px_8px_rgba(0,0,0,0.25)] border-2 border-amber-400 bg-white"
                  style={{ width: '76px', height: '76px' }}
                >
                  {draftCampaign?.creativeUrl ? (
                    <img
                      src={draftCampaign.creativeUrl}
                      alt={draftCampaign.productName || draftCampaign.brandName || 'Magnet Ad'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-2 text-center">
                      <Sparkles className="w-5 h-5 text-amber-500 mb-1" />
                      <span className="text-[8px] font-heading font-black text-amber-900 leading-tight">
                        {draftCampaign?.brandName || 'Brand Magnet'}
                      </span>
                    </div>
                  )}

                  {/* High-Gloss Top Right Bezel Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/40 pointer-events-none" />

                  {/* Brand Ribbon */}
                  {draftCampaign?.brandName && (
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs px-1 py-0.5 text-[7px] text-amber-300 font-heading font-black text-center truncate">
                      {draftCampaign.brandName}
                    </div>
                  )}
                </div>

                {/* Sponsored Pill Badge */}
                <div className="mt-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[8px] font-heading font-extrabold rounded-lg shadow-md flex items-center justify-center gap-1 border border-amber-300 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>Sponsored • {draftCampaign?.brandName || 'Your Brand'}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-90" />
                </div>

                {/* Simulated Destination Tooltip on Hover */}
                {isHovered && draftCampaign?.destinationUrl && (
                  <div className="absolute bottom-full mb-2 w-48 p-2 bg-slate-900/95 backdrop-blur-md rounded-xl text-white shadow-xl text-center z-50 border border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none">
                    <p className="text-[9px] font-mono text-amber-300 truncate">
                      {draftCampaign.destinationUrl}
                    </p>
                    <p className="text-[8px] text-slate-300 mt-0.5">
                      Opens merchant website in new secure tab
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Position details overlay banner */}
            <div className="mt-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 text-slate-700 text-[11px] font-medium shadow-xs flex items-center gap-2">
              <span className="font-heading font-black text-blue-600">Active Placement Slot:</span>
              <span>Coordinates: X: {posX}% • Y: {posY}%</span>
              <span>• Scale: {Math.round(scale * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
