import React, { useState, useEffect } from 'react'
import type { AdvertisingCampaign } from '../../types/advertising'
import { trackAdvertisingEvent } from '../../services/advertisingService'
import { ExternalLink, Sparkles, Monitor, Tv } from 'lucide-react'

interface LedAdvertisingDisplayProps {
  campaigns?: AdvertisingCampaign[]
  previewCreative?: {
    creativeUrl: string
    brandName: string
    productName: string
    destinationUrl?: string
    ctaText?: string
    isVideo?: boolean
  } | null
  className?: string
  compact?: boolean
}

export const LedAdvertisingDisplay: React.FC<LedAdvertisingDisplayProps> = ({
  campaigns = [],
  previewCreative,
  className = '',
  compact = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Automatic rotation between multiple campaigns every 8 seconds
  useEffect(() => {
    if (previewCreative || campaigns.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length)
    }, 8000)

    return () => clearInterval(timer)
  }, [campaigns.length, previewCreative])

  const activeCampaign = campaigns[currentIndex]

  // Track impression when campaign changes
  useEffect(() => {
    if (activeCampaign && !previewCreative) {
      trackAdvertisingEvent({
        campaignId: activeCampaign.id,
        eventType: 'impression',
        placementType: 'led_display',
        metadata: {
          timestamp: new Date().toISOString(),
          displaySlot: activeCampaign.slotId || 'slot_led_tv_main',
        },
      })
    }
  }, [activeCampaign, previewCreative])

  const handleClick = () => {
    const url = previewCreative?.destinationUrl || activeCampaign?.destinationUrl
    if (!url) return

    if (activeCampaign && !previewCreative) {
      trackAdvertisingEvent({
        campaignId: activeCampaign.id,
        eventType: 'click',
        placementType: 'led_display',
        metadata: {
          destinationUrl: url,
        },
      })
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Display Content resolution
  const displayUrl = previewCreative?.creativeUrl || activeCampaign?.creativeUrl
  const brandName = previewCreative?.brandName || activeCampaign?.brandName || 'Magnetos LED'
  const productName = previewCreative?.productName || activeCampaign?.productName || 'Featured Destination Experience'
  const ctaText = previewCreative?.ctaText || activeCampaign?.ctaText || 'Learn More'
  const isVideo = previewCreative?.isVideo || (displayUrl && (displayUrl.endsWith('.mp4') || displayUrl.includes('video')))

  if (!displayUrl && campaigns.length === 0 && !previewCreative) {
    // Elegant fallback state when no ad is scheduled (does not disrupt experience)
    return (
      <div
        className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-2 border border-slate-700/60 shadow-lg text-slate-400 select-none ${className}`}
        style={{ minWidth: compact ? '160px' : '220px', aspectRatio: '16/10' }}
      >
        <div className="flex flex-col items-center gap-1 text-center p-3">
          <Monitor className="w-5 h-5 text-blue-400/80 mb-1" />
          <span className="text-[10px] font-heading font-bold text-slate-300">
            Magnetos Digital LED
          </span>
          <span className="text-[9px] text-slate-500">
            Commercial Display Stand
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative group select-none flex flex-col items-center ${className}`}
      style={{
        maxWidth: compact ? '220px' : '280px',
        width: '100%',
      }}
    >
      {/* Modern Thin-Bezel Screen Frame */}
      <div
        onClick={handleClick}
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.15)] border-2 border-slate-700/80 bg-slate-950"
        style={{ aspectRatio: '16/10' }}
      >
        {/* Subtle Ambient LED Bezel Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-indigo-500/10 pointer-events-none z-10" />

        {/* Media (Image or Video) */}
        {isVideo ? (
          <video
            src={displayUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={displayUrl}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}

        {/* Ambient Display Sheen Reflection */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none z-10" />

        {/* Top Floating "Sponsored / Ad" Tag */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-md text-[9px] font-mono font-bold text-amber-400 border border-amber-400/30 shadow-xs">
          <Sparkles className="w-2.5 h-2.5" />
          <span>SPONSORED</span>
        </div>

        {/* Bottom Banner Content */}
        <div className="absolute bottom-2 inset-x-2 z-20 flex items-end justify-between gap-1 text-white">
          <div className="min-w-0 pr-1">
            <span className="block text-[9px] font-bold text-blue-300 uppercase tracking-wider truncate">
              {brandName}
            </span>
            <span className="block text-[11px] font-heading font-black leading-tight text-white drop-shadow-sm truncate">
              {productName}
            </span>
          </div>

          <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-heading font-bold shadow-md transition-colors">
            <span>{ctaText}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Screen Dots Grid Texture (Subtle LED pixel effect) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 z-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '4px 4px',
          }}
        />
      </div>

      {/* Modern Floor/Desktop Display Stand Pillar & Base */}
      <div className="flex flex-col items-center -mt-0.5 pointer-events-none">
        {/* Sleek Neck */}
        <div className="w-4 h-4 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 shadow-inner rounded-b-xs" />
        {/* Brushed Metal Base */}
        <div className="w-16 h-2 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-full shadow-md border-t border-slate-300" />
      </div>

      {/* Multi-campaign indicators if more than 1 campaign */}
      {campaigns.length > 1 && !previewCreative && (
        <div className="flex items-center gap-1 mt-1.5 z-20">
          {campaigns.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1 rounded-full transition-all cursor-pointer ${
                i === currentIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-300'
              }`}
              title={`Switch to Ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
