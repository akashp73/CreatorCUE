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
  LogOut, Menu, X, GraduationCap, MessageSquare, Sun, Moon,
  ChevronDown, ChevronRight, Bell,
} from 'lucide-react'

const NAV_TOP = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/hot-leads', icon: Flame, label: 'Hot Leads' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
]
const NAV_MID = [
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/whatsapp-campaigns', icon: MessageSquare, label: 'WhatsApp' },
  { to: '/automations', icon: Zap, label: 'Automations' },
]
const NAV_BOT = [
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

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink to={to} end={exact}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'font-semibold' : ''}`}
      style={({ isActive }) => isActive
        ? { background: '#ffffff', color: '#000000' }
        : { color: '#9ca3af' }
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{ color: isActive ? '#000000' : '#6b7280' }} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function NavDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '6px 12px' }} />
}

function Sidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/settings'))

  const { setBranding } = useBrandingStore()
  const globalBranding = useBrandingStore()

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: () => brandingApi.get().then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => { if (branding) setBranding(branding) }, [branding])

  const logoSrc = buildLogoUrl(globalBranding.logo_url || branding?.logo_url)
  const institutionName = globalBranding.name || branding?.name || user?.institution?.name || 'EduCRM'
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const handleLogout = async () => { await logout(); navigate('/login') }

  const subLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'text-white bg-white/15 font-semibold' : 'text-gray-500 hover:text-gray-300'}`

  return (
    <div className="flex flex-col h-full" style={{ background: '#000000', width: 280 }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: '#ffffff' }}>
          {logoSrc
            ? <img src={logoSrc} alt="logo" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
            : <GraduationCap size={16} style={{ color: '#000000' }} />
          }
        </div>
        <span className="text-white font-semibold text-base">{institutionName}</span>
        {mobile && <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white"><X size={18} /></button>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV_TOP.map(item => <NavItem key={item.to} {...item} />)}
        <NavDivider />
        {NAV_MID.map(item => <NavItem key={item.to} {...item} />)}
        <NavDivider />
        {NAV_BOT.map(item => <NavItem key={item.to} {...item} />)}

        {/* Settings */}
        <NavDivider />
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: '#9ca3af' }}
        >
          <Settings size={15} style={{ color: '#6b7280' }} />
          <span className="flex-1 text-left">Settings</span>
          {settingsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {settingsOpen && (
          <div className="ml-6 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {SETTINGS_NAV.map(item => (
              <NavLink key={item.to} to={item.to} className={subLinkClass}>{item.label}</NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: '#1f1f1f', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: '#6b7280' }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="hover:opacity-80 transition-opacity" style={{ color: '#6b7280' }} title="Logout">
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
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-fit">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-14 px-5 flex items-center gap-4"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
          <button className="lg:hidden" style={{ color: 'var(--text-secondary)' }} onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="text-base font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>{title}</h1>

          {/* Theme toggle */}
          <button onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Bell size={15} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-6" style={{ background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
