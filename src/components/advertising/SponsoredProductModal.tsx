import React from 'react'
import type { AdvertisingCampaign } from '../../types/advertising'
import { trackAdvertisingEvent } from '../../services/advertisingService'
import { X, ExternalLink, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react'

interface SponsoredProductModalProps {
  campaign: AdvertisingCampaign | null
  isOpen: boolean
  onClose: () => void
}

export const SponsoredProductModal: React.FC<SponsoredProductModalProps> = ({
  campaign,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !campaign) return null

  const handleCtaClick = () => {
    trackAdvertisingEvent({
      campaignId: campaign.id,
      eventType: 'click',
      placementType: 'fridge_product',
      metadata: {
        destinationUrl: campaign.destinationUrl,
        shelf: campaign.shelf,
      },
    })
    window.open(campaign.destinationUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Product Image Header with Close Button */}
        <div className="relative w-full h-44 bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={campaign.creativeUrl}
            alt={campaign.productName}
            className="h-full object-contain drop-shadow-lg"
          />

          {/* Sponsored Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 border border-amber-300/30 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>SPONSORED PLACEMENT</span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md transition-transform hover:scale-110 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 text-[11px] font-bold uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{campaign.brandName}</span>
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900 leading-tight mt-1">
              {campaign.productName}
            </h3>
            {campaign.description && (
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                {campaign.description}
              </p>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Merchant Partner</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">Shelf Verified</span>
          </div>

          {/* Action CTA Button */}
          <button
            onClick={handleCtaClick}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{campaign.ctaText || 'Shop This Product'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  )
}
