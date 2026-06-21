const BADGE_STYLES = {
  Normal:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DoS:     'bg-red-500/15 text-red-400 border-red-500/30',
  Probe:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  R2L:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  U2R:     'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Error:   'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export default function ThreatBadge({ type, size = 'sm' }) {
  const style = BADGE_STYLES[type] ?? BADGE_STYLES.Error
  const sz = size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium'
  return (
    <span className={`inline-flex items-center rounded-full border ${style} ${sz} whitespace-nowrap`}>
      {type}
    </span>
  )
}
