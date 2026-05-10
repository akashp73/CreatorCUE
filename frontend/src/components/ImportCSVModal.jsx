import React, { useState, useRef, useCallback } from 'react'
import { X, Upload, FileText, Check, ChevronRight, AlertCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadsApi } from '../services/api'

const CRM_FIELDS = [
  { key: 'phone',             label: 'Phone / Mobile',   required: true },
  { key: 'name',              label: 'Name',             required: false },
  { key: 'email',             label: 'Email',            required: false },
  { key: 'city',              label: 'City',             required: false },
  { key: 'course_interested', label: 'Course Interested',required: false },
  { key: 'source',            label: 'Source',           required: false },
  { key: 'status',            label: 'Status',           required: false },
]

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim())
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/["']/g, '').trim())
    return headers.reduce((obj, h, i) => { obj[h] = values[i] || ''; return obj }, {})
  })
  return { headers, rows }
}

function autoDetectMapping(headers) {
  const lower = headers.map(h => h.toLowerCase())
  const mapping = {}
  const rules = [
    { patterns: ['phone', 'mobile', 'contact', 'number', 'mob'], field: 'phone' },
    { patterns: ['name', 'full name', 'student name', 'lead name'], field: 'name' },
    { patterns: ['email', 'e-mail', 'mail'], field: 'email' },
    { patterns: ['city', 'location', 'place'], field: 'city' },
    { patterns: ['course', 'program', 'programme', 'interest', 'stream'], field: 'course_interested' },
    { patterns: ['source', 'medium', 'campaign', 'channel'], field: 'source' },
    { patterns: ['status', 'stage', 'state'], field: 'status' },
  ]
  headers.forEach((h, i) => {
    const lh = lower[i]
    for (const rule of rules) {
      if (rule.patterns.some(p => lh.includes(p))) {
        mapping[h] = rule.field
        break
      }
    }
    if (!mapping[h]) mapping[h] = 'skip'
  })
  return mapping
}

// Step indicators
function Steps({ current }) {
  const steps = ['Upload File', 'Map Columns', 'Import']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      {steps.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                background: done || active ? '#000000' : '#e5e7eb',
                color: done || active ? '#ffffff' : '#9ca3af',
              }}>
                {done ? <Check size={12} /> : idx}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#111827' : '#6b7280' }}>{label}</span>
            </div>
            {i < 2 && <ChevronRight size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function ImportCSVModal({ onClose, onImported }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [csvData, setCsvData] = useState(null)  // { headers, rows }
  const [mapping, setMapping] = useState({})    // { csvHeader: crmField | 'skip' }
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)    // { created, failed, errors }
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) return toast.error('Please select a .csv file')
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result)
      setCsvData({ headers, rows })
      setMapping(autoDetectMapping(headers))
    }
    reader.readAsText(f)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const phoneMapped = Object.values(mapping).includes('phone')

  const doImport = async () => {
    if (!phoneMapped) return toast.error('You must map the Phone column')
    setImporting(true); setProgress(10)

    const leads = csvData.rows.map(row => {
      const lead = {}
      Object.entries(mapping).forEach(([csvCol, crmField]) => {
        if (crmField !== 'skip') lead[crmField] = row[csvCol]
      })
      return lead
    }).filter(l => l.phone && l.phone.trim())

    setProgress(40)
    try {
      const r = await leadsApi.bulkImport(leads)
      setProgress(100)
      setResult(r.data)
      setStep(3)
      onImported?.()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const downloadErrors = () => {
    if (!result?.errors?.length) return
    const csv = 'phone,error\n' + result.errors.map(e => `${e.phone},"${e.error}"`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'import_errors.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const overlay = { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.45)' }
  const modal = { width: '100%', maxWidth: 620, background: '#ffffff', borderRadius: 16, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }
  const secTitle = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'block' }

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Import Leads from CSV</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X size={20} /></button>
        </div>

        <Steps current={step} />

        {/* ── STEP 1: Upload ── */}
        {step === 1 && (
          <div>
            <div
              onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#000000' : '#d1d5db'}`,
                borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                background: isDragging ? '#f9f9f9' : '#fafafa',
                transition: 'all 0.15s',
              }}>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <Upload size={36} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
              {file ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
                    <FileText size={16} style={{ display: 'inline', marginRight: 6, color: '#10b981' }} />
                    {file.name}
                  </p>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{csvData?.rows?.length || 0} rows detected</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>Drag & drop a CSV file or click to browse</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>Only .csv files are accepted</p>
                </>
              )}
            </div>

            {csvData && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#15803d' }}><strong>{csvData.rows.length}</strong> rows and <strong>{csvData.headers.length}</strong> columns detected. Click Next to map columns.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={onClose} className="btn-outline" style={{ fontSize: 13 }}>Cancel</button>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ fontSize: 13 }} disabled={!csvData}>
                Next: Map Columns <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Map Columns ── */}
        {step === 2 && csvData && (
          <div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Match each CSV column to a CRM field. <strong>Phone is required.</strong> Set unused columns to "Skip".
            </p>

            {/* Mapping table */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f9fafb', padding: '8px 14px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>CSV Column</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Map to CRM Field</span>
              </div>
              {csvData.headers.map(h => (
                <div key={h} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '10px 14px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{h}</span>
                    {csvData.rows[0] && <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>e.g. "{csvData.rows[0][h]}"</p>}
                  </div>
                  <select
                    value={mapping[h] || 'skip'}
                    onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                    className="input"
                    style={{ fontSize: 13 }}>
                    <option value="skip">— Skip —</option>
                    {CRM_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ marginBottom: 16 }}>
              <span style={secTitle}>Preview (first 3 rows)</span>
              <div style={{ overflowX: 'auto', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {CRM_FIELDS.filter(f => Object.values(mapping).includes(f.key)).map(f => (
                        <th key={f.key} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' }}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 3).map((row, ri) => (
                      <tr key={ri}>
                        {CRM_FIELDS.filter(f => Object.values(mapping).includes(f.key)).map(f => {
                          const csvCol = Object.entries(mapping).find(([, v]) => v === f.key)?.[0]
                          return <td key={f.key} style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{csvCol ? row[csvCol] : '—'}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!phoneMapped && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>You must map a column to <strong>Phone / Mobile</strong> to import leads.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16 }}>
              <button onClick={() => setStep(1)} className="btn-outline" style={{ fontSize: 13 }}>← Back</button>
              <button onClick={doImport} className="btn-primary" style={{ fontSize: 13 }} disabled={!phoneMapped || importing}>
                {importing ? `Importing… (${progress}%)` : `Import ${csvData.rows.length} Leads`}
              </button>
            </div>

            {importing && (
              <div style={{ marginTop: 14 }}>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#000000', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Results ── */}
        {step === 3 && result && (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: result.failed === 0 ? '#f0fdf4' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={28} style={{ color: result.failed === 0 ? '#16a34a' : '#d97706' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Import Complete!</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Your leads have been imported into the CRM.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Imported', value: result.created, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Duplicates Skipped', value: (result.failed || 0) - (result.errors?.length || 0), color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Errors', value: result.errors?.length || 0, color: '#ef4444', bg: '#fef2f2' },
              ].map(s => (
                <div key={s.label} style={{ padding: '14px 12px', borderRadius: 10, background: s.bg, textAlign: 'center' }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {result.errors?.length > 0 && (
              <button onClick={downloadErrors} className="btn-outline" style={{ fontSize: 13, marginBottom: 16 }}>
                <Download size={13} /> Download Error Report
              </button>
            )}

            <button onClick={onClose} className="btn-primary" style={{ fontSize: 14, padding: '10px 32px' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
