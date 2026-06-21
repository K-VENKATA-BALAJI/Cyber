import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { BarChart3, TrendingUp, Shield, Cpu } from 'lucide-react'

// Threat evolution data (simulated, matches paper)
const EVOLUTION_DATA = [
  { year: '2018', complexity: 35, accuracy: 60 },
  { year: '2019', complexity: 42, accuracy: 65 },
  { year: '2020', complexity: 50, accuracy: 70 },
  { year: '2021', complexity: 58, accuracy: 75 },
  { year: '2022', complexity: 67, accuracy: 82 },
  { year: '2023', complexity: 75, accuracy: 87 },
  { year: '2024', complexity: 83, accuracy: 91 },
  { year: '2025', complexity: 91, accuracy: 93 },
]

// False positive reduction (simulated)
const FP_DATA = [
  { model: 'Rule-Based',    tp: 62, fp: 38 },
  { model: 'Signature',     tp: 74, fp: 26 },
  { model: 'Random Forest', tp: 89, fp: 11 },
  { model: 'DNN',           tp: 96, fp: 4  },
]

const tooltipStyle = {
  contentStyle: { background: '#0d1421', border: '1px solid #1a2744', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#e2e8f0' },
}

function ChartCard({ title, description, icon: Icon, children }) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-cyber-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-cyber-text-primary">{title}</h3>
          <p className="text-xs text-cyber-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function Reports() {
  const [perf, setPerf] = useState(null)
  const [rlRewards, setRlRewards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfRes, rlRes] = await Promise.all([
          axios.get('/api/performance'),
          axios.get('/api/rl/rewards'),
        ])
        setPerf(perfRes.data)
        const rewards = rlRes.data.rewards
        // Build smoothed curve data
        const rlData = rewards.map((val, idx) => ({
          episode: rlRes.data.episodes[idx],
          reward: parseFloat(val.toFixed(3)),
        }))
        setRlRewards(rlData)
      } catch {
        // backend not ready
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Build comparison bar chart data from performance metrics
  const comparisonData = perf
    ? ['accuracy', 'precision', 'recall', 'f1'].map(metric => ({
        metric: metric.charAt(0).toUpperCase() + metric.slice(1),
        'Random Forest': +(perf.models['Random Forest']?.[metric] * 100).toFixed(1),
        SVM: +(perf.models['SVM']?.[metric] * 100).toFixed(1),
        DNN: perf.models['DNN']?.accuracy > 0 ? +(perf.models['DNN']?.[metric] * 100).toFixed(1) : null,
      }))
    : []

  const models = perf?.models ?? {}

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-cyber-cyan" />
          <h1 className="text-2xl font-bold text-cyber-text-primary">Performance Reports</h1>
        </div>
        <p className="text-sm text-cyber-text-muted">
          AI model evaluation metrics · NSL-KDD dataset · {perf?.dataset?.train_size?.toLocaleString() ?? '125,973'} training samples
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-60 gap-3 text-cyber-text-muted">
          <div className="w-6 h-6 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
          Loading performance data...
        </div>
      )}

      {!loading && (
        <>
          {/* 2×2 chart grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Chart 1: Model comparison */}
            <ChartCard
              title="Model Performance Comparison"
              description="Accuracy · Precision · Recall · F1 across all models"
              icon={BarChart3}
            >
              {comparisonData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-cyber-text-muted">Train models to see data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comparisonData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                    <Bar dataKey="Random Forest" fill="#00d4ff" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="SVM" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    {perf?.models?.DNN?.accuracy > 0 && (
                      <Bar dataKey="DNN" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Chart 2: Threat evolution */}
            <ChartCard
              title="Threat Evolution vs AI Detection Accuracy"
              description="How AI detection has kept pace with growing threat complexity (2018–2025)"
              icon={TrendingUp}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={EVOLUTION_DATA} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}%`, n === 'complexity' ? 'Threat Complexity' : 'AI Accuracy']} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v === 'complexity' ? 'Threat Complexity' : 'AI Detection Accuracy'}</span>} />
                  <Line type="monotone" dataKey="complexity" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 3: False positive reduction */}
            <ChartCard
              title="False Positive Reduction with AI"
              description="True positives increase while false positives decrease as models improve"
              icon={Shield}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={FP_DATA} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" vertical={false} />
                  <XAxis dataKey="model" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}%`, n === 'tp' ? 'True Positives' : 'False Positives']} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v === 'tp' ? 'True Positives' : 'False Positives'}</span>} />
                  <Bar dataKey="tp" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="fp" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 4: RL learning curve */}
            <ChartCard
              title="Reinforcement Learning Agent — Learning Curve"
              description="Cumulative reward per episode showing the Q-learning agent improving over time"
              icon={Cpu}
            >
              {rlRewards.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-cyber-text-muted">Train models to see RL data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rlRewards} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                    <XAxis dataKey="episode" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Episode', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [v.toFixed(3), 'Avg Reward']} />
                    <Line type="monotone" dataKey="reward" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Model Performance Summary cards */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-cyber-text-primary mb-1">Model Performance Summary</h2>
            <p className="text-xs text-cyber-text-muted mb-5">
              Models trained on NSL-KDD dataset · {perf?.dataset?.train_size?.toLocaleString() ?? '—'} training samples · {perf?.dataset?.test_size?.toLocaleString() ?? '—'} test samples
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Random Forest', color: '#00d4ff', data: models['Random Forest'] },
                { name: 'SVM', color: '#8b5cf6', data: models['SVM'] },
                { name: 'Deep Neural Network', color: '#f59e0b', data: models['DNN'] },
              ].map(({ name, color, data }) => (
                <div key={name} className="bg-cyber-bg border border-cyber-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-semibold text-cyber-text-primary">{name}</span>
                  </div>
                  {data && data.accuracy > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Accuracy', val: data.accuracy },
                        { label: 'Precision', val: data.precision },
                        { label: 'Recall', val: data.recall },
                        { label: 'F1 Score', val: data.f1 },
                      ].map(({ label, val }) => (
                        <div key={label}>
                          <p className="text-xs text-cyber-text-muted mb-0.5">{label}</p>
                          <p className="text-lg font-bold" style={{ color }}>{(val * 100).toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-cyber-text-muted">Not trained yet · Run train.py</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
