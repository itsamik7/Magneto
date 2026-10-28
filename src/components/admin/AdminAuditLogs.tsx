import React, { useState, useEffect, useMemo } from 'react'
import type { AuditLog, EntityType } from '../../types/admin'
import {
  getAuditLogs,
  exportAuditLogsCsv,
  AUDIT_LOG_ADDED_EVENT,
  checkAdminPermission,
} from '../../services/adminService'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  Clock,
  ArrowRight,
  X,
  Layers,
  User,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

interface AdminAuditLogsProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const canExport = checkAdminPermission(currentAdminRole, 'canExportData')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs()
      setLogs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()

    const handleLogAdded = () => {
      loadLogs()
    }
    window.addEventListener(AUDIT_LOG_ADDED_EVENT, handleLogAdded)
    return () => window.removeEventListener(AUDIT_LOG_ADDED_EVENT, handleLogAdded)
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEntity !== 'all' && log.entityType !== selectedEntity) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchAction = log.action.toLowerCase().includes(q)
        const matchActor = log.actorEmail.toLowerCase().includes(q)
        const matchEntity = log.entityId?.toLowerCase().includes(q)
        const matchRole = log.actorRole.toLowerCase().includes(q)
        const matchDetails = JSON.stringify(log.details).toLowerCase().includes(q)
        if (!matchAction && !matchActor && !matchEntity && !matchRole && !matchDetails) {
          return false
        }
      }
      return true
    })
  }, [logs, selectedEntity, searchQuery])

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredLogs.slice(start, start + pageSize)
  }, [filteredLogs, page, pageSize])

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const csvData = await exportAuditLogsCsv({
        entityType: selectedEntity !== 'all' ? selectedEntity : undefined,
        searchQuery: searchQuery.trim() || undefined,
      })
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `magnetos_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setExporting(false)
    }
  }

  const getEntityBadge = (type: EntityType) => {
    switch (type) {
      case 'advertisement':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'merchant':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'user':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'subscription_plan':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'platform_settings':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'payment_refund':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'support_session':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'role_permission':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Append-Only Audit Log Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident record of all administrative decisions, platform settings changes, and security actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canExport && (
            <button
              onClick={handleExportCsv}
              disabled={exporting || filteredLogs.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Audit CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor email, entity ID, details..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
          >
            <option value="all">All Entity Types</option>
            <option value="advertisement">Advertisements</option>
            <option value="merchant">Merchants</option>
            <option value="user">Users</option>
            <option value="subscription_plan">Subscription Plans</option>
            <option value="platform_settings">Platform Settings</option>
            <option value="support_session">Support Sessions</option>
            <option value="payment_refund">Payment Refunds</option>
            <option value="role_permission">Role Permissions</option>
            <option value="system">System Core</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{filteredLogs.length}</span> audit event
            {filteredLogs.length === 1 ? '' : 's'} recorded
          </div>
          <span className="text-xs text-slate-400">Strict Append-Only Immutable Store</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">No audit events match your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Actor</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Details Summary</th>
                  <th className="py-3 px-6 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="text-xs">
                        <span className="font-medium text-slate-800">{log.actorEmail}</span>
                        <span className="block text-[11px] text-slate-400 capitalize">{log.actorRole.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getEntityBadge(
                          log.entityType
                        )}`}
                      >
                        {log.entityType}
                      </span>
                      {log.entityId && (
                        <span className="block text-[11px] font-mono text-slate-400 truncate max-w-[120px] mt-0.5">
                          {log.entityId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg transition-colors border border-indigo-200/60"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLogs.length)} of{' '}
              {filteredLogs.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-slate-700 font-semibold">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal with Before/After Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Audit Record Deep Inspection
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Action</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Actor Email</span>
                  <p className="font-medium text-slate-800 mt-0.5">{selectedLog.actorEmail}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Actor Role</span>
                  <p className="capitalize font-medium text-slate-800 mt-0.5">
                    {selectedLog.actorRole.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Timestamp</span>
                  <p className="text-slate-800 mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Entity Type</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.entityType}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Entity ID</span>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedLog.entityId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">IP Address</span>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedLog.ipAddress || '127.0.0.1'}</p>
                </div>
              </div>

              {/* Action Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Event Parameters &amp; Details</h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {/* State Diff Comparison */}
              {(selectedLog.beforeState || selectedLog.afterState) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                    State Mutation Diff (Before &rarr; After)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-rose-600 block mb-1">State Before Mutation:</span>
                      <pre className="p-3 bg-rose-50/60 border border-rose-200 text-rose-900 font-mono text-xs rounded-xl overflow-x-auto min-h-[100px]">
                        {selectedLog.beforeState
                          ? JSON.stringify(selectedLog.beforeState, null, 2)
                          : 'null (Initial Creation)'}
                      </pre>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-emerald-600 block mb-1">State After Mutation:</span>
                      <pre className="p-3 bg-emerald-50/60 border border-emerald-200 text-emerald-900 font-mono text-xs rounded-xl overflow-x-auto min-h-[100px]">
                        {selectedLog.afterState
                          ? JSON.stringify(selectedLog.afterState, null, 2)
                          : 'null (Entity Deleted)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
