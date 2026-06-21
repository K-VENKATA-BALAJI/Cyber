import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Activity, ShieldAlert, ShieldCheck, Zap,
  CheckCircle2, Shield, RefreshCw
} from 'lucide-react'
import StatCard from '../components/StatCard'
import ThreatBadge from '../components/ThreatBadge'

const PIE_COLORS = {
  Normal: '#10b981',
  DoS: '#ef4444',
  Probe: '#f59e0b',
  R2L: '#f97316',
  U2R: '#8b5cf6',
}

const SEVERITY_COLORS = {
  None: 'text-cyber-green',
  High: 'text-cyber-amber',
  Critical: 'text-cyber-red',
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-cyber-text-muted text-sm font-mono">
      {time.toLocaleString('en-IN', { hour12: false })}
    </span>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, threats: 0, by_category: {}, by_severity: {} })
  const [alerts, setAlerts] = useState([])
  const [modelStatus, setModelStatus] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes, statusRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/alerts?limit=10'),
        axios.get('/api/models/status'),
      ])
      setStats(statsRes.data)
      setAlerts(alertsRes.data.alerts)
      setModelStatus(statusRes.data)
    } catch {
      // Backend may not be running yet
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const pieData = Object.entries(stats.by_category || {})
    .filter(([k]) => k !== 'undefined')
    .map(([name, value]) => ({ name, value }))

  const topAttack = Object.entries(stats.by_category || {})
    .filter(([k]) => k !== 'Normal')
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None'

  const statusItems = [
    { label: 'Models Loaded', ok: modelStatus.trained, key: 'rf' },
    { label: 'XAI Active', ok: modelStatus.rf, key: 'xai' },
    { label: 'RL Agent Online', ok: modelStatus.rl, key: 'rl' },
    { label: 'CSV Logging Active', ok: true, key: 'csv' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-text-primary">Threat Intelligence Dashboard</h1>
            <span className="flex items-center gap-1.5 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-xs px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />
              Live Monitoring
            </span>
          </div>
          <LiveClock />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-xs text-cyber-text-muted hover:text-cyber-cyan border border-cyber-border hover:border-cyber-cyan/40 px-3 py-2 rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Scanned" value={stats.total} subtitle="Network packets analyzed" icon={Activity} color="cyan" />
        <StatCard title="Threats Detected" value={stats.threats} subtitle="Malicious traffic found" icon={ShieldAlert} color="red" />
        <StatCard title="Normal Traffic" value={stats.total - stats.threats} subtitle="Safe connections" icon={ShieldCheck} color="green" />
        <StatCard title="Top Attack Type" value={topAttack} subtitle="Most frequent threat" icon={Zap} color="amber" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Recent alerts table */}
        <div className="col-span-3 bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyber-text-primary">Recent Alerts</h2>
            <span className="text-xs text-cyber-text-muted">{alerts.length} shown</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-cyber-text-muted gap-3">
              <Shield className="w-10 h-10 text-cyber-border" />
              <p className="text-sm">No threats detected yet</p>
              <p className="text-xs">Go to Analyze to run your first scan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border">
                    {['Time', 'Type', 'Confidence', 'Severity', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-cyber-text-muted font-medium uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/50">
                  {alerts.map((a, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-xs text-cyber-text-muted font-mono whitespace-nowrap">
                        {String(a.timestamp).slice(11, 19)}
                      </td>
                      <td className="px-4 py-3"><ThreatBadge type={a.prediction} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-cyber-border rounded-full w-16">
                            <div
                              className="h-1.5 rounded-full bg-cyber-cyan"
                              style={{ width: `${a.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-cyber-text-primary font-mono">{a.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${SEVERITY_COLORS[a.severity] ?? 'text-cyber-text-muted'}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted">{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="col-span-2 bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-cyber-text-primary mb-1">Threat Distribution</h2>
          <p className="text-xs text-cyber-text-muted mb-4">Breakdown by attack category</p>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-cyber-text-muted gap-2">
              <Activity className="w-8 h-8 text-cyber-border" />
              <p className="text-xs">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ background: '#0d1421', border: '1px solid #1a2744', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* System status */}
      <div className="grid grid-cols-4 gap-4">
        {statusItems.map(({ label, ok }) => (
          <div key={label} className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok ? 'bg-cyber-green/10' : 'bg-cyber-text-muted/10'}`}>
              <CheckCircle2 className={`w-4 h-4 ${ok ? 'text-cyber-green' : 'text-cyber-text-muted'}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-cyber-text-primary">{label}</p>
              <p className={`text-[10px] font-medium ${ok ? 'text-cyber-green' : 'text-cyber-text-muted'}`}>
                {ok ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
