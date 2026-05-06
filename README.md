# EduCRM — Education CRM SaaS

A complete full-stack multi-tenant Education CRM with web dashboard, Android mobile app, and SaaS billing.

## Project Overview

EduCRM helps education institutions manage leads, track admissions, automate communications, collect payments, and analyze performance — all in one platform.

### Features
- **Multi-tenant SaaS** — STARTER / PRO / ENTERPRISE plans with usage limits
- **Lead Management** — scoring engine, HOT/WARM/COLD labels, bulk CSV import
- **Activity Scoring** — webhook-based scoring with Redis idempotency, score decay cron
- **Communications** — email (SMTP) + WhatsApp (WATI) with template engine
- **Campaigns** — bulk messaging with audience filtering
- **Workflow Automation** — event-driven triggers + multi-step actions
- **Payments** — Razorpay integration with payment links and reminders
- **Reports** — overview, agent performance, funnel, source ROI with CSV export
- **Applicant Portal** — student self-service for application status, payments, documents
- **Android App** — dashboard, leads, hot leads, tasks with push notifications
- **Super Admin Panel** — manage all institutions, plans, and revenue

---

## Prerequisites

- Node.js 18+
- npm 9+
- Redis (optional, for idempotency caching)
- Expo CLI & EAS CLI (for mobile build)

---

## 1. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — minimum required: DATABASE_URL (SQLite default works out of box)

# Run database migration
npx prisma migrate dev

# Seed with demo data
node src/prisma/seed.js

# Start development server (port 5001)
npm run dev
```

The backend runs on **http://localhost:5001**

---

## 2. Frontend Setup

```bash
cd frontend
npm install

# Start development server (port 3001)
npm run dev
```

Open **http://localhost:3001**

---

## 3. Mobile App Setup

```bash
cd mobile
npm install

# Update the API URL to your machine's local IP
# Edit .env:
#   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5001/api
# (Use 10.0.2.2 for Android emulator to access host machine)

# Start Expo development server
npx expo start

# Press 'a' to open in Android emulator
# Or scan QR code with Expo Go app
```

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@demo.com` | `Demo@1234` |
| **Manager** | `manager@demo.com` | `Demo@1234` |
| **Counsellor** | `counsellor@demo.com` | `Demo@1234` |
| **Counsellor 2** | `c2@demo.com` | `Demo@1234` |

### Super Admin Panel (`/super`)
| Email | Password |
|-------|----------|
| `superadmin@educrm.com` | `SuperAdmin@123` |

### Applicant Portal (`/portal`)
Create a portal user by:
1. Login as Admin → Open any lead → Click "Invite to Portal"
2. Use the generated link to register
3. Login at `/portal` with the registered email

---

## Webhook API

### Lead Capture Webhook
Receive leads from website forms, Facebook ads, Google forms, Zapier etc.

```bash
curl -X POST http://localhost:5001/api/webhooks/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-edu-2024" \
  -d '{
    "name": "Student Name",
    "email": "student@email.com",
    "phone": "9800000000",
    "city": "Mumbai",
    "course_interested": "MBA",
    "source": "FACEBOOK",
    "idempotency_key": "unique-event-id-001"
  }'
```

**Response:**
```json
{ "status": "created", "lead_id": "uuid", "lead_name": "Student Name" }
```

### Activity Scoring Webhook
Boost a lead's score when they take an action in your LMS/app.

```bash
curl -X POST http://localhost:5001/api/webhooks/activity \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-edu-2024" \
  -d '{
    "lead_id": "LEAD_UUID",
    "activity_type": "webinar_attended",
    "idempotency_key": "event-123"
  }'
```

| Activity Type | Points |
|---|---|
| `form_fill` | +15 |
| `app_open` | +5 |
| `module_viewed` | +8 |
| `webinar_attended` | +20 |
| `payment_initiated` | +25 |
| `email_opened` | +3 |
| `whatsapp_replied` | +10 |

**Demo API Key:** `demo-api-key-edu-2024`

---

## Build Android APK

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS project (first time)
eas build:configure

# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production
```

The APK download link will be shown in the EAS dashboard.

---

## Connect Real Payment Gateway (Razorpay)

1. Create account at [razorpay.com](https://razorpay.com)
2. Get your Key ID and Key Secret from the dashboard
3. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=your_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
4. In Razorpay dashboard → Webhooks → Add URL: `https://your-domain.com/api/webhooks/razorpay`
5. Select event: `payment.captured`

---

## Connect WhatsApp (WATI)

1. Create account at [wati.io](https://wati.io)
2. Get your API URL and API Key
3. Add to `backend/.env`:
   ```
   WATI_API_URL=https://live-mt-server.wati.io/your-account
   WATI_API_KEY=your_wati_api_key
   ```

---

## Folder Structure

```
educrm/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # 20 Prisma models (SQLite/PostgreSQL)
│   ├── src/
│   │   ├── controllers/           # 15+ controllers
│   │   ├── routes/                # 15+ route files
│   │   ├── middleware/            # auth, superAdmin, planLimits, apiKey
│   │   ├── services/              # scoring, email, whatsapp, workflow, campaign, payment, cron
│   │   └── prisma/
│   │       └── seed.js            # Demo data
│   ├── uploads/                   # Uploaded files
│   └── .env
│
├── frontend/
│   └── src/
│       ├── pages/                 # 16 pages (all routes)
│       │   ├── portal/            # Applicant Portal standalone
│       │   ├── super/             # Super Admin Panel standalone
│       │   └── settings/          # Settings sub-pages
│       ├── components/            # Shared components
│       ├── services/api.js        # All API calls with JWT interceptor
│       ├── store/authStore.js     # Zustand auth state
│       └── App.jsx
│
└── mobile/
    ├── App.js                     # Entry point + push notification setup
    └── src/
        ├── screens/               # 5 screens (Login, Dashboard, Leads, HotLeads, Tasks, LeadDetail)
        ├── navigation/            # Stack + Tab navigator
        ├── services/api.js        # Axios with SecureStore JWT
        └── store/authStore.js     # Zustand + SecureStore
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite: `file:./prisma/educrm.db` or PostgreSQL URL |
| `REDIS_URL` | No | Redis for idempotency. Falls back to DB if absent |
| `JWT_SECRET` | Yes | Signs user JWTs |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh tokens |
| `SUPER_ADMIN_JWT_SECRET` | Yes | Separate secret for super admin |
| `SUPER_ADMIN_EMAIL` | Yes | Super admin login email |
| `SUPER_ADMIN_PASSWORD` | Yes | Super admin login password |
| `RAZORPAY_KEY_ID` | No | Omit for mock payment links |
| `RAZORPAY_KEY_SECRET` | No | |
| `WATI_API_URL` | No | Omit to log WhatsApp to console |
| `WATI_API_KEY` | No | |
| `SMTP_HOST` | No | Omit to log emails to console |
| `SMTP_USER` | No | |
| `SMTP_PASS` | No | |
| `UPLOAD_DIR` | No | Default: `./uploads` |
| `PORT` | No | Default: `5001` |
| `FRONTEND_URL` | No | CORS origin, default: `http://localhost:3001` |

---

## Subscription Plans

| Plan | Price/mo | Leads | Users | Campaigns | WhatsApp | Payments | Portal |
|------|----------|-------|-------|-----------|----------|----------|--------|
| STARTER | ₹2,499 | 1,000 | 3 | 5 | ✗ | ✗ | ✗ |
| PRO | ₹6,999 | 10,000 | 15 | 50 | ✓ | ✓ | ✗ |
| ENTERPRISE | ₹18,999 | ∞ | ∞ | ∞ | ✓ | ✓ | ✓ |

---

## Cron Jobs (run automatically)

| Schedule | Job |
|----------|-----|
| Daily midnight | Score decay: -10% for leads inactive 7+ days |
| Daily 9 AM | Payment reminders for overdue and due-in-2-days |
| Daily 8 AM | Push notifications for overdue tasks |
