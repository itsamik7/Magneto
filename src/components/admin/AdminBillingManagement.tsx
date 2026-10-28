import React, { useState, useEffect } from 'react'
import type { PaymentTransaction } from '../../types/advertising'
import {
  getBillingSummary,
  issuePaymentRefund,
  exportFinancialReportCsv,
} from '../../services/adminService'
import {
  CreditCard,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Receipt,
  DollarSign,
  TrendingUp,
  ExternalLink,
  X,
} from 'lucide-react'

interface AdminBillingManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminBillingManagement: React.FC<AdminBillingManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [summary, setSummary] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Refund Modal
  const [refundingPayment, setRefundingPayment] = useState<PaymentTransaction | null>(null)
  const [refundReason, setRefundReason] = useState('')

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadBilling = async () => {
    try {
      const data = await getBillingSummary()
      setSummary(data)
    } catch (e: any) {
      console.error('Error loading billing summary:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBilling()
  }, [])

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const csv = await exportFinancialReportCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `magnetos_financial_report_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setToast({ type: 'success', text: 'Financial transaction ledger exported to CSV.' })
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  // Issue Refund Confirm
  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundingPayment) return

    try {
      await issuePaymentRefund(
        refundingPayment.id,
        refundReason.trim() || 'Customer support refund approval',
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setToast({
        type: 'success',
        text: `Transaction ${refundingPayment.gatewayOrderId} was successfully marked as refunded.`,
      })
      setRefundingPayment(null)
      setRefundReason('')
      loadBilling()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  const filteredTransactions = (summary?.transactions || []).filter((t: PaymentTransaction) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        t.id.toLowerCase().includes(q) ||
        t.gatewayOrderId.toLowerCase().includes(q) ||
        (t.gatewayPaymentId && t.gatewayPaymentId.toLowerCase().includes(q)) ||
        t.merchantId.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (isLoading || !summary) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
        <CreditCard className="w-8 h-8 text-blue-600 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Consolidating Financial & Payment Records...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            Payments, Billing & Revenue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated financial ledger, invoices, tax calculations, refund records, and downloadable CSV statements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Gross Sales
          </span>
          <p className="font-heading font-black text-2xl text-slate-900">
            ₹ {(summary.grossSalesMinor / 100).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">
            {summary.successfulTransactions} successful payments
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Net Revenue
          </span>
          <p className="font-heading font-black text-2xl text-emerald-600">
            ₹ {(summary.netRevenueMinor / 100).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">
            After recorded refunds
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Applicable GST (18%)
          </span>
          <p className="font-heading font-black text-2xl text-indigo-600">
            ₹ {(summary.estimatedTaxMinor / 100).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">
            Estimated statutory tax
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Refunds Issued
          </span>
          <p className="font-heading font-black text-2xl text-rose-600">
            ₹ {(summary.refundsMinor / 100).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">
            Audited refund records
          </span>
        </div>
      </div>

      {/* Revenue Breakdown by Subscription Plan */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="font-heading font-black text-base text-slate-900">
          Revenue Distribution by Subscription Plan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summary.planBreakdown.map((item: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-heading font-bold text-xs text-slate-800 block truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-400">Active offering</span>
              </div>
              <span className="font-heading font-black text-sm text-slate-900">
                ₹ {(item.amountMinor / 100).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, payment ID, or merchant ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">Payment Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success / Verified</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order / Payment ID</th>
                <th className="py-3 px-4">Merchant ID</th>
                <th className="py-3 px-4">Amount (INR)</th>
                <th className="py-3 px-4">Method & Gateway</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx: PaymentTransaction) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {tx.gatewayOrderId}
                    </span>
                    {tx.gatewayPaymentId && (
                      <span className="font-mono text-[10px] text-slate-400 block">
                        Ref: {tx.gatewayPaymentId}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                    {tx.merchantId}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-heading font-black text-sm text-slate-900">
                      ₹ {(tx.amountMinor / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{tx.currency}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-700 capitalize block">
                      {tx.paymentMethod.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tx.gateway}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        tx.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.status === 'refunded'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {tx.status === 'success' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundingPayment(tx)
                          setRefundReason('')
                        }}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-[11px] cursor-pointer"
                        title="Issue Audited Refund"
                      >
                        Refund
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 
        ========================================================================
        MODAL: CONFIRM REFUND
        ========================================================================
      */}
      {refundingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleConfirmRefund}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">
                Confirm Payment Refund
              </h3>
              <button
                type="button"
                onClick={() => setRefundingPayment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to issue a refund for transaction{' '}
              <strong className="text-slate-900">{refundingPayment.gatewayOrderId}</strong> in the amount of{' '}
              <strong className="text-rose-700">₹ {(refundingPayment.amountMinor / 100).toLocaleString('en-IN')}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Refund Rationale *
              </label>
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Operational justification for refund..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRefundingPayment(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Confirm & Record Refund
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
