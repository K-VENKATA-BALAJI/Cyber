import { useState, useRef } from 'react'
import axios from 'axios'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { Search, Zap, ShieldCheck, Upload, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import ThreatBadge from '../components/ThreatBadge'
import SHAPChart from '../components/SHAPChart'

const SEVERITY_STYLES = {
  None:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  High:     'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Critical: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const ACTION_COLOR = {
  None:     'text-cyber-green',
  High:     'text-cyber-amber',
  Critical: 'text-cyber-red',
}

const CONF_COLOR = (c) => c >= 90 ? '#10b981' : c >= 70 ? '#f59e0b' : '#ef4444'

const KEY_FEATURES = ['duration', 'src_bytes', 'dst_bytes', 'protocol_type', 'service', 'flag',
  'count', 'srv_count', 'serror_rate', 'rerror_rate']

function Spinner() {
  return <div className="w-5 h-5 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
}

function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {msg}
    </div>
  )
}

export default function Analyze() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFeatures, setShowFeatures] = useState(false)

  const [batchFile, setBatchFile] = useState(null)
  const [batchResult, setBatchResult] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState('')
  const fileRef = useRef()

  const analyze = async (sampleType) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await axios.post('/api/predict', { sample_type: sampleType })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Failed to connect to backend. Is uvicorn running?')
    } finally {
      setLoading(false)
    }
  }

  const handleBatch = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBatchFile(file)
    setBatchLoading(true)
    setBatchError('')
    setBatchResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post('/api/predict/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setBatchResult(res.data)
    } catch (e) {
      setBatchError(e.response?.data?.detail ?? 'Batch prediction failed.')
    } finally {
      setBatchLoading(false)
    }
  }

  const conf = result?.confidence ?? 0
  const radialData = [{ value: conf, fill: CONF_COLOR(conf) }]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cyber-text-primary mb-1">Analyze Network Traffic</h1>
        <p className="text-sm text-cyber-text-muted">Run AI threat detection on NSL-KDD network samples</p>
      </div>

      {/* ── Section 1: Single Sample ── */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-cyber-text-primary mb-4">Single Sample Analysis</h2>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => analyze('random')}
            disabled={loading}
            className="flex items-center gap-2 bg-cyber-cyan/10 border border-cyber-cyan/30 hover:bg-cyber-cyan/20 text-cyber-cyan text-sm font-medium px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <Spinner /> : <Search className="w-4 h-4" />}
            Random Sample
          </button>
          <button
            onClick={() => analyze('random_attack')}
            disabled={loading}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-sm font-medium px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <Spinner /> : <Zap className="w-4 h-4" />}
            Random Attack
          </button>
          <button
            onClick={() => analyze('random_normal')}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <Spinner /> : <ShieldCheck className="w-4 h-4" />}
            Random Normal
          </button>
        </div>

        {error && <ErrorBanner msg={error} />}

        {loading && (
          <div className="flex items-center justify-center h-40 gap-3 text-cyber-text-muted text-sm">
            <Spinner />
            Running AI analysis...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">
            {/* Result + Response side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Prediction card */}
              <div className="bg-cyber-bg border border-cyber-border rounded-xl p-5">
                <p className="text-xs text-cyber-text-muted uppercase tracking-wider mb-4">Detection Result</p>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <ThreatBadge type={result.prediction} size="lg" />
                    {result.actual_label && (
                      <p className="text-xs text-cyber-text-muted mt-1">
                        Actual: <span className="text-cyber-text-primary">{result.actual_label}</span>
                        {result.actual_label === result.prediction
                          ? <span className="text-cyber-green ml-1">✓ Correct</span>
                          : <span className="text-cyber-red ml-1">✗ Wrong</span>}
                      </p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <ResponsiveContainer width={80} height={80}>
                      <RadialBarChart
                        cx="50%" cy="50%"
                        innerRadius="60%" outerRadius="100%"
                        data={radialData}
                        startAngle={90} endAngle={-270}
                      >
                        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#1a2744' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1" style={{ color: CONF_COLOR(conf) }}>
                  {conf.toFixed(1)}%
                </div>
                <p className="text-xs text-cyber-text-muted mb-4">Confidence Score</p>
                <div className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-medium ${SEVERITY_STYLES[result.severity] ?? SEVERITY_STYLES.None}`}>
                  Severity: {result.severity}
                </div>

                {/* Key features */}
                <div className="mt-4 pt-4 border-t border-cyber-border grid grid-cols-2 gap-2">
                  {KEY_FEATURES.slice(0, 6).map(f => (
                    <div key={f} className="text-xs">
                      <span className="text-cyber-text-muted">{f}: </span>
                      <span className="text-cyber-text-primary font-mono">
                        {result.feature_values?.[f] !== undefined ? String(result.feature_values[f]).slice(0, 12) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response recommendation */}
              <div className="bg-cyber-bg border border-cyber-border rounded-xl p-5">
                <p className="text-xs text-cyber-text-muted uppercase tracking-wider mb-4">Automated Response</p>
                <div className={`text-xl font-bold mb-2 ${ACTION_COLOR[result.severity] ?? 'text-cyber-text-primary'}`}>
                  {result.action}
                </div>
                <div className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-medium mb-4 ${SEVERITY_STYLES[result.severity] ?? SEVERITY_STYLES.None}`}>
                  {result.severity} Severity
                </div>
                <p className="text-sm text-cyber-text-muted leading-relaxed mb-5">{result.description}</p>

                {/* Probability breakdown */}
                <p className="text-xs text-cyber-text-muted uppercase tracking-wider mb-3">Model Probabilities</p>
                <div className="space-y-2">
                  {Object.entries(result.probabilities ?? {}).map(([cat, prob]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-xs text-cyber-text-muted w-10">{cat}</span>
                      <div className="flex-1 h-1.5 bg-cyber-border rounded-full">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(prob * 100).toFixed(1)}%`,
                            background: cat === result.prediction ? CONF_COLOR(conf) : '#1a2744',
                          }}
                        />
                      </div>
                      <span className="text-xs text-cyber-text-muted font-mono w-10 text-right">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SHAP chart */}
            <div className="bg-cyber-bg border border-cyber-border rounded-xl p-5">
              <SHAPChart data={result.shap_values} />
            </div>

            {/* Raw features toggle */}
            <div className="bg-cyber-bg border border-cyber-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFeatures(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs text-cyber-text-muted hover:text-cyber-text-primary transition-colors"
              >
                <span className="font-medium uppercase tracking-wider">Raw Feature Values (all 41)</span>
                {showFeatures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showFeatures && (
                <div className="px-5 pb-5 grid grid-cols-3 gap-2 border-t border-cyber-border pt-4">
                  {Object.entries(result.feature_values ?? {}).slice(0, 41).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <span className="text-cyber-text-muted">{k}: </span>
                      <span className="text-cyber-text-primary font-mono">{String(v).slice(0, 14)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Batch Upload ── */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-cyber-text-primary mb-1">Batch CSV Analysis</h2>
        <p className="text-xs text-cyber-text-muted mb-5">Upload a CSV file with 41 NSL-KDD feature columns to analyze multiple connections at once.</p>

        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-cyber-border hover:border-cyber-cyan/40 rounded-xl p-10 text-center cursor-pointer transition-all group"
        >
          <Upload className="w-8 h-8 text-cyber-text-muted group-hover:text-cyber-cyan mx-auto mb-3 transition-colors" />
          <p className="text-sm text-cyber-text-muted group-hover:text-cyber-text-primary transition-colors">
            {batchFile ? batchFile.name : 'Click to upload CSV'}
          </p>
          <p className="text-xs text-cyber-text-muted/60 mt-1">NSL-KDD format · 41 feature columns</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleBatch} />
        </div>

        {batchError && <div className="mt-4"><ErrorBanner msg={batchError} /></div>}

        {batchLoading && (
          <div className="flex items-center justify-center h-24 gap-3 text-cyber-text-muted text-sm mt-4">
            <Spinner />
            Analyzing batch...
          </div>
        )}

        {batchResult && !batchLoading && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyber-cyan">{batchResult.total}</div>
                <div className="text-xs text-cyber-text-muted mt-1">Total Rows</div>
              </div>
              <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyber-red">{batchResult.threats}</div>
                <div className="text-xs text-cyber-text-muted mt-1">Threats Found</div>
              </div>
              <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyber-green">{batchResult.total - batchResult.threats}</div>
                <div className="text-xs text-cyber-text-muted mt-1">Normal Traffic</div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-cyber-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border bg-cyber-bg">
                    {['Row', 'Prediction', 'Confidence', 'Severity', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-cyber-text-muted font-medium uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/50">
                  {batchResult.results.map((r, i) => (
                    <tr key={i} className="hover:bg-white/2">
                      <td className="px-4 py-3 text-xs text-cyber-text-muted font-mono">{r.row}</td>
                      <td className="px-4 py-3"><ThreatBadge type={r.prediction} /></td>
                      <td className="px-4 py-3 text-xs text-cyber-text-primary font-mono">{r.confidence}%</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${SEVERITY_STYLES[r.severity] ? '' : ''}`}
                          style={{ color: r.severity === 'Critical' ? '#ef4444' : r.severity === 'High' ? '#f59e0b' : '#10b981' }}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-cyber-text-muted">{r.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
