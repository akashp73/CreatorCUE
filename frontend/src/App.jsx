import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LeadsPage from './pages/LeadsPage'
import LeadProfilePage from './pages/LeadProfilePage'
import HotLeadsPage from './pages/HotLeadsPage'
import TasksPage from './pages/TasksPage'
import CampaignsPage from './pages/CampaignsPage'
import AutomationsPage from './pages/AutomationsPage'
import PaymentsPage from './pages/PaymentsPage'
import ReportsPage from './pages/ReportsPage'
import ScoreRulesPage from './pages/settings/ScoreRulesPage'
import EmailTemplatesPage from './pages/settings/EmailTemplatesPage'
import WhatsAppTemplatesPage from './pages/settings/WhatsAppTemplatesPage'
import UsersPage from './pages/settings/UsersPage'
import BrandingPage from './pages/settings/BrandingPage'
import WebhooksPage from './pages/settings/WebhooksPage'
import AssignmentPage from './pages/settings/AssignmentPage'
import BillingPage from './pages/BillingPage'
import PortalApp from './pages/portal/PortalApp'
import SuperAdminApp from './pages/super/SuperAdminApp'

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-navy border-t-transparent" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const user = useAuthStore(s => s.user)

  useEffect(() => { init() }, [init])

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/portal/*" element={<PortalApp />} />
      <Route path="/super/*" element={<SuperAdminApp />} />
      <Route path="/*" element={
        <RequireAuth>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/:id" element={<LeadProfilePage />} />
              <Route path="/hot-leads" element={<HotLeadsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings/scoring" element={<ScoreRulesPage />} />
              <Route path="/settings/email-templates" element={<EmailTemplatesPage />} />
              <Route path="/settings/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
              <Route path="/settings/users" element={<UsersPage />} />
              <Route path="/settings/branding" element={<BrandingPage />} />
              <Route path="/settings/assignment" element={<AssignmentPage />} />
              <Route path="/settings/webhooks" element={<WebhooksPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </RequireAuth>
      } />
    </Routes>
  )
}
