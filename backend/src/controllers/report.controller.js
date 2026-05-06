const { PrismaClient } = require('@prisma/client');
const { Parser } = require('json2csv');
const prisma = new PrismaClient();

function dateWhere(from, to) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - 30 * 86400000);
  const end = to ? new Date(to) : now;
  return { gte: start, lte: end };
}

async function overview(req, res) {
  const iid = req.user.institution_id;
  const created_at = dateWhere(req.query.date_from, req.query.date_to);

  const [total, enrolled, paidRev, avgScore, byStatus, bySource] = await Promise.all([
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, created_at } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, status: 'ENROLLED', created_at } }),
    prisma.payment.aggregate({ where: { institution_id: iid, status: 'PAID' }, _sum: { amount: true } }),
    prisma.lead.aggregate({ where: { institution_id: iid, is_deleted: false }, _avg: { activity_score: true } }),
    prisma.lead.groupBy({ by: ['status'], where: { institution_id: iid, is_deleted: false, created_at }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['source'], where: { institution_id: iid, is_deleted: false, created_at }, _count: { _all: true } }),
  ]);

  res.json({
    total_leads: total,
    enrolled_leads: enrolled,
    conversion_rate: total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0',
    total_revenue: paidRev._sum.amount || 0,
    avg_score: Math.round(avgScore._avg.activity_score || 0),
    leads_by_status: byStatus.map(b => ({ name: b.status, value: b._count._all })),
    leads_by_source: bySource.map(b => ({ name: b.source, value: b._count._all })),
  });
}

async function agentPerformance(req, res) {
  const iid = req.user.institution_id;
  const users = await prisma.user.findMany({ where: { institution_id: iid, is_active: true } });
  const results = await Promise.all(users.map(async (u) => {
    const [assigned, converted, tasks_completed] = await Promise.all([
      prisma.lead.count({ where: { institution_id: iid, assigned_to: u.id, is_deleted: false } }),
      prisma.lead.count({ where: { institution_id: iid, assigned_to: u.id, status: 'ENROLLED' } }),
      prisma.task.count({ where: { assigned_to: u.id, is_completed: true } }),
    ]);
    return { id: u.id, name: u.name, role: u.role, leads_assigned: assigned, leads_converted: converted, tasks_completed, conversion_rate: assigned > 0 ? ((converted / assigned) * 100).toFixed(1) : '0' };
  }));
  res.json(results.sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate)));
}

async function funnel(req, res) {
  const iid = req.user.institution_id;
  const stages = ['NEW', 'CONTACTED', 'APPLIED', 'QUALIFIED', 'ENROLLED'];
  const counts = await Promise.all(stages.map(s => prisma.lead.count({ where: { institution_id: iid, is_deleted: false, status: s } })));
  const total = counts[0] || 1;
  const result = stages.map((stage, i) => ({
    stage, count: counts[i],
    pct: ((counts[i] / total) * 100).toFixed(1),
    drop_off: i > 0 && counts[i - 1] > 0 ? (((counts[i - 1] - counts[i]) / counts[i - 1]) * 100).toFixed(1) : null,
  }));
  res.json({ stages: result, total_entered: counts[0] });
}

async function sourceRoi(req, res) {
  const iid = req.user.institution_id;
  const sources = ['FACEBOOK', 'GOOGLE', 'WEBSITE', 'REFERRAL', 'WALK_IN', 'OTHER'];
  const results = await Promise.all(sources.map(async (source) => {
    const [total, qualified, enrolled, rev] = await Promise.all([
      prisma.lead.count({ where: { institution_id: iid, source, is_deleted: false } }),
      prisma.lead.count({ where: { institution_id: iid, source, status: 'QUALIFIED' } }),
      prisma.lead.count({ where: { institution_id: iid, source, status: 'ENROLLED' } }),
      prisma.payment.aggregate({ where: { institution_id: iid, status: 'PAID', lead: { source } }, _sum: { amount: true } }),
    ]);
    return { source, total_leads: total, qualified_leads: qualified, enrolled_leads: enrolled, total_revenue: rev._sum.amount || 0 };
  }));
  res.json(results.filter(r => r.total_leads > 0));
}

async function exportReport(req, res) {
  const { type = 'leads', date_from, date_to } = req.query;
  const iid = req.user.institution_id;
  const created_at = dateWhere(date_from, date_to);

  let rows = [], filename = 'report.csv';
  if (type === 'leads') {
    const leads = await prisma.lead.findMany({ where: { institution_id: iid, is_deleted: false, created_at }, include: { assignee: { select: { name: true } } } });
    rows = leads.map(l => ({ name: l.name, email: l.email, phone: l.phone, city: l.city, course: l.course_interested, source: l.source, status: l.status, score: l.activity_score, assigned_to: l.assignee?.name || '' }));
    filename = 'leads.csv';
  } else if (type === 'payments') {
    const pays = await prisma.payment.findMany({ where: { institution_id: iid }, include: { lead: { select: { name: true, phone: true } } } });
    rows = pays.map(p => ({ lead: p.lead.name, phone: p.lead.phone, amount: p.amount, type: p.payment_type, status: p.status, due_date: p.due_date }));
    filename = 'payments.csv';
  }
  if (!rows.length) return res.status(404).json({ error: 'No data' });
  const parser = new Parser();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(parser.parse(rows));
}

module.exports = { overview, agentPerformance, funnel, sourceRoi, exportReport };
