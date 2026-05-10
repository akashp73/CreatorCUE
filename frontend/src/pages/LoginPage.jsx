import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { brandingApi } from '../services/api'

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '')
function buildLogoUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_ORIGIN}${url}`
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState(null)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  useEffect(() => {
    brandingApi.get().then(r => setBranding(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const logoSrc = buildLogoUrl(branding?.logo_url)
  const institutionName = branding?.name || 'EduCRM'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Left panel (55%) — Black with taglines ── */}
      <div style={{
        width: '55%',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        {/* Logo top-left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div style={{ width: 32, height: 32, background: '#ffffff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={18} color="#000000" />
          </div>
          <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 16 }}>{institutionName}</span>
        </div>

        {/* Main taglines — center */}
        <div style={{ position: 'relative' }}>
          <h1 style={{ color: '#ffffff', fontSize: 64, fontWeight: 200, lineHeight: 1.05, letterSpacing: '-2px', margin: 0 }}>
            Enroll more.<br />
            Follow up faster.<br />
            <span style={{ fontWeight: 300, color: '#d1d5db' }}>Grow smarter.</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, marginTop: 28, maxWidth: 420, lineHeight: 1.6, fontWeight: 400 }}>
            The next generation Education CRM with AI-powered lead scoring and automation.
          </p>
        </div>

        {/* Bottom credit */}
        <p style={{ color: '#374151', fontSize: 12, position: 'relative' }}>An initiative by Creator CUE</p>
      </div>

      {/* ── Right panel (45%) — White with form ── */}
      <div style={{
        width: '45%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
      }}>
        {/* Top: Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          {logoSrc
            ? <img src={logoSrc} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
            : <div style={{ width: 28, height: 28, background: '#000000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={16} color="#ffffff" />
              </div>
          }
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{institutionName}</span>
        </div>

        {/* Center: Form */}
        <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Welcome!</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  outline: 'none', fontFamily: 'inherit', color: '#111827',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#000000'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px', fontSize: 14,
                    border: '1px solid #e5e7eb', borderRadius: 8,
                    outline: 'none', fontFamily: 'inherit', color: '#111827',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#000000'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: 4,
                background: loading ? '#4b5563' : '#000000',
                color: '#ffffff', fontWeight: 500, fontSize: 14,
                border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'opacity 0.15s',
              }}>
              {loading ? 'Signing in…' : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, padding: '14px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>Demo Credentials</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>Admin: <span style={{ fontFamily: 'monospace', color: '#111827' }}>admin@demo.com</span></p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>Counsellor: <span style={{ fontFamily: 'monospace', color: '#111827' }}>counsellor@demo.com</span></p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>Password: <span style={{ fontFamily: 'monospace', color: '#111827' }}>Demo@1234</span></p>
          </div>
        </div>

        {/* Bottom copyright */}
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Copyright © EduCRM 2026 · Initiative by Creator CUE
        </p>
      </div>
    </div>
  )
}
