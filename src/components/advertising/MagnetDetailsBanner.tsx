import React, { useEffect } from 'react'
import type { AdvertisingCampaign } from '../../types/advertising'
import { trackAdvertisingEvent } from '../../services/advertisingService'
import { ExternalLink, Sparkles } from 'lucide-react'

interface MagnetDetailsBannerProps {
  campaign?: AdvertisingCampaign | null
  previewCreative?: {
    creativeUrl: string
    brandName: string
    productName: string
    description?: string
    destinationUrl?: string
    ctaText?: string
  } | null
  className?: string
}

export const MagnetDetailsBanner: React.FC<MagnetDetailsBannerProps> = ({
  campaign,
  previewCreative,
  className = '',
}) => {
  const displayUrl = previewCreative?.creativeUrl || campaign?.creativeUrl
  const brandName = previewCreative?.brandName || campaign?.brandName
  const productName = previewCreative?.productName || campaign?.productName
  const description = previewCreative?.description || campaign?.description
  const destinationUrl = previewCreative?.destinationUrl || campaign?.destinationUrl
  const ctaText = previewCreative?.ctaText || campaign?.ctaText || 'View Offer'

  // Track impression if active campaign delivered
  useEffect(() => {
    if (campaign && !previewCreative) {
      trackAdvertisingEvent({
        campaignId: campaign.id,
        eventType: 'impression',
        placementType: 'magnet_banner',
        metadata: {
          slotId: campaign.slotId || 'slot_banner_sidebar_top',
          timestamp: new Date().toISOString(),
        },
      })
    }
  }, [campaign, previewCreative])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!destinationUrl) return

    if (campaign && !previewCreative) {
      trackAdvertisingEvent({
        campaignId: campaign.id,
        eventType: 'click',
        placementType: 'magnet_banner',
        metadata: {
          destinationUrl,
        },
      })
    }

    window.open(destinationUrl, '_blank', 'noopener,noreferrer')
  }

  if (!displayUrl) {
    return null
  }

  return (
    <div
      onClick={handleClick}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer bg-gradient-to-r from-slate-900 to-slate-950 text-white ${className}`}
    >
      {/* Background Creative Image with Gradient Vignette */}
      <div className="absolute inset-0">
        <img
          src={displayUrl}
          alt={productName || brandName || 'Sponsored'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30" />
      </div>

      {/* Banner Content Container */}
      <div className="relative z-10 p-3 sm:p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[9px] font-mono font-black tracking-wider uppercase shadow-2xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Ad</span>
            </span>
            {brandName && (
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate">
                {brandName}
              </span>
            )}
          </div>

          <h5 className="font-heading font-black text-xs sm:text-sm text-white leading-tight truncate drop-shadow-xs">
            {productName || 'Exclusive Travel Opportunity'}
          </h5>

          {description && (
            <p className="text-[10px] text-slate-300 line-clamp-1 leading-snug">
              {description}
            </p>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex-shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-heading font-black shadow-md flex items-center gap-1 transition-all group-hover:scale-105">
            <span>{ctaText}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  )
}
