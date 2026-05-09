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
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all hover:bg-gray-100 text-gray-500 hover:text-gray-700"
    >
      {copied
        ? <CheckCircle size={size} className="text-emerald-500" />
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
      <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Link size={15} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{wh.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-sm">{wh.description}</p>
          </div>
        </div>
        {wh.canTest && (
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: '#4f46e5' }}
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
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono flex-shrink-0">
          {wh.method}
        </span>
        <code className="text-xs text-gray-700 font-mono flex-1 truncate">{url}</code>
        <CopyButton text={url} />
      </div>

      {/* Custom source row (Lead Capture only) */}
      {wh.canCustomSource && (
        <div className="px-5 py-4 border-b border-gray-100 bg-white space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap flex-shrink-0">
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
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
              maxLength={40}
            />
            <button
              onClick={() => { if (customSource.trim()) setShowGenerated(true) }}
              disabled={!customSource.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
              style={{ backgroundColor: '#4f46e5' }}
            >
              Generate URL
            </button>
          </div>

          {showGenerated && customSource.trim() && (
            <div className="flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3">
              <code className="text-xs font-mono text-emerald-400 flex-1 break-all select-all">{url}</code>
              <CopyButton text={url} />
            </div>
          )}
        </div>
      )}

      {/* Payload + response */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Body</p>
          <pre className="text-xs font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">
            {JSON.stringify(displayPayload, null, 2)}
          </pre>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Response</p>
          <pre className="text-xs font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">
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
      <div className="px-5 py-3 border-t border-gray-100 bg-slate-50 flex items-center gap-2">
        <span className="text-xs text-gray-500">Required header:</span>
        <code className="text-xs font-mono bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700">X-API-Key: &lt;your-api-key&gt;</code>
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
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Webhook size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Webhooks & API</h1>
          <p className="text-sm text-gray-500">Integrate EduCRM with your website, forms, and tools</p>
        </div>
      </div>

      {/* API Key card */}
      <div className="card space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">API Key</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Send this as the <code className="font-mono bg-gray-100 px-1 rounded">X-API-Key</code> header with every webhook request.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-2"><Spinner size={4} /><span className="text-sm text-gray-400">Loading API key…</span></div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <code className="flex-1 text-sm font-mono text-gray-800 tracking-wider select-all">
                {showKey ? apiKey : maskedKey}
              </code>
            </div>
            <button
              onClick={() => setShowKey(v => !v)}
              title={showKey ? 'Hide' : 'Show'}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={copyKey}
              title="Copy API key"
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Copy size={16} />
            </button>
          </div>
        )}

        {isFallback && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 leading-relaxed">
            Using demo key <code className="font-mono font-semibold">{FALLBACK_KEY}</code> — the live API key endpoint is unavailable. Replace with your real key from Settings once the backend is reachable.
          </div>
        )}

        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Keep this secret.</span> Anyone with this key can create leads in your account. Never expose it in client-side JavaScript.
        </div>
      </div>

      {/* Webhook cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Webhook Endpoints</h2>
        <div className="space-y-4">
          {WEBHOOKS.map(wh => (
            <WebhookCard key={wh.id} wh={wh} apiKey={apiKey} />
          ))}
        </div>
      </div>

      {/* Quick-start snippet */}
      <div className="card">
        <p className="text-sm font-semibold text-gray-800 mb-3">Quick Start — cURL</p>
        <pre className="text-xs font-mono bg-slate-900 text-slate-200 rounded-xl p-4 overflow-x-auto leading-relaxed">
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
