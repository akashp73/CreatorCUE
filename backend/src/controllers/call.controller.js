const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(start.getTime() + 86400000);
  return { gte: start, lt: end };
}

async function logCall(req, res) {
  const { lead_id, call_type, duration = 0, outcome, notes, called_at, source = 'MANUAL' } = req.body;
  const { institution_id, id: user_id } = req.user;

  if (!lead_id || !call_type || !outcome) {
    return res.status(400).json({ error: 'lead_id, call_type, and outcome are required' });
  }
  const VALID_TYPES    = ['OUTGOING', 'INCOMING', 'MISSED'];
  const VALID_OUTCOMES = ['INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'NO_ANSWER', 'CONNECTED'];
  if (!VALID_TYPES.includes(call_type))    return res.status(400).json({ error: `call_type must be one of ${VALID_TYPES.join(', ')}` });
  if (!VALID_OUTCOMES.includes(outcome))   return res.status(400).json({ error: `outcome must be one of ${VALID_OUTCOMES.join(', ')}` });

  const lead = await prisma.lead.findFirst({ where: { id: lead_id, institution_id, is_deleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const callLog = await prisma.callLog.create({
    data: {
      institution_id, lead_id, user_id,
      call_type, duration: parseInt(duration) || 0, outcome,
      notes: notes?.trim() || null,
      called_at: called_at ? new Date(called_at) : new Date(),
      source,
    },
    include: { user: { select: { name: true } } },
  });

  // Create an ActivityLog so the call appears in the lead's scoring timeline
  const pts = call_type === 'MISSED' ? 0 : 5;
  if (pts > 0) {
    await prisma.lead.update({ where: { id: lead_id }, data: { last_activity_at: new Date(), activity_score: { increment: pts } } });
  }
  await prisma.activityLog.create({
    data: {
      lead_id,
      activity_type: `call_${call_type.toLowerCase()}`,
      points_added: pts,
      description: `${call_type} call · ${duration}min · ${outcome}${notes ? ' · ' + notes.slice(0, 80) : ''}`,
    },
  });

  res.status(201).json(callLog);
}

async function getTodayStats(req, res) {
  const { institution_id, id: user_id } = req.user;
  const today = todayRange();

  const [calls, newLeads, converted, whatsappSent] = await Promise.all([
    prisma.callLog.findMany({ where: { institution_id, user_id, called_at: today } }),
    prisma.lead.count({ where: { institution_id, created_at: today } }),
    prisma.lead.count({ where: { institution_id, status: 'ENROLLED', updated_at: today } }),
    prisma.communicationLog.count({ where: { lead: { institution_id }, channel: 'WHATSAPP', sent_at: today } }),
  ]);

  const total_calls      = calls.length;
  const missed_calls     = calls.filter(c => c.call_type === 'MISSED' || c.outcome === 'NO_ANSWER').length;
  const connected_calls  = calls.filter(c => c.call_type !== 'MISSED' && c.outcome !== 'NO_ANSWER').length;
  const total_duration   = calls.reduce((s, c) => s + (c.duration || 0), 0);

  res.json({
    total_calls, connected_calls, missed_calls, total_duration,
    new_leads: newLeads, leads_converted: converted, whatsapp_sent: whatsappSent,
    date: new Date().toISOString().split('T')[0],
  });
}

async function getLeadCalls(req, res) {
  const { institution_id } = req.user;
  const lead = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id, is_deleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const calls = await prisma.callLog.findMany({
    where: { lead_id: req.params.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { called_at: 'desc' },
  });
  res.json(calls);
}

async function syncCalls(req, res) {
  const { institution_id, id: user_id } = req.user;
  const { calls = [] } = req.body;
  if (!Array.isArray(calls)) return res.status(400).json({ error: 'calls must be an array' });

  let synced = 0, skipped = 0;
  for (const c of calls) {
    const { phone, call_type, duration, called_at, outcome = 'NO_ANSWER' } = c;
    if (!phone || !call_type) { skipped++; continue; }

    const lead = await prisma.lead.findFirst({ where: { institution_id, phone, is_deleted: false } });
    if (!lead) { skipped++; continue; }

    // Dedupe: skip if same lead + called_at already exists (within 60s window)
    const calledAtDate = called_at ? new Date(called_at) : new Date();
    const existing = await prisma.callLog.findFirst({
      where: {
        lead_id: lead.id, user_id,
        called_at: { gte: new Date(calledAtDate.getTime() - 60000), lte: new Date(calledAtDate.getTime() + 60000) },
      },
    });
    if (existing) { skipped++; continue; }

    await prisma.callLog.create({
      data: { institution_id, lead_id: lead.id, user_id, call_type, duration: duration || 0, outcome, called_at: calledAtDate, source: 'DEVICE' },
    });
    synced++;
  }

  res.json({ synced, skipped });
}

module.exports = { logCall, getTodayStats, getLeadCalls, syncCalls };
