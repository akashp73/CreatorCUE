import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import useBrandingStore from '../store/brandingStore'
import { brandingApi } from '../services/api'
import {
  LayoutDashboard, Users, Flame, CheckSquare, Megaphone,
  Zap, IndianRupee, BarChart2, Settings, CreditCard,
  LogOut, Menu, X, GraduationCap, ChevronDown, ChevronRight,
  Bell, MessageSquare, Sun, Moon,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/hot-leads', icon: Flame, label: 'Hot Leads' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/whatsapp-campaigns', icon: MessageSquare, label: 'WhatsApp' },
  { to: '/automations', icon: Zap, label: 'Automations' },
  { to: '/payments', icon: IndianRupee, label: 'Payments' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
]

const SETTINGS_NAV = [
  { to: '/settings/scoring', label: 'Score Rules' },
  { to: '/settings/email-templates', label: 'Email Templates' },
  { to: '/settings/whatsapp-templates', label: 'WhatsApp Templates' },
  { to: '/settings/users', label: 'Team' },
  { to: '/settings/branding', label: 'Branding' },
  { to: '/settings/assignment', label: 'Lead Assignment' },
  { to: '/settings/webhooks', label: 'Webhooks & API' },
]

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '')
function buildLogoUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_ORIGIN}${url}`
}

function NavItem({ to, icon: Icon, label, exact, onClick, isDark }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-white hover:bg-white/6' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
      style={({ isActive }) => isActive ? {
        background: '#6366f1',
        boxShadow: '0 0 16px rgba(99,102,241,0.3)',
      } : {}}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  )
}

function Sidebar({ mobile = false, onClose, isDark }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'))

  const { setBranding } = useBrandingStore()
  const globalBranding = useBrandingStore(s => ({ name: s.name, logo_url: s.logo_url }))

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: () => brandingApi.get().then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => {
    if (branding) setBranding(branding)
  }, [branding, setBranding])

  const logoSrc = buildLogoUrl(globalBranding.logo_url || branding?.logo_url)
  const institutionName = globalBranding.name || branding?.name || user?.institution?.name || 'EduCRM'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const subLinkClass = ({ isActive }) => `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
    isActive
      ? 'text-white bg-indigo-500/20'
      : isDark
        ? 'text-slate-400 hover:text-white hover:bg-white/6'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
  }`

  return (
    <div className="flex flex-col h-full" style={{
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border)',
      width: 240,
      transition: 'background 0.2s',
    }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}>
          {logoSrc
            ? <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
            : <GraduationCap size={18} className="text-white" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{institutionName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Education CRM</p>
        </div>
        {mobile && (
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:opacity-80">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => <NavItem key={item.to} {...item} onClick={mobile ? onClose : undefined} isDark={isDark} />)}
        <div className="pt-1">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Settings size={16} />
            <span className="flex-1 text-left">Settings</span>
            {settingsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {settingsOpen && (
            <div className="ml-7 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
              {SETTINGS_NAV.map(item => (
                <NavLink key={item.to} to={item.to} onClick={mobile ? onClose : undefined} className={subLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
              {user?.role}
            </span>
          </div>
          <button onClick={handleLogout} className="hover:text-red-400 transition-colors" style={{ color: 'var(--text-muted)' }} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

const PAGE_TITLES = {
  '/': 'Dashboard', '/leads': 'Leads', '/hot-leads': 'Hot Leads',
  '/tasks': 'Tasks', '/campaigns': 'Campaigns', '/whatsapp-campaigns': 'WhatsApp Campaigns',
  '/automations': 'Automations', '/payments': 'Payments', '/reports': 'Reports', '/billing': 'Billing & Plans',
  '/settings/scoring': 'Score Rules', '/settings/email-templates': 'Email Templates',
  '/settings/whatsapp-templates': 'WhatsApp Templates',
  '/settings/users': 'Team', '/settings/branding': 'Branding',
  '/settings/assignment': 'Lead Assignment', '/settings/webhooks': 'Webhooks & API',
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { isDark, toggle } = useThemeStore()
  const title = PAGE_TITLES[location.pathname] || 'EduCRM'

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar isDark={isDark} />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">
            <Sidebar mobile isDark={isDark} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-4 lg:px-6 h-14 flex items-center gap-4"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.2s',
          }}>
          <button className="lg:hidden hover:opacity-80" style={{ color: 'var(--text-muted)' }} onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="text-base font-semibold flex-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: isDark ? '#f59e0b' : '#6366f1',
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <Bell size={16} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
