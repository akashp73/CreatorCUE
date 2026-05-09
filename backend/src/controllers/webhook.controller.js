const { PrismaClient } = require('@prisma/client');
const { processActivity } = require('../services/scoringService');
const { getAutoAssignee } = require('../services/assignmentService');
const workflowEngine = require('../services/workflowEngine');
const prisma = new PrismaClient();

async function handleActivity(req, res) {
  const { lead_id, activity_type, idempotency_key } = req.body;
  if (!lead_id || !activity_type) return res.status(400).json({ error: 'lead_id and activity_type required' });
  try {
    const result = await processActivity({ lead_id, activity_type, institution_id: req.institution.id, idempotency_key });
    if (result.skipped) return res.json({ status: 'skipped', reason: result.reason });
    res.json({ status: 'processed', ...result });
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function handleLeadCapture(req, res) {
  const {
    name, email, phone, city, course_interested, source, idempotency_key,
    full_name, phone_number,
    'Email Address': gEmail, 'What is your name?': gName, 'Phone Number': gPhone, 'Course Interested In': gCourse,
  } = req.body;

  const resolvedName = name || full_name || gName;
  const resolvedEmail = email || gEmail;
  const resolvedPhone = phone || phone_number || gPhone;
  const resolvedCourse = course_interested || gCourse;
  if (!resolvedName) return res.status(400).json({ error: 'name is required' });

  // Query param source takes highest precedence — never override it.
  // Body source is second priority. Accept any string value as-is.
  const resolvedSource = (req.query?.source || source || 'OTHER').trim();

  // Duplicate detection — add a note and return existing lead
  if (resolvedPhone || resolvedEmail) {
    const or = [];
    if (resolvedPhone) or.push({ phone: resolvedPhone });
    if (resolvedEmail) or.push({ email: resolvedEmail });
    const dup = await prisma.lead.findFirst({ where: { institution_id: req.institution.id, is_deleted: false, OR: or } });

    if (dup) {
      // Add a system note so the counsellor sees the re-submission
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const systemUser = await prisma.user.findFirst({
        where: { institution_id: req.institution.id, role: 'ADMIN' },
        select: { id: true },
      });
      if (systemUser) {
        await prisma.note.create({
          data: {
            lead_id: dup.id,
            created_by: systemUser.id,
            content: `Also came from ${resolvedSource} on ${dateStr}`,
          },
        });
      }
      return res.json({ status: 'duplicate', lead_id: dup.id, lead_name: dup.name });
    }
  }

  // Auto-assign
  const assigned_to = await getAutoAssignee(req.institution.id, resolvedCourse, city).catch(() => null);

  const { enrollment_stage } = req.body;
  const lead = await prisma.lead.create({
    data: {
      institution_id: req.institution.id,
      name: resolvedName,
      email: resolvedEmail || null,
      phone: resolvedPhone || '',
      city: city || null,
      course_interested: resolvedCourse || null,
      source: resolvedSource,
      assigned_to: assigned_to || null,
      enrollment_stage: enrollment_stage || 'NEW',
    },
  });

  await processActivity({
    lead_id: lead.id,
    activity_type: 'form_fill',
    institution_id: req.institution.id,
    idempotency_key: idempotency_key ? `${idempotency_key}_ff` : undefined,
  }).catch(() => {});

  workflowEngine.emit('lead.created', { lead_id: lead.id, institution_id: req.institution.id, source: lead.source });
  res.status(201).json({ status: 'created', lead_id: lead.id, lead_name: lead.name, assigned_to });
}

async function handleFacebook(req, res) {
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === (process.env.FB_VERIFY_TOKEN || 'educrm-fb-verify-token')) return res.send(challenge);
    return res.status(403).send('Forbidden');
  }
  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  if (!entry) return res.json({ status: 'ignored' });
  const fields = {};
  (entry.field_data || []).forEach(({ name, values }) => { fields[name] = values?.[0]; });
  req.body = { name: fields.full_name || fields.name, email: fields.email, phone: fields.phone_number || fields.phone, source: 'FACEBOOK', idempotency_key: entry.leadgen_id };
  return handleLeadCapture(req, res);
}

async function handleRazorpay(req, res) {
  try {
    const entity = req.body?.payload?.payment?.entity;
    if (entity?.id) {
      await prisma.payment.updateMany({ where: { payment_gateway_ref: entity.id }, data: { status: 'PAID', paid_at: new Date() } });
    }
    res.json({ status: 'ok' });
  } catch (err) { console.error('Razorpay webhook error:', err); res.status(500).json({ error: 'Webhook error' }); }
}

module.exports = { handleActivity, handleLeadCapture, handleFacebook, handleRazorpay };
