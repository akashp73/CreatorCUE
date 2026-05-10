import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Eye, EyeOff, CheckCircle, Loader2, Webhook, FlaskConical, Link } from 'lucide-react'
import toast from 'react-hot-toast'
import { institutionApi, webhooksApi } from '../../services/api'
import Spinner from '../../components/Spinner'

// Derive the base webhook URL from the env var
const RAW_BASE = import.meta.env.VITE_API_URL || '/api'
const API_BASE = RAW_BASE.startsWith('http')
  ? RAW_BASE.replace(/\/api\/?$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '')
const WH_BASE = `${API_BASE}/api/webhooks`

const WEBHOOKS = [
  {
    id: 'lead',
    title: 'Lead Capture',
    description: 'Creates a new lead from any external form or integration.',
    method: 'POST',
    path: '/lead',
    canTest: true,
    canCustomSource: true,
    payload: {
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@example.com',
      city: 'Mumbai',
      course_interested: 'MBA',
      source: 'WEBSITE',
    },
    response: { status: 'created', lead_id: '[uuid]', lead_name: 'Rahul Sharma' },
  },
  {
    id: 'activity',
    title: 'Activity Tracking',
    description: 'Records a lead activity to update their engagement score.',
    method: 'POST',
    path: '/activity',
    canTest: false,
    payload: {
      lead_id: '[lead-uuid]',
      activity_type: 'video_watched',
      idempotency_key: 'optional-unique-key',
    },
    response: { status: 'processed', new_score: 75 },
  },
  {
    id: 'facebook',
    title: 'Facebook Leads',
    description: 'Receives Facebook Lead Ads form submissions automatically.',
    method: 'POST',
    path: '/facebook',
    canTest: false,
    payload: {
      entry: [{
        changes: [{
          value: {
            leadgen_id: 'fb-lead-123',
            field_data: [
              { name: 'full_name', values: ['Priya Patel'] },
              { name: 'email', values: ['priya@example.com'] },
              { name: 'phone_number', values: ['9876543210'] },
            ],
          },
        }],
      }],
    },
    response: { status: 'created', lead_id: '[uuid]', lead_name: 'Priya Patel' },
  },
]

