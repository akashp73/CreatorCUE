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
      className="px-2 py-0.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
      {variable}
    </button>
  )
}

function TemplateCard({ tpl, onSend, onCopy }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{tpl.name}</p>
          {!expanded && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94a3b8' }}>{tpl.message_body}</p>}
          {expanded && (
            <div className="mt-2 p-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', color: '#f1f5f9' }}>
              {tpl.message_body}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#94a3b8' }}>
            <Eye size={14} />
          </button>
          <button onClick={() => onCopy(tpl.message_body)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#94a3b8' }}>
            <Copy size={14} />
          </button>
          <button onClick={() => onSend(tpl)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(37,211,102,0.15)', color: '#4ade80', border: '1px solid rgba(37,211,102,0.25)' }}>
            <Send size={11} /> Broadcast
          </button>
        </div>
      </div>
      {tpl.variables && JSON.parse(tpl.variables || '[]').length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {JSON.parse(tpl.variables).map(v => (
            <span key={v} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>{`{${v}}`}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white flex items-center gap-2"><MessageCircle size={16} style={{ color: '#25D366' }} /> Broadcast — {template.name}</h2>
          <button onClick={onClose} style={{ color: '#94a3b8' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Message preview */}
          <div className="p-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', color: '#f1f5f9', minHeight: 80 }}>
            {preview || template.message_body}
          </div>

          {/* Audience Filters */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>Target Audience</p>
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
            <p className="text-xs mt-2 font-semibold" style={{ color: '#10b981' }}>
              <Users size={11} className="inline mr-1" />{audienceCount} leads will receive this message
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5 justify-center">Cancel</button>
            <button onClick={send} disabled={sending || audienceCount === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: '#25D366', opacity: (sending || audienceCount === 0) ? 0.5 : 1 }}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white">New WhatsApp Template</h2>
          <button onClick={onClose} style={{ color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Template Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome Message" className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#94a3b8' }}>Message Body</label>
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

  const glassBg = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }

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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle size={20} style={{ color: '#25D366' }} /> WhatsApp Campaigns
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>Manage templates, broadcast to leads, and set auto-triggers</p>
        </div>
        <button onClick={() => setShowNewTpl(true)} className="btn-primary">
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Templates', value: templates.length, color: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
          { label: 'Sent Today', value: '—', color: '#25D366', glow: 'rgba(37,211,102,0.2)' },
          { label: 'Active Triggers', value: '0', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.glow}`, boxShadow: `0 0 20px ${s.glow}` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {['templates', 'auto-triggers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={activeTab === tab ? { background: '#6366f1', color: 'white' } : { color: '#94a3b8' }}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Template Hub */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={glassBg}>
              <MessageCircle size={40} style={{ color: '#334155', margin: '0 auto 12px' }} />
              <p className="text-white font-semibold">No templates yet</p>
              <p className="text-sm mt-1 mb-4" style={{ color: '#475569' }}>Create your first WhatsApp template</p>
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
        <div className="rounded-2xl p-6" style={glassBg}>
          <h3 className="text-sm font-bold mb-4 text-white">Auto-send WhatsApp when...</h3>
          <div className="space-y-3">
            {AUTO_TRIGGERS.map(trigger => (
              <div key={trigger.event} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl">{trigger.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{TRIGGER_LABELS[trigger.event]}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{trigger.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="input text-xs" style={{ width: 160 }}>
                    <option value="">Select template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button className="relative w-10 h-6 rounded-full transition-all" style={{ background: trigger.active ? '#10b981' : 'rgba(255,255,255,0.1)' }}>
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
