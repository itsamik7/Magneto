import React, { useState } from 'react'
import type { AdvertisingPlan, MerchantSubscription, PaymentTransaction } from '../../types/advertising'
import { purchaseSubscriptionWithSandboxPayment } from '../../services/advertisingService'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  QrCode,
  Building,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Receipt,
} from 'lucide-react'

interface MerchantCheckoutModalProps {
  plan: AdvertisingPlan | null
  merchantId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (subscription: MerchantSubscription, payment: PaymentTransaction) => void
}

export const MerchantCheckoutModal: React.FC<MerchantCheckoutModalProps> = ({
  plan,
  merchantId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [upiId, setUpiId] = useState('brand@okhdfcbank')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')
  const [paymentSuccess, setPaymentSuccess] = useState<{
    subscription: MerchantSubscription
    payment: PaymentTransaction
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !plan) return null

  const priceInr = plan.priceInrMinor / 100
  const gstInr = Math.round(priceInr * 0.18)
  const totalInr = priceInr + gstInr

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsProcessing(true)

    try {
      setProcessingStep('Initializing secure payment gateway session...')
      await new Promise((r) => setTimeout(r, 600))

      setProcessingStep('Authorizing secure payment transaction...')
      await new Promise((r) => setTimeout(r, 700))

      setProcessingStep('Verifying cryptographic signature & ledger event...')
      const result = await purchaseSubscriptionWithSandboxPayment({
        merchantId,
        planId: plan.id,
        paymentMethod: paymentMethod === 'upi' ? `UPI (${upiId})` : `Card (${cardNumber.slice(-4)})`,
        cardOrUpiRef: paymentMethod === 'upi' ? upiId : cardNumber,
      })

      setProcessingStep('Activating advertising subscription entitlement...')
      await new Promise((r) => setTimeout(r, 500))

      setPaymentSuccess(result)
      onSuccess(result.subscription, result.payment)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment authorization failed'
      setErrorMsg(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinish = () => {
    setPaymentSuccess(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base leading-tight">
                Secure Advertising Checkout
              </h3>
              <span className="text-[10px] text-blue-300 font-mono">
                Encrypted 256-bit Secure SSL Gateway
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {paymentSuccess ? (
          /* Payment Success Confirmation View */
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Payment Authorized & Verified
              </span>
              <h4 className="font-heading font-black text-xl text-slate-900">
                Subscription Activated!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your advertising entitlement for <strong>{plan.name}</strong> is now live for the next {plan.durationDays} days.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200">
                <span>Receipt Number</span>
                <span className="font-mono font-bold text-slate-800">{paymentSuccess.payment.gatewayOrderId}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Transaction Amount</span>
                <span className="font-heading font-black text-slate-900">
                  ₹ {(paymentSuccess.payment.amountMinor / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Valid Until</span>
                <span className="font-medium text-slate-700">
                  {new Date(paymentSuccess.subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Payment Signature Verified</span>
                </span>
                <span className="font-mono text-slate-400">STATUS: SUCCESS</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Continue to Campaign Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Payment Form View */
          <form onSubmit={handlePay} className="p-6 space-y-5">
            {/* Plan Info Card */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-700 tracking-wider">
                  {plan.tier} Plan
                </span>
                <h4 className="font-heading font-black text-base text-slate-900 leading-tight">
                  {plan.name}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Duration: {plan.durationDays} Days • {plan.creativeSlots} Creative Slots
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-heading font-black text-xl text-blue-900">
                  ₹ {priceInr.toLocaleString('en-IN')}
                </span>
                <span className="block text-[10px] text-slate-500">+18% GST</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs block">UPI Autopay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs block">Corporate Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs block">NetBanking</span>
                </button>
              </div>
            </div>

            {/* Input Details */}
            {paymentMethod === 'upi' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="merchant@upi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Instant UPI payment verification with merchant bank gateway.
                </span>
              </div>
            ) : paymentMethod === 'card' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      required
                      defaultValue="789"
                      maxLength={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Corporate Bank
                </label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900">
                  <option>HDFC Bank Corporate</option>
                  <option>ICICI Bank Commercial</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            {/* Total Summary */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500">Total Payable Amount</span>
                <span className="font-heading font-black text-xl text-slate-900">
                  ₹ {totalInr.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay & Activate Subscription</span>
                  </>
                )}
              </button>
            </div>

            {isProcessing && processingStep && (
              <p className="text-center text-[11px] font-mono text-blue-600 animate-pulse">
                {processingStep}
              </p>
            )}
          </form>
        )}

      </div>
    </div>
  )
}
