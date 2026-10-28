import React, { useState } from 'react'
import type { AdvertisingCampaign } from '../../types/advertising'
import { MerchantLivePreview } from '../advertising/MerchantLivePreview'
import {
  X,
  ExternalLink,
  Eye,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

interface AdminAdPreviewModalProps {
  campaign: AdvertisingCampaign
  onClose: () => void
}

export const AdminAdPreviewModal: React.FC<AdminAdPreviewModalProps> = ({
  campaign,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm tracking-tight text-white">
                Super Admin Virtual Fridge Magnet Preview
              </h3>
              <p className="text-[11px] text-slate-400">
                Inspect how this magnet advertisement renders on the consumer refrigerator door.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {/* Metadata Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Campaign & Brand
              </span>
              <span className="font-heading font-black text-slate-900 text-sm">
                {campaign.name}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Brand: <strong>{campaign.brandName}</strong> • Offer: <strong>{campaign.productName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800">
                Fridge Magnet
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
                Slot: {campaign.slotId || 'Door Top Right'}
              </span>
              <a
                href={campaign.destinationUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-1 border border-blue-200"
              >
                <span>Verify Destination URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Virtual Fridge Simulator */}
          <MerchantLivePreview
            draftCampaign={{
              name: campaign.name,
              brandName: campaign.brandName,
              productName: campaign.productName,
              description: campaign.description,
              destinationUrl: campaign.destinationUrl,
              ctaText: campaign.ctaText,
              creativeUrl: campaign.creativeUrl,
              slotId: campaign.slotId,
              positionX: campaign.positionX ?? 72,
              positionY: campaign.positionY ?? 22,
              displayScale: campaign.displayScale ?? 1.05,
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Creative format & destination URL verified for consumer display.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
