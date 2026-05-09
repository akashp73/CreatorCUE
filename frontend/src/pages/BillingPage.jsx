import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Star, Zap, Crown, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { billingApi } from '../services/api'
import Spinner from '../components/Spinner'

const PLAN_META = {
  STARTER:    { icon: Star,   color: '#3182CE', desc: 'For small institutes' },
  PRO:        { icon: Zap,    color: '#4f46e5', desc: 'For growing institutes' },
  ENTERPRISE: { icon: Crown,  color: '#8B5CF6', desc: 'Unlimited scale' },
}

function UsageBar({ label, used, max }) {
  const pct = max === -1 ? 10 : Math.min((used / max) * 100, 100)
  const color = pct > 90 ? '#E53E3E' : pct > 70 ? '#f59e0b' : '#38A169'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-semibold text-gray-700 tabular-nums">{used} / {max === -1 ? '∞' : max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Feature({ has, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${has ? 'bg-indigo-100' : 'bg-gray-100'}`}>
        <Check size={10} className={has ? 'text-indigo-600' : 'text-gray-300'} />
      </div>
      <span className={has ? 'text-gray-700' : 'text-gray-400 line-through'}>{label}</span>
    </div>
  )
}

function ConfirmPlanModal({ plan, meta, onConfirm, onClose, loading }) {
  const Icon = meta.icon
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: meta.color + '18' }}
          >
            <Icon size={28} style={{ color: meta.color }} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Upgrade to {plan.name}?</h2>
          <p className="text-sm text-gray-500 mt-1">{meta.desc}</p>
          <div className="mt-4 py-3 px-4 bg-gray-50 rounded-xl inline-block">
            <span className="text-2xl font-bold text-gray-900">₹{plan.price_monthly.toLocaleString('en-IN')}</span>
            <span className="text-sm text-gray-400 ml-1">/month</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: '#4f46e5' }}
          >
            {loading ? 'Upgrading…' : 'Confirm Upgrade'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const qc = useQueryClient()
  const { data: billing, isLoading: bl } = useQuery({ queryKey: ['billing'], queryFn: () => billingApi.getCurrent().then(r => r.data) })
  const { data: plans = [], isLoading: pl } = useQuery({ queryKey: ['plans'], queryFn: () => billingApi.getPlans().then(r => r.data) })
  const [confirmPlan, setConfirmPlan] = useState(null)
  const [upgrading, setUpgrading] = useState(false)

  const handleConfirmUpgrade = async () => {
    if (!confirmPlan) return
    setUpgrading(true)
    try {
      await billingApi.upgrade(confirmPlan.name)
      toast.success(`Upgraded to ${confirmPlan.name}!`)
      qc.invalidateQueries(['billing'])
      setConfirmPlan(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed')
    } finally {
      setUpgrading(false)
    }
  }

  const currentPlan = billing?.plan?.name
  if (bl || pl) return <Spinner />

  const confirmMeta = confirmPlan ? (PLAN_META[confirmPlan.name] || PLAN_META.STARTER) : null

  return (
    <div className="space-y-6 max-w-5xl">
      {confirmPlan && confirmMeta && (
        <ConfirmPlanModal
          plan={confirmPlan}
          meta={confirmMeta}
          onConfirm={handleConfirmUpgrade}
          onClose={() => setConfirmPlan(null)}
          loading={upgrading}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <CreditCard size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="text-sm text-gray-500">Manage your subscription</p>
        </div>
      </div>

      {billing && (
        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Current Plan</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{currentPlan}</p>
              {billing.subscription?.expires_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Renews {new Date(billing.subscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            {billing.plan && (
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: '#4f46e5' }}>
                  ₹{billing.plan.price_monthly.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-400">/month</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <UsageBar label="Leads" used={billing.usage?.leads?.used} max={billing.usage?.leads?.max} />
            <UsageBar label="Users" used={billing.usage?.users?.used} max={billing.usage?.users?.max} />
            <UsageBar label="Campaigns This Month" used={billing.usage?.campaigns?.used} max={billing.usage?.campaigns?.max} />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-4 text-gray-900">Choose a Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const meta = PLAN_META[plan.name] || PLAN_META.STARTER
            const Icon = meta.icon
            const isCurrent = plan.name === currentPlan
            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border-2 shadow-sm p-6 flex flex-col transition-shadow hover:shadow-md"
                style={{ borderColor: isCurrent ? '#4f46e5' : '#E5E7EB' }}
              >
                {isCurrent && (
                  <div
                    className="text-xs font-bold text-center py-1 rounded-full mb-3 text-white"
                    style={{ backgroundColor: '#4f46e5' }}
                  >
                    Current Plan
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color + '18' }}>
                    <Icon size={20} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-400">{meta.desc}</p>
                  </div>
                </div>
                <p className="text-3xl font-bold mb-0.5 text-gray-900">₹{plan.price_monthly.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400 mb-5">/month</p>
                <div className="space-y-2.5 flex-1 mb-6">
                  <Feature has label={plan.max_leads === -1 ? 'Unlimited Leads' : `${plan.max_leads.toLocaleString()} Leads`} />
                  <Feature has label={plan.max_users === -1 ? 'Unlimited Users' : `${plan.max_users} Users`} />
                  <Feature has label={plan.max_campaigns_per_month === -1 ? 'Unlimited Campaigns' : `${plan.max_campaigns_per_month} Campaigns/mo`} />
                  <Feature has={plan.has_whatsapp} label="WhatsApp Messaging" />
                  <Feature has={plan.has_payments} label="Payments Module" />
                  <Feature has={plan.has_applicant_portal} label="Applicant Portal" />
                  <Feature has={plan.has_white_label} label="White Label" />
                </div>
                <button
                  onClick={() => !isCurrent && setConfirmPlan(plan)}
                  disabled={isCurrent}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-default hover:opacity-90"
                  style={{
                    backgroundColor: isCurrent ? '#F3F4F6' : meta.color,
                    color: isCurrent ? '#9CA3AF' : 'white',
                  }}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
