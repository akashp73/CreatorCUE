import React, { useState, useEffect } from 'react'
import { Palette, Upload, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { brandingApi } from '../../services/api'
import Spinner from '../../components/Spinner'

export default function BrandingPage() {
  const [form, setForm] = useState({ name:'', logo_url:'', primary_color:'#1B2B4B' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    brandingApi.get().then(r=>{ const d=r.data; setForm({name:d.name,logo_url:d.logo_url||'',primary_color:d.primary_color||'#1B2B4B'}); if(d.logo_url) setPreview(`http://localhost:5001${d.logo_url}`) }).catch(()=>toast.error('Failed')).finally(()=>setLoading(false))
  },[])

  const uploadLogo = async e => {
    const file=e.target.files[0]; if(!file) return; setPreview(URL.createObjectURL(file))
    try { const r=await brandingApi.uploadLogo(file); setForm(f=>({...f,logo_url:r.data.logo_url})); setPreview(r.data.logo_url); toast.success('Logo uploaded!') }
    catch { toast.error('Upload failed') }
    e.target.value=''
  }

  const save = async () => {
    setSaving(true)
    try { await brandingApi.update(form); toast.success('Branding updated!') }
    catch(err) { toast.error(err.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }

  if(loading) return <Spinner/>
  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none'
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center"><Palette size={20} className="text-purple-600"/></div><div><h1 className="text-xl font-bold text-gray-800">White Label Branding</h1><p className="text-sm text-gray-500">Customize your institution's look</p></div></div>
      <div className="card space-y-5">
        <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">Institution Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp}/></div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Logo</label>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50">
              {preview?<img src={preview} alt="logo" className="w-full h-full object-contain" onError={()=>setPreview(null)}/>:<GraduationCap size={24} className="text-gray-300"/>}
            </div>
            <div className="flex-1 space-y-2">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-fit"><Upload size={14}/> Upload Image<input type="file" accept="image/*" className="hidden" onChange={uploadLogo}/></label>
              <input value={form.logo_url} onChange={e=>{setForm({...form,logo_url:e.target.value});setPreview(e.target.value)}} placeholder="Or paste image URL" className={inp}/>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Primary Color</label>
          <div className="flex items-center gap-3"><input type="color" value={form.primary_color} onChange={e=>setForm({...form,primary_color:e.target.value})} className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"/><input value={form.primary_color} onChange={e=>setForm({...form,primary_color:e.target.value})} placeholder="#1B2B4B" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none font-mono"/></div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Preview</label>
          <div className="rounded-xl p-6 flex flex-col items-center border" style={{backgroundColor:'#F7F8FC'}}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{backgroundColor:form.primary_color}}>{preview?<img src={preview} alt="logo" className="w-8 h-8 object-contain"/>:<GraduationCap size={22} className="text-white"/>}</div>
            <p className="font-bold text-lg" style={{color:form.primary_color}}>{form.name||'Your Institution'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Education CRM · Sign in to continue</p>
            <div className="mt-4 w-48 py-2 rounded-lg text-white text-xs text-center font-semibold" style={{backgroundColor:'#F6AD2B'}}>Sign In</div>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{backgroundColor:'#F6AD2B'}}>{saving?'Saving...':'Save Branding'}</button>
      </div>
    </div>
  )
}
