import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'
import { brandingApi } from '../services/api'
import {
  LayoutDashboard, Users, Flame, CheckSquare, Megaphone,
  Zap, IndianRupee, BarChart2, Settings, CreditCard,
  LogOut, Menu, X, GraduationCap, ChevronDown, ChevronRight,
  Bell,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/hot-leads', icon: Flame, label: 'Hot Leads' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/automations', icon: Zap, label: 'Automations' },
  { to: '/payments', icon: IndianRupee, label: 'Payments' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
]

const SETTINGS_NAV = [
  { to: '/settings/scoring', label: 'Score Rules' },
  { to: '/settings/email-templates', label: 'Email Templates' },
  { to: '/settings/whatsapp-templates', label: 'WhatsApp Templates' },
  { to: '/settings/users', label: 'Users' },
  { to: '/settings/branding', label: 'Branding' },
]

const ROLE_BADGE = {
  ADMIN: 'bg-indigo-500/20 text-indigo-300',
  MANAGER: 'bg-sky-500/20 text-sky-300',
  COUNSELLOR: 'bg-emerald-500/20 text-emerald-300',
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '')

function buildLogoUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_ORIGIN}${url}`
}

function NavItem({ to, icon: Icon, label, exact, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'text-white shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-white/8'
        }`
      }
      style={({ isActive }) => isActive ? { backgroundColor: '#4f46e5' } : {}}
    >
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  )
}

function Sidebar({ mobile = false, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith('/settings')
  )

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: () => brandingApi.get().then(r => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const logoSrc = buildLogoUrl(branding?.logo_url)
  const institutionName = branding?.name || user?.institution?.name || 'EduCRM'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0f172a', width: 240 }}>
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#ffffff12' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: '#4f46e5' }}
        >
          {logoSrc
            ? <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none' }} />
            : <GraduationCap size={20} className="text-white" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{institutionName}</p>
          <p className="text-slate-500 text-xs mt-0.5">Education CRM</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} onClick={mobile ? onClose : undefined} />
        ))}

        {/* Settings group */}
        <div className="pt-1">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <Settings size={17} />
            <span className="flex-1 text-left">Settings</span>
            {settingsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          {settingsOpen && (
            <div className="ml-8 mt-0.5 space-y-0.5 border-l pl-3" style={{ borderColor: '#ffffff15' }}>
              {SETTINGS_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={mobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'text-white bg-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/8'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: '#ffffff12' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: '#4f46e5' }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_BADGE[user?.role] || ''}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const PAGE_TITLES = {
    '/': 'Dashboard', '/leads': 'Leads', '/hot-leads': 'Hot Leads',
    '/tasks': 'Tasks', '/campaigns': 'Campaigns', '/automations': 'Automations',
    '/payments': 'Payments', '/reports': 'Reports', '/billing': 'Billing & Plans',
    '/settings/scoring': 'Score Rules', '/settings/email-templates': 'Email Templates',
    '/settings/whatsapp-templates': 'WhatsApp Templates',
    '/settings/users': 'Team Users', '/settings/branding': 'Branding',
  }
  const title = PAGE_TITLES[location.pathname] || 'EduCRM'

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center gap-4 shadow-sm">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 flex-1 tracking-tight">{title}</h1>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all relative">
            <Bell size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
