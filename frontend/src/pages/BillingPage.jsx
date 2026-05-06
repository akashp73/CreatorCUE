import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Star, Zap, Crown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { billingApi } from '../services/api'
import Spinner from '../components/Spinner'

const PLAN_META = { STARTER:{icon:Star,color:'#3182CE',desc:'For small institutes'}, PRO:{icon:Zap,color:'#F6AD2B',desc:'For growing institutes'}, ENTERPRISE:{icon:Crown,color:'#8B5CF6',desc:'Unlimited scale'} }

function UsageBar({ label, used, max }) {
  const pct = max===-1?10:Math.min((used/max)*100,100)
  const color = pct>90?'#E53E3E':pct>70?'#DD6B20':'#38A169'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 font-medium">{label}</span><span className="font-semibold text-gray-800">{used}/{max===-1?'∞':max}</span></div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,backgroundColor:color}}/></div>
    </div>
  )
}

function Feature({ has, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${has?'bg-green-100':'bg-gray-100'}`}><Check size={10} className={has?'text-green-600':'text-gray-300'}/></div>
      <span className={has?'text-gray-700':'text-gray-400 line-through'}>{label}</span>
    </div>
  )
}

export default function BillingPage() {
  const qc = useQueryClient()
  const { data: billing, isLoading: bl } = useQuery({ queryKey:['billing'], queryFn:()=>billingApi.getCurrent().then(r=>r.data) })
  const { data: plans = [], isLoading: pl } = useQuery({ queryKey:['plans'], queryFn:()=>billingApi.getPlans().then(r=>r.data) })
  const [upgrading, setUpgrading] = useState(null)

  const upgrade = async plan_name => {
    if(!window.confirm(`Upgrade to ${plan_name}?`)) return
    setUpgrading(plan_name)
    try { await billingApi.upgrade(plan_name); toast.success(`Upgraded to ${plan_name}!`); qc.invalidateQueries(['billing']) }
    catch(err) { toast.error(err.response?.data?.error||'Upgrade failed') }
    finally { setUpgrading(null) }
  }

  const currentPlan = billing?.plan?.name
  if(bl||pl) return <Spinner/>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center"><CreditCard size={20} className="text-yellow-600"/></div>
        <div><h1 className="text-xl font-bold text-gray-800">Billing & Plans</h1><p className="text-sm text-gray-500">Manage your subscription</p></div>
      </div>

      {billing && (
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div><p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Current Plan</p><p className="text-2xl font-bold mt-1" style={{color:'#1B2B4B'}}>{currentPlan}</p>{billing.subscription?.expires_at&&<p className="text-xs text-gray-400 mt-1">Renews {new Date(billing.subscription.expires_at).toLocaleDateString()}</p>}</div>
            {billing.plan&&<div className="text-right"><p className="text-2xl font-bold" style={{color:'#F6AD2B'}}>₹{billing.plan.price_monthly.toLocaleString('en-IN')}</p><p className="text-xs text-gray-400">/month</p></div>}
          </div>
          <div className="space-y-3">
            <UsageBar label="Leads" used={billing.usage?.leads?.used} max={billing.usage?.leads?.max}/>
            <UsageBar label="Users" used={billing.usage?.users?.used} max={billing.usage?.users?.max}/>
            <UsageBar label="Campaigns This Month" used={billing.usage?.campaigns?.used} max={billing.usage?.campaigns?.max}/>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-4 text-gray-800">Choose a Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const meta = PLAN_META[plan.name]||PLAN_META.STARTER; const Icon=meta.icon; const isCurrent=plan.name===currentPlan
            return (
              <div key={plan.id} className="bg-white rounded-2xl border-2 shadow-sm p-6 flex flex-col" style={{borderColor:isCurrent?'#F6AD2B':'#E5E7EB'}}>
                {isCurrent&&<div className="text-xs font-bold text-center py-1 rounded-full mb-3 text-white" style={{backgroundColor:'#F6AD2B'}}>Current Plan</div>}
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:meta.color+'20'}}><Icon size={20} style={{color:meta.color}}/></div><div><p className="font-bold text-gray-800">{plan.name}</p><p className="text-xs text-gray-400">{meta.desc}</p></div></div>
                <p className="text-3xl font-bold mb-1" style={{color:'#1B2B4B'}}>₹{plan.price_monthly.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400 mb-4">/month</p>
                <div className="space-y-2 flex-1 mb-5">
                  <Feature has label={plan.max_leads===-1?'Unlimited Leads':`${plan.max_leads.toLocaleString()} Leads`}/>
                  <Feature has label={plan.max_users===-1?'Unlimited Users':`${plan.max_users} Users`}/>
                  <Feature has label={plan.max_campaigns_per_month===-1?'Unlimited Campaigns':`${plan.max_campaigns_per_month} Campaigns/mo`}/>
                  <Feature has={plan.has_whatsapp} label="WhatsApp Messaging"/>
                  <Feature has={plan.has_payments} label="Payments Module"/>
                  <Feature has={plan.has_applicant_portal} label="Applicant Portal"/>
                  <Feature has={plan.has_white_label} label="White Label"/>
                </div>
                <button onClick={()=>upgrade(plan.name)} disabled={isCurrent||upgrading===plan.name} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor:isCurrent?'#F3F4F6':meta.color,color:isCurrent?'#6B7280':'white'}}>
                  {upgrading===plan.name?'Upgrading...':isCurrent?'Current Plan':`Upgrade to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
