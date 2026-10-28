import React, { useState, useEffect } from 'react'
import type { PlatformSettings } from '../../types/admin'
import {
  getPlatformSettings,
  updatePlatformSettings,
  toggleGlobalAdvertising,
  checkAdminPermission,
  PLATFORM_SETTINGS_UPDATED_EVENT,
} from '../../services/adminService'
import {
  Settings,
  Power,
  Shield,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  FileCheck,
  AlertTriangle,
  Save,
  Check,
  X,
  Sparkles,
  Sliders,
  HardDrive,
  Clock,
  RefreshCw,
} from 'lucide-react'

interface AdminSystemSettingsProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminSystemSettings: React.FC<AdminSystemSettingsProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Master Kill Switch Modal State
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false)
  const [killSwitchReason, setKillSwitchReason] = useState('')
  const [killSwitchAction, setKillSwitchAction] = useState<boolean>(false)
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false)

  // Local Form state
  const [merchantAutoApproval, setMerchantAutoApproval] = useState(false)
  const [adModerationRequired, setAdModerationRequired] = useState(true)
  const [defaultCurrency, setDefaultCurrency] = useState('INR')
  const [defaultTaxRate, setDefaultTaxRate] = useState(18.0)
  const [maxCampaignDurationDays, setMaxCampaignDurationDays] = useState(365)
  const [maxCreativeFileSizeMb, setMaxCreativeFileSizeMb] = useState(50)
  const [platformMaintenanceMode, setPlatformMaintenanceMode] = useState(false)
  const [featureFlags, setFeatureFlags] = useState({
    enable_3d_fridge_ads: true,
    enable_led_video_ads: true,
    enable_coupon_codes: true,
    allow_custom_plans: true,
  })

  const canManage = checkAdminPermission(currentAdminRole, 'canManageSettings')
  const canGlobalPause = checkAdminPermission(currentAdminRole, 'canGlobalPauseAds')

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await getPlatformSettings()
      setSettings(data)
      setMerchantAutoApproval(data.merchantAutoApproval)
      setAdModerationRequired(data.adModerationRequired)
      setDefaultCurrency(data.defaultCurrency)
      setDefaultTaxRate(data.defaultTaxRate)
      setMaxCampaignDurationDays(data.maxCampaignDurationDays)
      setMaxCreativeFileSizeMb(data.maxCreativeFileSizeMb)
      setPlatformMaintenanceMode(data.platformMaintenanceMode)
      setFeatureFlags({
        enable_3d_fridge_ads: data.featureFlags?.enable_3d_fridge_ads ?? true,
        enable_led_video_ads: data.featureFlags?.enable_led_video_ads ?? true,
        enable_coupon_codes: data.featureFlags?.enable_coupon_codes ?? true,
        allow_custom_plans: data.featureFlags?.allow_custom_plans ?? true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()

    const handleUpdate = () => {
      loadSettings()
    }
    window.addEventListener(PLATFORM_SETTINGS_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(PLATFORM_SETTINGS_UPDATED_EVENT, handleUpdate)
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return

    setSaving(true)
    setFeedback(null)
    try {
      const updated = await updatePlatformSettings(
        {
          merchantAutoApproval,
          adModerationRequired,
          defaultCurrency,
          defaultTaxRate: Number(defaultTaxRate),
          maxCampaignDurationDays: Number(maxCampaignDurationDays),
          maxCreativeFileSizeMb: Number(maxCreativeFileSizeMb),
          platformMaintenanceMode,
          featureFlags,
        },
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setSettings(updated)
      setFeedback({ type: 'success', message: 'Platform settings saved and broadcasted platform-wide.' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings.' })
    } finally {
      setSaving(false)
    }
  }

  const handleTriggerKillSwitch = (targetState: boolean) => {
    setKillSwitchAction(targetState)
    setKillSwitchReason(
      targetState
        ? 'Manual platform-wide advertising restoration by administrator.'
        : 'Emergency or planned platform-wide advertising suspension.'
    )
    setKillSwitchModalOpen(true)
  }

  const handleConfirmKillSwitch = async () => {
    setTogglingKillSwitch(true)
    try {
      const updated = await toggleGlobalAdvertising(
        killSwitchAction,
        { email: currentAdminEmail, role: currentAdminRole },
        killSwitchReason
      )
      setSettings(updated)
      setKillSwitchModalOpen(false)
      setFeedback({
        type: 'success',
        message: killSwitchAction
          ? 'Platform-wide advertising has been RESUMED across all user experiences.'
          : 'EMERGENCY: All platform advertising has been PAUSED across the entire website.',
      })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle master advertising state.' })
    } finally {
      setTogglingKillSwitch(false)
    }
  }

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-400">Loading system settings...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            System Settings &amp; Platform Controls
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Global advertising master controls, commercial policies, taxes, and operational feature flags.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg self-start transition-colors"
          title="Reload configuration"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MASTER ADVERTISING KILL SWITCH HERO */}
      <div
        className={`rounded-2xl border p-6 transition-all shadow-sm ${
          settings.globalAdvertisingEnabled
            ? 'bg-white border-slate-200'
            : 'bg-rose-50 border-rose-200 ring-2 ring-rose-500/20'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                settings.globalAdvertisingEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-600 text-white'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Platform-Wide Advertising Master Switch</h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide border ${
                    settings.globalAdvertisingEnabled
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                  }`}
                >
                  {settings.globalAdvertisingEnabled ? 'Serving Active' : 'Emergency Paused'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Centralized platform kill switch. When paused, the backend service immediately halts delivering all
                sponsored fridge magnet placements across the consumer web application.
              </p>
            </div>
          </div>

          {canGlobalPause ? (
            <button
              onClick={() => handleTriggerKillSwitch(!settings.globalAdvertisingEnabled)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap self-start md:self-center ${
                settings.globalAdvertisingEnabled
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              <Power className="w-4 h-4" />
              {settings.globalAdvertisingEnabled ? 'Pause All Advertisements' : 'Resume All Advertisements'}
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">Requires Super Admin / Operations authority</span>
          )}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Moderation & Governance Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Governance &amp; Moderation Policies</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={adModerationRequired}
                onChange={(e) => setAdModerationRequired(e.target.checked)}
                disabled={!canManage}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div>
                <span className="font-semibold text-sm text-slate-900 block">Require Pre-Publication Ad Moderation</span>
                <span className="text-xs text-slate-500 mt-0.5 block leading-relaxed">
                  Campaigns submitted by merchants remain in pending_approval until an administrator approves creative,
                  product links, and destination URLs.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={merchantAutoApproval}
                onChange={(e) => setMerchantAutoApproval(e.target.checked)}
                disabled={!canManage}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div>
                <span className="font-semibold text-sm text-slate-900 block">Merchant Registration Auto-Approval</span>
                <span className="text-xs text-slate-500 mt-0.5 block leading-relaxed">
                  Automatically verify merchant accounts upon signup. When disabled, newly registered merchants require
                  manual verification review in the moderation queue.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors md:col-span-2">
              <input
                type="checkbox"
                checked={platformMaintenanceMode}
                onChange={(e) => setPlatformMaintenanceMode(e.target.checked)}
                disabled={!canManage}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div>
                <span className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  Platform Maintenance Mode
                  {platformMaintenanceMode && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                      Maintenance Active
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block leading-relaxed">
                  Broadcasts a maintenance banner on user and merchant portals, restricting mutation actions to
                  administrators only.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Commercial & Financial Settings Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Commercial &amp; Billing Parameters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                disabled={!canManage}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="INR">INR (Indian Rupee - ₹)</option>
                <option value="USD">USD (US Dollar - $)</option>
                <option value="EUR">EUR (Euro - €)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Applicable GST / Tax (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                disabled={!canManage}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Campaign Days</label>
              <input
                type="number"
                min="1"
                max="730"
                value={maxCampaignDurationDays}
                onChange={(e) => setMaxCampaignDurationDays(parseInt(e.target.value) || 30)}
                disabled={!canManage}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Creative Upload (MB)</label>
              <input
                type="number"
                min="1"
                max="200"
                value={maxCreativeFileSizeMb}
                onChange={(e) => setMaxCreativeFileSizeMb(parseInt(e.target.value) || 50)}
                disabled={!canManage}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Feature Flags Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Operational Feature Flags</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-slate-800">Virtual Fridge Magnet Placements</span>
              <input
                type="checkbox"
                checked={featureFlags.enable_3d_fridge_ads}
                onChange={(e) =>
                  setFeatureFlags({ ...featureFlags, enable_3d_fridge_ads: e.target.checked })
                }
                disabled={!canManage}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-slate-800">Exclusive Door Slot Collisions Check</span>
              <input
                type="checkbox"
                checked={featureFlags.enable_led_video_ads}
                onChange={(e) =>
                  setFeatureFlags({ ...featureFlags, enable_led_video_ads: e.target.checked })
                }
                disabled={!canManage}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-slate-800">Merchant Coupon Code Call-to-Actions</span>
              <input
                type="checkbox"
                checked={featureFlags.enable_coupon_codes}
                onChange={(e) =>
                  setFeatureFlags({ ...featureFlags, enable_coupon_codes: e.target.checked })
                }
                disabled={!canManage}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-slate-800">Allow Admin Custom Plan Overrides</span>
              <input
                type="checkbox"
                checked={featureFlags.allow_custom_plans}
                onChange={(e) =>
                  setFeatureFlags({ ...featureFlags, allow_custom_plans: e.target.checked })
                }
                disabled={!canManage}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
            </label>
          </div>
        </div>

        {/* Action Button Bar */}
        {canManage && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving System Settings...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </form>

      {/* KILL SWITCH CONFIRMATION MODAL */}
      {killSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                killSwitchAction ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
              }`}
            >
              <h3
                className={`font-semibold flex items-center gap-2 ${
                  killSwitchAction ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${killSwitchAction ? 'text-emerald-600' : 'text-rose-600'}`} />
                {killSwitchAction ? 'Confirm Resume All Advertisements' : 'Confirm Platform-Wide Advertising Pause'}
              </h3>
              <button
                onClick={() => setKillSwitchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {killSwitchAction ? (
                  <span>
                    You are about to <strong>RESTORE</strong> all active advertising placements across the Magnetos website.
                    All merchant campaigns in active status will become immediately visible to consumers.
                  </span>
                ) : (
                  <span>
                    You are about to <strong>PAUSE</strong> every advertisement platform-wide. No sponsored fridge items,
                    magnets, or LED screens will appear on any consumer page. This action takes effect immediately and is
                    logged in the audit ledger.
                  </span>
                )}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason for Action (Recorded in Audit Ledger) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={killSwitchReason}
                  onChange={(e) => setKillSwitchReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="State the justification or incident ticket reference..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKillSwitchModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKillSwitch}
                  disabled={togglingKillSwitch || !killSwitchReason.trim()}
                  className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm disabled:opacity-50 ${
                    killSwitchAction ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {togglingKillSwitch
                    ? 'Updating...'
                    : killSwitchAction
                    ? 'Confirm Resume Platform Ads'
                    : 'Confirm Emergency Pause'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
