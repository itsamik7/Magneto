import React, { useState, useEffect, Suspense } from 'react'
import type { Photorealistic3DFridgeProps } from './Photorealistic3DFridge'
import { UniversalSteelFridge } from './UniversalSteelFridge'
import { Sparkles, Gauge, Activity, RotateCcw } from 'lucide-react'

// Dynamic React.lazy import to isolate Three.js and heavy 3D GLTF loaders
const Photorealistic3DFridge = React.lazy(
  () => import('./Photorealistic3DFridge')
)

/**
 * Detects whether the current client device should use the lightweight 2D fallback.
 * Criteria:
 *  1. navigator.hardwareConcurrency <= 4 (lower-power/mobile/quad-core devices)
 *  2. prefers-reduced-motion is active (accessibility/motion sensitivity)
 */
export function checkDevicePrefers2DFallback(): {
  shouldFallback: boolean
  reason: 'concurrency' | 'reduced_motion' | 'none'
  concurrency?: number
} {
  if (typeof window === 'undefined') {
    return { shouldFallback: true, reason: 'none' }
  }

  // Check prefers-reduced-motion
  try {
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (motionQuery && motionQuery.matches) {
      return { shouldFallback: true, reason: 'reduced_motion' }
    }
  } catch {
    // Ignore media query evaluation exceptions
  }

  // Check hardware concurrency (CPU core count)
  try {
    const concurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined
    if (typeof concurrency === 'number' && concurrency <= 4) {
      return { shouldFallback: true, reason: 'concurrency', concurrency }
    }
    return { shouldFallback: false, reason: 'none', concurrency }
  } catch {
    return { shouldFallback: false, reason: 'none' }
  }
}

export interface Adaptive3DFridgeProps extends Photorealistic3DFridgeProps {
  /** Optional custom fallback label */
  fallbackTitle?: string
  /** Force mode override for manual testing */
  forcedMode?: 'auto' | '2d' | '3d'
}

/**
 * Lightweight 2D Refrigerator Fallback Component
 * Renders cleanly with zero WebGL overhead and instant zero-JS-cost 2D styling.
 */
export const Lightweight2DFridgeFallback: React.FC<Photorealistic3DFridgeProps & { reasonNote?: string }> = ({
  products = [],
  highlightedProductId,
  onSelectProduct,
  onMoveProduct,
  isLeftDoorOpen = false,
  isRightDoorOpen = false,
  reasonNote,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center">
      {reasonNote && (
        <div className="w-full mb-2 flex items-center justify-between text-[11px] px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
          <span className="flex items-center gap-1.5 font-medium">
            <Gauge className="w-3.5 h-3.5 text-blue-600" />
            {reasonNote}
          </span>
          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
            2D Mode
          </span>
        </div>
      )}

      <UniversalSteelFridge
        products={products}
        allowDoorOpen={false}
        isDoorOpen={isLeftDoorOpen || isRightDoorOpen}
        isMainDoorOpen={isLeftDoorOpen || isRightDoorOpen}
        isFreezerDoorOpen={false}
        isCrisperOpen={false}
        isFreezerOpen={false}
        magneticRegion={{ top: 0.1, left: 0.1, width: 0.8, height: 0.8 }}
        surfaceRef={{ current: null }}
        highlightedProductId={highlightedProductId}
        onSelectProduct={onSelectProduct}
        onMoveProduct={onMoveProduct}
      >
        <div />
      </UniversalSteelFridge>
    </div>
  )
}

/**
 * Adaptive 3D Refrigerator Container
 * Evaluates hardware performance & accessibility before dynamically importing Three.js.
 */
export const Adaptive3DFridge: React.FC<Adaptive3DFridgeProps> = (props) => {
  const { forcedMode = 'auto', ...fridgeProps } = props

  const [deviceInfo, setDeviceInfo] = useState(() => checkDevicePrefers2DFallback())
  const [manualOverride, setManualOverride] = useState<'3d' | '2d' | null>(null)

  useEffect(() => {
    setDeviceInfo(checkDevicePrefers2DFallback())
  }, [])

  const effectiveUse2D =
    forcedMode === '2d'
      ? true
      : forcedMode === '3d'
      ? false
      : manualOverride === '2d'
      ? true
      : manualOverride === '3d'
      ? false
      : deviceInfo.shouldFallback

  const reasonDescription =
    deviceInfo.reason === 'concurrency'
      ? `Lightweight 2D active (CPU cores: ${deviceInfo.concurrency || '≤4'} detected)`
      : deviceInfo.reason === 'reduced_motion'
      ? 'Lightweight 2D active (prefers-reduced-motion)'
      : 'Lightweight 2D active'

  if (effectiveUse2D) {
    return (
      <div className="w-full flex flex-col items-center">
        <Lightweight2DFridgeFallback {...fridgeProps} reasonNote={reasonDescription} />

        {/* Manual Performance Override Controls */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManualOverride('3d')}
            className="text-[11px] font-heading font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try 3D WebGL View</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full mb-2 flex items-center justify-between text-[11px] px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900">
        <span className="flex items-center gap-1.5 font-medium">
          <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          Hardware Acceleration Ready ({deviceInfo.concurrency ? `${deviceInfo.concurrency} cores` : 'High performance'})
        </span>
        <button
          type="button"
          onClick={() => setManualOverride('2d')}
          className="text-[10px] font-mono uppercase bg-white hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 cursor-pointer font-bold transition-colors"
        >
          Use 2D Mode
        </button>
      </div>

      <Suspense
        fallback={
          <Lightweight2DFridgeFallback
            {...fridgeProps}
            reasonNote="Loading 3D Three.js Refrigerator..."
          />
        }
      >
        <Photorealistic3DFridge {...fridgeProps} />
      </Suspense>
    </div>
  )
}

export default Adaptive3DFridge
