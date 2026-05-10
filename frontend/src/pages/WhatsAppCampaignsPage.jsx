import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Send, MessageCircle, Users, Zap, X, ChevronDown, Eye, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { waTplApi, commsApi, leadsApi } from '../services/api'

const PRESET_VARIABLES = ['{Student_Name}', '{Course}', '{Fee}', '{Date}', '{Institute_Name}', '{Phone}']
const TRIGGER_EVENTS = ['LEAD_CREATED', 'STATUS_CHANGED_TO_ENROLLED', 'STATUS_CHANGED_TO_APPLIED', 'FOLLOW_UP_DUE']
const TRIGGER_LABELS = {
  LEAD_CREATED: 'When new lead is created',
  STATUS_CHANGED_TO_ENROLLED: 'When lead is enrolled',
  STATUS_CHANGED_TO_APPLIED: 'When lead applies',
  FOLLOW_UP_DUE: 'When follow-up is due',
}

function TemplatePill({ variable, onInsert }) {
  return (
    <button onClick={() => onInsert(variable)}
      className="px-2 py-0.5 rounded-full text-xs font-semibold transition-all"
      style={{ background: 'rgba(79,70,229,0.08)', color: '#4f46e5', border: '1px solid rgba(79,70,229,0.2)' }}>
      {variable}
    </button>
  )
}

