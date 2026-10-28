import React, { useState, useEffect, useMemo } from 'react'
import type { DateRangeFilter } from '../../types/admin'
import {
  getSuperAdminOverviewStats,
  getBillingSummary,
} from '../../services/adminService'
import {
  getAllCampaigns,
  getAllMerchants,
  getAdvertisingSlots,
  getAdvertisingPlans,
} from '../../services/advertisingService'
import type { AdvertisingCampaign, MerchantProfile } from '../../types/advertising'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Eye,
  MousePointer,
  Store,
  CreditCard,
  Layers,
  ArrowUpRight,
  PieChart,
} from 'lucide-react'

interface AdminAnalyticsReportingProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminAnalyticsReporting: React.FC<AdminAnalyticsReportingProps> = () => {
  const [stats, setStats] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([])
  const [merchants, setMerchants] = useState<MerchantProfile[]>([])
  const [billing, setBilling] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [timeHorizon, setTimeHorizon] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [st, cList, mList, bData, sList] = await Promise.all([
        getSuperAdminOverviewStats(),
        getAllCampaigns(),
        getAllMerchants(),
        getBillingSummary(),
        getAdvertisingSlots(),
      ])
      setStats(st)
      setCampaigns(cList)
      setMerchants(mList)
      setBilling(bData)
      setSlots(sList)
    } catch (e: any) {
      console.error('Error loading analytics:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Export Analytics CSV
  const handleExportAnalyticsCsv = () => {
    const headers = ['Metric', 'Value', 'Note']
    const rows = [
      ['Total Registered Users', stats?.totalUsers || 0, 'Normal travelers'],
      ['Total Merchants', stats?.totalMerchants || 0, 'Registered businesses'],
      ['Active Advertisements', stats?.activeAds || 0, 'Currently served'],
      ['Total Impressions Delivered', stats?.totalImpressions || 0, 'Audited events'],
      ['Total Clicks Generated', stats?.totalClicks || 0, 'Audited events'],
      ['Platform CTR (%)', `${stats?.platformCtr || 0}%`, 'Clicks / Impressions'],
      ['Gross Sales (INR)', `Rs ${(billing?.grossSalesMinor / 100).toFixed(2)}`, 'All orders'],
      ['Net Revenue (INR)', `Rs ${(billing?.netRevenueMinor / 100).toFixed(2)}`, 'After refunds'],
      ['Total Inventory Slots', slots.length, 'Governed positions'],
    ]

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `magnetos_platform_analytics_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Fridge Door Slot Utilization Breakdown
  const placementUtilization = useMemo(() => {
    return slots.map((s) => {
      const slotCampaigns = campaigns.filter(
        (c) => (c.slotId === s.id || c.placementId === s.id) && c.status === 'active'
      )
      const totalCapacity = s.capacity || 1
      const occupied = slotCampaigns.length
      const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((occupied / totalCapacity) * 100)) : 0

      return {
        id: s.id,
        label: s.name,
        isExclusive: s.isExclusive,
        coordinates: `${s.defaultPositionX}%, ${s.defaultPositionY ?? 45}%`,
        totalCapacity,
        occupied,
        occupancyRate,
      }
    })
  }, [slots, campaigns])

  if (isLoading || !stats) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
        <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Compiling Platform Performance Metrics...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            Analytics & Operations Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Platform performance metrics, placement occupancy rates, merchant engagement, and downloadable intelligence reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {(['7d', '30d', '90d', 'all'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setTimeHorizon(h)}
                className={`px-3 py-1 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                  timeHorizon === h ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {h.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportAnalyticsCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Primary Intelligence Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Conversion Rate
          </span>
          <p className="font-heading font-black text-2xl text-slate-900">
            {stats.totalMerchants > 0
              ? `${Math.round((stats.verifiedMerchants / stats.totalMerchants) * 100)}%`
              : '0%'}
          </p>
          <span className="text-[10px] text-slate-500">
            {stats.verifiedMerchants} of {stats.totalMerchants} merchants verified
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Average Click-Through Rate
          </span>
          <p className="font-heading font-black text-2xl text-purple-700">
            {stats.platformCtr}%
          </p>
          <span className="text-[10px] text-slate-500">
            {stats.totalClicks} clicks / {stats.totalImpressions} impressions
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Campaign Occupancy
          </span>
          <p className="font-heading font-black text-2xl text-blue-600">
            {stats.activeAds}
          </p>
          <span className="text-[10px] text-slate-500">
            Across {slots.length} available inventory spots
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Average Revenue Per Merchant
          </span>
          <p className="font-heading font-black text-2xl text-emerald-600">
            ₹ {stats.totalMerchants > 0
              ? Math.round(billing.netRevenueMinor / stats.totalMerchants / 100).toLocaleString('en-IN')
              : '0'}
          </p>
          <span className="text-[10px] text-slate-500">
            Based on active subscriptions
          </span>
        </div>
      </div>

      {/* Placement Inventory Occupancy Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="font-heading font-black text-base text-slate-900">
            Virtual Fridge Door Slots Utilization
          </h3>
          <p className="text-xs text-slate-500">
            Monitors real-time capacity, exclusivity, and occupancy per door slot on the virtual fridge surface.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {placementUtilization.map((u, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-heading font-black text-xs text-slate-900 block truncate max-w-[130px]">
                    {u.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Pos: {u.coordinates}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {u.occupancyRate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${u.occupancyRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Occupied: <strong>{u.occupied}</strong></span>
                <span>Max: <strong>{u.totalCapacity}</strong> {u.isExclusive ? '(Exclusive)' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Merchants Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="font-heading font-black text-base text-slate-900">
          Top Performing Merchants by Spend & Engagement
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Merchant Name</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Active Campaigns</th>
                <th className="py-2.5 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.map((m) => {
                const mCampaigns = campaigns.filter((c) => c.merchantId === m.id)
                const activeCount = mCampaigns.filter((c) => c.status === 'active').length

                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <span className="font-heading font-black text-slate-900 block">{m.businessName}</span>
                      <span className="text-[10px] text-slate-500">{m.contactPerson}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-semibold">{m.businessCategory}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {m.verificationStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-800">{activeCount}</span> of {mCampaigns.length} total
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
