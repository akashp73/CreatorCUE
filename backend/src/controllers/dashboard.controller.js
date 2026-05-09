const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

async function getStats(req, res) {
  const iid = req.user.institution_id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total_leads, hot_leads, tasks_due_today, enrolled_this_month, reengagement_leads, byStatus, bySource] = await Promise.all([
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, activity_score: { gt: 80 } } }),
    prisma.task.count({ where: { is_completed: false, due_at: { gte: todayStart, lt: todayEnd }, lead: { institution_id: iid } } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, status: 'ENROLLED', updated_at: { gte: monthStart } } }),
    // Leads not contacted in 7+ days, not terminal, with an assignee
    prisma.lead.count({
      where: {
        institution_id: iid,
        is_deleted: false,
        assigned_to: { not: null },
        status: { notIn: ['ENROLLED', 'LOST'] },
        last_activity_at: { lt: SEVEN_DAYS_AGO() },
      },
    }),
    prisma.lead.groupBy({ by: ['status'], where: { institution_id: iid, is_deleted: false }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['source'], where: { institution_id: iid, is_deleted: false }, _count: { _all: true } }),
  ]);

  const leads_by_status = byStatus.reduce((a, b) => { a[b.status] = b._count._all; return a; }, {});
  const leads_by_source = bySource.reduce((a, b) => { a[b.source] = b._count._all; return a; }, {});

  res.json({ total_leads, hot_leads, tasks_due_today, enrolled_this_month, reengagement_leads, leads_by_status, leads_by_source });
}

async function getHotLeads(req, res) {
  const leads = await prisma.lead.findMany({
    where: { institution_id: req.user.institution_id, is_deleted: false, activity_score: { gt: 80 } },
    orderBy: { activity_score: 'desc' },
    take: 20,
    include: { assignee: { select: { id: true, name: true } } },
  });
  res.json(leads);
}

async function getReengagementLeads(req, res) {
  const iid = req.user.institution_id;
  const { role, id: uid } = req.user;
  const where = {
    institution_id: iid,
    is_deleted: false,
    status: { notIn: ['ENROLLED', 'LOST'] },
    last_activity_at: { lt: SEVEN_DAYS_AGO() },
  };
  if (role === 'COUNSELLOR') where.assigned_to = uid;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { last_activity_at: 'asc' },
    take: 10,
    include: { assignee: { select: { id: true, name: true } } },
  });
  res.json(leads);
}

module.exports = { getStats, getHotLeads, getReengagementLeads };