function TemplateCard({ tpl, onSend, onCopy }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tpl.name}</p>
          {!expanded && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{tpl.message_body}</p>}
          {expanded && (
            <div className="mt-2 p-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.15)', color: 'var(--text-primary)' }}>
              {tpl.message_body}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Eye size={14} />
          </button>
          <button onClick={() => onCopy(tpl.message_body)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Copy size={14} />
          </button>
          <button onClick={() => onSend(tpl)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}>
            <Send size={11} /> Broadcast
          </button>
        </div>
      </div>
      {tpl.variables && JSON.parse(tpl.variables || '[]').length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {JSON.parse(tpl.variables).map(v => (
            <span key={v} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(234,179,8,0.1)', color: '#92400e' }}>{`{${v}}`}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function BroadcastModal({ template, onClose }) {
  const [filters, setFilters] = useState({ status: '', enrollment_stage: '', source: '' })
  const [preview, setPreview] = useState('')
  const [sending, setSending] = useState(false)
  const [previewVars, setPreviewVars] = useState({ Student_Name: 'John Doe', Course: 'MBA', Fee: '₹50,000' })

  const { data: audienceData } = useQuery({
    queryKey: ['wa-audience', filters],
    queryFn: () => leadsApi.getAll({ ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)), limit: 1000 }).then(r => r.data),
  })
  const audienceCount = audienceData?.pagination?.total || audienceData?.data?.length || 0

  const getPreview = () => {
    let msg = template.message_body
    Object.entries(previewVars).forEach(([k, v]) => { msg = msg.replace(new RegExp(`{${k}}`, 'g'), v) })
    setPreview(msg)
  }

  const send = async () => {
    const leads = audienceData?.data || audienceData?.leads || []
    if (leads.length === 0) return toast.error('No leads in audience')
    setSending(true)
    let sent = 0
    for (const lead of leads) {
      try {
        let msg = template.message_body
        msg = msg.replace(/{Student_Name}/g, lead.name)
        msg = msg.replace(/{Course}/g, lead.course_interested || 'your course')
        await commsApi.sendWhatsApp({ lead_id: lead.id, template_id: template.id, message: msg, phone: lead.phone })
        sent++
      } catch { /* skip failed */ }
    }
    toast.success(`Sent to ${sent} leads`)
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-xl rounded-2xl p-6" style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><MessageCircle size={16} style={{ color: '#16a34a' }} /> Broadcast — {template.name}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Message preview */}
          <div className="p-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.15)', color: 'var(--text-primary)', minHeight: 80 }}>
            {preview || template.message_body}
          </div>

          {/* Audience Filters */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Target Audience</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'status', opts: ['', 'NEW', 'CONTACTED', 'APPLIED', 'ENROLLED', 'LOST'], placeholder: 'All statuses' },
                { key: 'enrollment_stage', opts: ['', 'NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED'], placeholder: 'All stages' },
                { key: 'source', opts: ['', 'FACEBOOK', 'GOOGLE', 'WEBSITE', 'REFERRAL', 'WALK_IN'], placeholder: 'All sources' },
              ].map(({ key, opts, placeholder }) => (
                <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))} className="input text-xs">
                  <option value="">{placeholder}</option>
                  {opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
            </div>
            <p className="text-xs mt-2 font-semibold" style={{ color: '#059669' }}>
              <Users size={11} className="inline mr-1" />{audienceCount} leads will receive this message
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5 justify-center">Cancel</button>
            <button onClick={send} disabled={sending || audienceCount === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: '#16a34a', opacity: (sending || audienceCount === 0) ? 0.5 : 1 }}>
              <Send size={14} /> {sending ? 'Sending...' : `Send to ${audienceCount} leads`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewTemplateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', message_body: '' })
  const [saving, setSaving] = useState(false)

  const insertVar = (variable) => {
    setForm(f => ({ ...f, message_body: f.message_body + variable }))
  }

  const save = async () => {
    if (!form.name || !form.message_body) return toast.error('Fill all fields')
    setSaving(true)
    try {
      const vars = PRESET_VARIABLES.filter(v => form.message_body.includes(v)).map(v => v.replace(/[{}]/g, ''))
      await waTplApi.create({ ...form, variables: JSON.stringify(vars) })
      toast.success('Template saved!')
      onCreated()
      onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>New WhatsApp Template</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Template Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome Message" className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Message Body</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {PRESET_VARIABLES.map(v => <TemplatePill key={v} variable={v} onInsert={insertVar} />)}
            </div>
            <textarea
              value={form.message_body}
              onChange={e => setForm({ ...form, message_body: e.target.value })}
              placeholder={`Hi {Student_Name}, your enquiry for {Course} has been received...`}
              rows={5}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5 justify-center">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2.5 justify-center">
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppCampaignsPage() {
  const qc = useQueryClient()
  const [broadcastTpl, setBroadcastTpl] = useState(null)
  const [showNewTpl, setShowNewTpl] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')

  const { data: templates = [] } = useQuery({ queryKey: ['wa-templates'], queryFn: () => waTplApi.getAll().then(r => r.data) })

  const AUTO_TRIGGERS = [
    { event: 'LEAD_CREATED', desc: 'Send welcome message when a new lead is captured', icon: '👋', active: false },
    { event: 'STATUS_CHANGED_TO_ENROLLED', desc: 'Send congratulations when lead is enrolled', icon: '🎓', active: false },
    { event: 'STATUS_CHANGED_TO_APPLIED', desc: 'Send confirmation when lead applies', icon: '📋', active: false },
    { event: 'FOLLOW_UP_DUE', desc: 'Send reminder when follow-up is due', icon: '⏰', active: false },
  ]

  return (
    <div className="space-y-6">
      {broadcastTpl && <BroadcastModal template={broadcastTpl} onClose={() => setBroadcastTpl(null)} />}
      {showNewTpl && <NewTemplateModal onClose={() => setShowNewTpl(false)} onCreated={() => qc.invalidateQueries(['wa-templates'])} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <MessageCircle size={20} style={{ color: '#16a34a' }} /> WhatsApp Campaigns
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage templates, broadcast to leads, and set auto-triggers</p>
        </div>
        <button onClick={() => setShowNewTpl(true)} className="btn-primary">
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Templates', value: templates.length, color: '#4f46e5' },
          { label: 'Sent Today', value: '—', color: '#16a34a' },
          { label: 'Active Triggers', value: '0', color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f3f4f6' }}>
        {['templates', 'auto-triggers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={activeTab === tab
              ? { background: '#ffffff', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: 'var(--text-secondary)' }}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Template Hub */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="card p-12 text-center">
              <MessageCircle size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No templates yet</p>
              <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>Create your first WhatsApp template</p>
              <button onClick={() => setShowNewTpl(true)} className="btn-primary mx-auto">
                <Plus size={14} /> Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onSend={t => setBroadcastTpl(t)}
                  onCopy={msg => { navigator.clipboard.writeText(msg); toast.success('Copied!') }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto Triggers */}
      {activeTab === 'auto-triggers' && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>Auto-send WhatsApp when...</h3>
          <div className="space-y-3">
            {AUTO_TRIGGERS.map(trigger => (
              <div key={trigger.event} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#fafafa', border: '1px solid #f3f4f6' }}>
                <span className="text-2xl">{trigger.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{TRIGGER_LABELS[trigger.event]}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{trigger.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="input text-xs" style={{ width: 160 }}>
                    <option value="">Select template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button className="relative w-10 h-6 rounded-full transition-all" style={{ background: trigger.active ? '#059669' : '#e5e7eb' }}>
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ transform: trigger.active ? 'translateX(16px)' : 'translateX(0)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
