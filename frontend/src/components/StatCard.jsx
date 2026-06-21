const colorMap = {
  cyan:   { bg: 'bg-cyber-cyan/10',   border: 'border-cyber-cyan/20',   icon: 'text-cyber-cyan',   value: 'text-cyber-cyan' },
  green:  { bg: 'bg-cyber-green/10',  border: 'border-cyber-green/20',  icon: 'text-cyber-green',  value: 'text-cyber-green' },
  red:    { bg: 'bg-cyber-red/10',    border: 'border-cyber-red/20',    icon: 'text-cyber-red',    value: 'text-cyber-red' },
  amber:  { bg: 'bg-cyber-amber/10',  border: 'border-cyber-amber/20',  icon: 'text-cyber-amber',  value: 'text-cyber-amber' },
  purple: { bg: 'bg-cyber-purple/10', border: 'border-cyber-purple/20', icon: 'text-cyber-purple', value: 'text-cyber-purple' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan' }) {
  const c = colorMap[color] ?? colorMap.cyan

  return (
    <div className={`bg-cyber-card border border-cyber-border rounded-xl p-6 flex items-start justify-between hover:border-opacity-60 transition-all`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-cyber-text-muted uppercase tracking-wider mb-2">{title}</p>
        <p className={`text-3xl font-bold ${c.value} truncate`}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-cyber-text-muted mt-1 truncate">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0 ml-4`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      )}
    </div>
  )
}
