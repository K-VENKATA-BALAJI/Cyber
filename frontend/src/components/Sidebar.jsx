import { NavLink } from 'react-router-dom'
import { Shield, LayoutDashboard, Search, AlertTriangle, BarChart3, Cpu } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyze', icon: Search, label: 'Analyze' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-cyber-card border-r border-cyber-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-cyber-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div>
            <div className="text-sm font-bold text-cyber-text-primary tracking-wide">CyberShield AI</div>
            <div className="text-[10px] text-cyber-cyan font-medium tracking-widest uppercase">FYP 2026</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 group relative
              ${isActive
                ? 'text-cyber-cyan bg-cyber-cyan/8 border-l-2 border-cyber-cyan pl-[14px]'
                : 'text-cyber-text-muted hover:text-cyber-text-primary hover:bg-white/4'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyber-cyan' : 'text-cyber-text-muted group-hover:text-cyber-text-primary'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyber-border">
        <div className="flex items-center gap-2 px-2">
          <Cpu className="w-3.5 h-3.5 text-cyber-cyan/60" />
          <span className="text-[10px] text-cyber-text-muted tracking-wide">Powered by Deep Learning</span>
        </div>
        <div className="text-[10px] text-cyber-text-muted/50 px-2 mt-1">NSL-KDD · SHAP · TensorFlow</div>
      </div>
    </aside>
  )
}