function CopyButton({ text, size = 14 }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {copied
        ? <CheckCircle size={size} style={{ color: '#059669' }} />
        : <Copy size={size} />
      }
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function WebhookCard({ wh, apiKey }) {
  const [customSource, setCustomSource] = useState('')
  const [showGenerated, setShowGenerated] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const sourceParam = wh.canCustomSource && customSource.trim()
    ? `?source=${encodeURIComponent(customSource.trim())}`
    : ''
  const url = `${WH_BASE}${wh.path}${sourceParam}`

  // Merge custom source into the displayed example payload
  const displayPayload = wh.canCustomSource
    ? { ...wh.payload, source: customSource.trim() || wh.payload.source }
    : wh.payload

  const handleTest = async () => {
    if (!apiKey) return toast.error('API key not loaded yet')
    setTesting(true)
    setTestResult(null)
    try {
      const r = await webhooksApi.testLead(apiKey)
      setTestResult({ ok: true, data: r.data })
      toast.success(`Test lead created: ${r.data.lead_name || r.data.lead_id}`)
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Test failed'
      setTestResult({ ok: false, msg })
      if (err.response?.data?.status === 'duplicate') {
        setTestResult({ ok: true, data: err.response.data })
        toast.success('Test ran — duplicate lead detected (already exists)')
      } else {
        toast.error(msg)
      }
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 p-5" style={{ borderBottom: '1px solid #f3f4f6' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(79,70,229,0.1)' }}>
            <Link size={15} style={{ color: '#4f46e5' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{wh.title}</p>
            <p className="text-xs mt-0.5 max-w-sm" style={{ color: 'var(--text-secondary)' }}>{wh.description}</p>
          </div>
        </div>
        {wh.canTest && (
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs flex-shrink-0"
            style={{ opacity: (testing || !apiKey) ? 0.5 : 1 }}
          >
            {testing
              ? <Loader2 size={12} className="animate-spin" />
              : <FlaskConical size={12} />
            }
            {testing ? 'Testing…' : 'Test'}
          </button>
        )}
      </div>

      {/* URL row */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5' }}>
          {wh.method}
        </span>
        <code className="text-xs font-mono flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{url}</code>
        <CopyButton text={url} />
      </div>

      {/* Custom source row (Lead Capture only) */}
      {wh.canCustomSource && (
        <div className="px-5 py-4 space-y-3" style={{ borderBottom: '1px solid #f3f4f6', background: '#ffffff' }}>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold whitespace-nowrap flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Custom Source
            </label>
            <input
              type="text"
              value={customSource}
              onChange={e => {
                setCustomSource(e.target.value.replace(/\s/g, '_'))
                setShowGenerated(false)
              }}
              onKeyDown={e => { if (e.key === 'Enter' && customSource.trim()) setShowGenerated(true) }}
              placeholder="APP, TEACHX, YOUTUBE"
              className="input flex-1 text-xs font-mono"
              maxLength={40}
            />
            <button
              onClick={() => { if (customSource.trim()) setShowGenerated(true) }}
              disabled={!customSource.trim()}
              className="btn-primary px-3 py-1.5 text-xs flex-shrink-0"
              style={{ opacity: !customSource.trim() ? 0.4 : 1 }}
            >
              Generate URL
            </button>
          </div>

          {showGenerated && customSource.trim() && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#111827' }}>
              <code className="text-xs font-mono flex-1 break-all select-all" style={{ color: '#86efac' }}>{url}</code>
              <CopyButton text={url} />
            </div>
          )}
        </div>
      )}

      {/* Payload + response */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ borderTop: '1px solid #f3f4f6' }}>
        <div className="p-4" style={{ borderRight: '1px solid #f3f4f6' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Request Body</p>
          <pre className="text-xs font-mono rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed" style={{ background: '#fafafa', color: 'var(--text-primary)' }}>
            {JSON.stringify(displayPayload, null, 2)}
          </pre>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Response</p>
          <pre className="text-xs font-mono rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed" style={{ background: '#fafafa', color: 'var(--text-primary)' }}>
            {JSON.stringify(wh.response, null, 2)}
          </pre>
          {testResult && (
            <div className={`mt-2 p-2.5 rounded-lg text-xs font-mono ${testResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {testResult.ok
                ? JSON.stringify(testResult.data, null, 2)
                : testResult.msg
              }
            </div>
          )}
        </div>
      </div>

      {/* Header hint */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Required header:</span>
        <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: 'var(--text-primary)' }}>X-API-Key: &lt;your-api-key&gt;</code>
      </div>
    </div>
  )
}

const FALLBACK_KEY = 'demo-api-key-edu-2024'

export default function WebhooksPage() {
  const [showKey, setShowKey] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['institution-api-key'],
    queryFn: async () => {
      try {
        const r = await institutionApi.getApiKey()
        return r.data
      } catch {
        return { api_key: FALLBACK_KEY }
      }
    },
    retry: false,
  })

  const apiKey = data?.api_key || FALLBACK_KEY
  const isFallback = apiKey === FALLBACK_KEY
  const maskedKey = `${apiKey.slice(0, 8)}${'•'.repeat(Math.max(0, apiKey.length - 12))}${apiKey.slice(-4)}`

  const copyKey = async () => {
    if (!apiKey) return
    try { await navigator.clipboard.writeText(apiKey); toast.success('API key copied') }
    catch { toast.error('Copy failed') }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.1)' }}>
          <Webhook size={20} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Webhooks & API</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Integrate EduCRM with your website, forms, and tools</p>
        </div>
      </div>

      {/* API Key card */}
      <div className="card space-y-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>API Key</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: -10 }}>
          Send this as the <code className="font-mono px-1 rounded" style={{ background: '#f3f4f6' }}>X-API-Key</code> header with every webhook request.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 py-2"><Spinner size={4} /><span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading API key…</span></div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: '#fafafa', border: '1px solid #e5e7eb' }}>
              <code className="flex-1 text-sm font-mono tracking-wider select-all" style={{ color: 'var(--text-primary)' }}>
                {showKey ? apiKey : maskedKey}
              </code>
            </div>
            <button
              onClick={() => setShowKey(v => !v)}
              title={showKey ? 'Hide' : 'Show'}
              className="p-2.5 rounded-xl transition-all"
              style={{ border: '1px solid #e5e7eb', background: '#ffffff', color: 'var(--text-secondary)' }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={copyKey}
              title="Copy API key"
              className="p-2.5 rounded-xl transition-all"
              style={{ border: '1px solid #e5e7eb', background: '#ffffff', color: 'var(--text-secondary)' }}
            >
              <Copy size={16} />
            </button>
          </div>
        )}

        {isFallback && (
          <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}>
            Using demo key <code className="font-mono font-semibold">{FALLBACK_KEY}</code> — the live API key endpoint is unavailable. Replace with your real key from Settings once the backend is reachable.
          </div>
        )}

        <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)', color: '#92400e' }}>
          <span className="font-semibold">Keep this secret.</span> Anyone with this key can create leads in your account. Never expose it in client-side JavaScript.
        </div>
      </div>

      {/* Webhook cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Webhook Endpoints</h2>
        <div className="space-y-4">
          {WEBHOOKS.map(wh => (
            <WebhookCard key={wh.id} wh={wh} apiKey={apiKey} />
          ))}
        </div>
      </div>

      {/* Quick-start snippet */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>Quick Start — cURL</h3>
        <pre className="text-xs font-mono rounded-xl p-4 overflow-x-auto leading-relaxed" style={{ background: '#111827', color: '#e2e8f0' }}>
{`curl -X POST ${WH_BASE}/lead \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "Rahul Sharma",
    "phone": "9876543210",
    "email": "rahul@example.com",
    "source": "WEBSITE"
  }'`}
        </pre>
        <CopyButton
          text={`curl -X POST ${WH_BASE}/lead \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -d '{"name":"Rahul Sharma","phone":"9876543210","email":"rahul@example.com","source":"WEBSITE"}'`}
        />
      </div>
    </div>
  )
}
