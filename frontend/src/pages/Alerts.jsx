import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { AlertTriangle, Download, Trash2, ChevronLeft, ChevronRight, Shield, Filter } from 'lucide-react'
import ThreatBadge from '../components/ThreatBadge'

const CATEGORIES = ['All', 'Normal', 'DoS', 'Probe', 'R2L', 'U2R']
const SEVERITIES = ['All', 'None', 'High', 'Critical']
const PAGE_SIZE = 10

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('All')
  const [sevFilter, setSevFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [clearing, setClearing] = useState(false)

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/alerts?limit=1000')
      setAlerts(res.data.alerts)
    } catch {
      // backend not running
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [])

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const catOk = catFilter === 'All' || a.prediction === catFilter
      const sevOk = sevFilter === 'All' || a.severity === sevFilter
      return catOk && sevOk
    })
  }, [alerts, catFilter, sevFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleClear = async () => {
    if (!window.confirm('Clear all alerts? This cannot be undone.')) return
    setClearing(true)
    try {
      await axios.delete('/api/alerts')
      setAlerts([])
    } catch {
      alert('Failed to clear alerts.')
    } finally {
      setClearing(false)
    }
  }

  const handleExport = () => {
    window.open('/api/alerts/export', '_blank')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-cyber-amber" />
            <h1 className="text-2xl font-bold text-cyber-text-primary">Alert History</h1>
          </div>
          <p className="text-sm text-cyber-text-muted">
            {alerts.length} total alerts · {alerts.filter(a => a.prediction !== 'Normal').length} threats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs border border-cyber-border hover:border-cyber-cyan/40 text-cyber-text-muted hover:text-cyber-cyan px-3 py-2 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || alerts.length === 0}
            className="flex items-center gap-2 text-xs border border-cyber-red/30 hover:bg-cyber-red/10 text-cyber-red px-3 py-2 rounded-lg transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 bg-cyber-card border border-cyber-border rounded-xl p-4">
        <Filter className="w-4 h-4 text-cyber-text-muted flex-shrink-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-cyber-text-muted mr-1">Category:</span>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCatFilter(c); setPage(1) }}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                catFilter === c
                  ? 'border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan'
                  : 'border-cyber-border text-cyber-text-muted hover:border-cyber-border/80'
              }`}
            >
              {c}
            </button>
          ))}
          <span className="text-xs text-cyber-text-muted ml-4 mr-1">Severity:</span>
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => { setSevFilter(s); setPage(1) }}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                sevFilter === s
                  ? 'border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber'
                  : 'border-cyber-border text-cyber-text-muted hover:border-cyber-border/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-cyber-text-muted">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-cyber-text-muted gap-3">
            <Shield className="w-10 h-10 text-cyber-border" />
            <p className="text-sm">{alerts.length === 0 ? 'No alerts logged yet' : 'No results match your filter'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-bg/50">
                    {['#', 'Timestamp', 'Type', 'Confidence', 'Severity', 'Action', 'Top Feature', 'Src Bytes', 'Dst Bytes', 'Protocol'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-cyber-text-muted font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {paginated.map((a, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-xs text-cyber-text-muted font-mono">{a.id}</td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted font-mono whitespace-nowrap">{a.timestamp}</td>
                      <td className="px-4 py-3"><ThreatBadge type={a.prediction} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-cyber-border rounded-full">
                            <div className="h-1.5 rounded-full bg-cyber-cyan" style={{ width: `${a.confidence}%` }} />
                          </div>
                          <span className="text-xs text-cyber-text-primary font-mono">{a.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{
                          color: a.severity === 'Critical' ? '#ef4444' : a.severity === 'High' ? '#f59e0b' : '#10b981'
                        }}>{a.severity}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted whitespace-nowrap">{a.action}</td>
                      <td className="px-4 py-3 text-xs text-cyber-cyan/80 font-mono">{a.top_feature}</td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted font-mono">{a.src_bytes}</td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted font-mono">{a.dst_bytes}</td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted">{a.protocol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-cyber-border">
              <span className="text-xs text-cyber-text-muted">
                Page {page} of {totalPages} · {filtered.length} alerts
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-cyber-border text-cyber-text-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i
                  if (p > totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded border text-xs transition-all ${
                        page === p
                          ? 'border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan'
                          : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text-primary'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded border border-cyber-border text-cyber-text-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
