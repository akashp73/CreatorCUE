require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

// Rate limiter: 100 req/min per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/communications', require('./routes/communication.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/email-templates', require('./routes/email-templates.routes'));
app.use('/api/whatsapp-templates', require('./routes/whatsapp-templates.routes'));
app.use('/api/super', require('./routes/superAdmin.routes'));
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/workflows', require('./routes/workflow.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/score-rules', require('./routes/scoreRule.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));
app.use('/api/super-admin', require('./routes/superAdmin.routes'));
app.use('/api/portal', require('./routes/portal.routes'));
app.use('/api/devices', require('./routes/device.routes'));
app.use('/api/institution', require('./routes/institution.routes'));
app.use('/api/assignment', require('./routes/assignment.routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start cron jobs
require('./services/cronJobs');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`EduCRM backend listening on port ${PORT}`);
});

module.exports = app;
