import React, { useState, useEffect } from 'react'
import { Palette, Upload, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { brandingApi } from '../../services/api'
import useBrandingStore from '../../store/brandingStore'
import Spinner from '../../components/Spinner'

export default function BrandingPage() {
  const qc = useQueryClient()
  const { setBranding } = useBrandingStore()
  const [form, setForm] = useState({ name: '', logo_url: '', primary_color: '#1B2B4B' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    brandingApi.get()
      .then(r => {
        const d = r.data
        setForm({ name: d.name, logo_url: d.logo_url || '', primary_color: d.primary_color || '#1B2B4B' })
        if (d.logo_url) setPreview(`http://localhost:5001${d.logo_url}`)
      })
      .catch(() => toast.error('Failed to load branding'))
      .finally(() => setLoading(false))
  }, [])

  const uploadLogo = async e => {
    const file = e.target.files[0]; if (!file) return
    setPreview(URL.createObjectURL(file))
    try {
      const r = await brandingApi.uploadLogo(file)
      setForm(f => ({ ...f, logo_url: r.data.logo_url }))
      setPreview(r.data.logo_url)
      toast.success('Logo uploaded!')
    } catch { toast.error('Upload failed') }
    e.target.value = ''
  }

  const save = async () => {
    setSaving(true)
    try {
      const r = await brandingApi.update(form)
      const updated = r.data
      // Immediately update the global branding store so sidebar reflects changes
      setBranding({ name: updated.name || form.name, logo_url: updated.logo_url || form.logo_url })
      // Invalidate React Query cache so Layout refetches
      qc.invalidateQueries(['branding'])
      toast.success('Branding updated!')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
          <Palette size={20} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>White Label Branding</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Customize your institution's look</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Institution Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. ABC College" />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Logo</label>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              {preview
                ? <img src={preview} alt="logo" className="w-full h-full object-contain" onError={() => setPreview(null)} />
                : <GraduationCap size={24} style={{ color: 'var(--text-muted)' }} />
              }
            </div>
            <div className="flex-1 space-y-2">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm w-fit btn-outline">
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              </label>
              <input
                value={form.logo_url}
                onChange={e => { setForm({ ...form, logo_url: e.target.value }); setPreview(e.target.value) }}
                placeholder="Or paste image URL"
                className="input"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Primary Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-12 h-10 rounded-lg border cursor-pointer p-0.5" style={{ borderColor: 'var(--border)' }} />
            <input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} placeholder="#6366f1" className="input font-mono flex-1" />
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Preview</label>
          <div className="rounded-2xl p-6 flex flex-col items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: form.primary_color }}>
              {preview
                ? <img src={preview} alt="logo" className="w-8 h-8 object-contain" />
                : <GraduationCap size={22} className="text-white" />
              }
            </div>
            <p className="font-bold text-lg" style={{ color: form.primary_color }}>{form.name || 'Your Institution'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Education CRM · Sign in to continue</p>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5 justify-center">
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}
