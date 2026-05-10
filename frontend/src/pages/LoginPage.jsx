import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Left panel — Pure Black ── */}
      <div style={{
        width: '55%',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle dot grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Top left: EduCRM text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <img src="/educrm-logo.svg" alt="EduCRM" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>EduCRM</span>
        </div>

        {/* Center: Taglines */}
        <div style={{ position: 'relative' }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: 'clamp(40px, 5vw, 68px)',
            fontWeight: 200,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            margin: '0 0 28px',
          }}>
            Enroll more.<br />
            Follow up faster.<br />
            <span style={{ fontWeight: 300, color: '#9ca3af' }}>Grow smarter.</span>
          </h1>
          <p style={{ color: '#4b5563', fontSize: 15, maxWidth: 400, lineHeight: 1.65, fontWeight: 400, margin: 0 }}>
            The next generation Education CRM with AI-powered lead scoring and automation.
          </p>
        </div>

        {/* Bottom credit */}
        <p style={{ color: '#374151', fontSize: 12, position: 'relative', margin: 0 }}>
          An initiative by Creator CUE
        </p>
      </div>

      {/* ── Right panel — Pure White ── */}
      <div style={{
        width: '45%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 60px',
      }}>
        {/* Top right: Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <img src="/educrm-logo.svg" alt="EduCRM" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', letterSpacing: '-0.3px' }}>EduCRM</span>
        </div>

        {/* Center: Form */}
        <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Welcome!</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 }}>Email Address</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@demo.com"
                style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', fontFamily: 'inherit', color: '#111827', boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onFocus={e => { e.target.style.borderColor = '#000'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 44px 11px 14px', fontSize: 14, border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', fontFamily: 'inherit', color: '#111827', boxSizing: 'border-box', background: '#fff' }}
                  onFocus={e => { e.target.style.borderColor = '#000'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', marginTop: 4,
                background: loading ? '#374151' : '#000000', color: '#ffffff',
                fontWeight: 600, fontSize: 15, border: 'none', borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'background 0.15s', letterSpacing: '-0.2px',
              }}>
              {loading ? 'Signing in…' : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Demo Credentials</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { role: 'Admin', email: 'admin@demo.com' },
                { role: 'Counsellor', email: 'counsellor@demo.com' },
              ].map(c => (
                <div key={c.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.role}</span>
                  <button
                    onClick={() => setForm({ email: c.email, password: 'Demo@1234' })}
                    style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', background: '#f3f4f6', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
                    {c.email}
                  </button>
                </div>
              ))}
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Password: <span style={{ fontFamily: 'monospace', color: '#374151' }}>Demo@1234</span></p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
          Copyright © EduCRM 2026 · Initiative by Creator CUE
        </p>
      </div>
    </div>
  )
}
