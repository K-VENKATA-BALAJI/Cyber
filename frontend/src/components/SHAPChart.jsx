import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-lg p-3 text-xs">
        <p className="text-cyber-text-primary font-semibold mb-1">{d.feature}</p>
        <p className="text-cyber-text-muted">SHAP: <span className={d.shap_value >= 0 ? 'text-cyber-red' : 'text-cyber-green'}>{d.shap_value?.toFixed(4)}</span></p>
        <p className="text-cyber-text-muted">Feature value: <span className="text-cyber-text-primary">{d.value?.toFixed(4)}</span></p>
      </div>
    )
  }
  return null
}

export default function SHAPChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-cyber-text-muted text-sm">
        No SHAP data available
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-cyber-text-primary">AI Explanation — Why This Decision?</h3>
          <p className="text-xs text-cyber-text-muted mt-0.5">
            <span className="text-cyber-red">Red bars</span> push toward attack · <span className="text-cyber-green">Green bars</span> push toward normal
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 130, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#1a2744' }}
            tickFormatter={v => v.toFixed(3)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={125}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1a2744' }} />
          <ReferenceLine x={0} stroke="#1a2744" strokeWidth={1} />
          <Bar dataKey="shap_value" radius={[0, 3, 3, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.shap_value >= 0 ? '#ef4444' : '#10b981'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
