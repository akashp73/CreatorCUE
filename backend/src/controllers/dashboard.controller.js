const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

async function getStats(req, res) {
  const iid = req.user.institution_id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    total_leads, hot_leads, tasks_due_today, enrolled_this_month,
    reengagement_leads, byStatus, bySource,
    new_leads_today, calls_today, byEnrollmentStage,
  ] = await Promise.all([
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, activity_score: { gt: 80 } } }),
    prisma.task.count({ where: { is_completed: false, due_at: { gte: todayStart, lt: todayEnd }, lead: { institution_id: iid } } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, status: 'ENROLLED', updated_at: { gte: monthStart } } }),
    prisma.lead.count({
      where: {
        institution_id: iid, is_deleted: false, assigned_to: { not: null },
        status: { notIn: ['ENROLLED', 'LOST'] }, last_activity_at: { lt: SEVEN_DAYS_AGO() },
      },
    }),
    prisma.lead.groupBy({ by: ['status'], where: { institution_id: iid, is_deleted: false }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['source'], where: { institution_id: iid, is_deleted: false }, _count: { _all: true } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false, created_at: { gte: todayStart, lt: todayEnd } } }),
    prisma.callLog.count({ where: { institution_id: iid, called_at: { gte: todayStart, lt: todayEnd } } }),
    prisma.lead.groupBy({ by: ['enrollment_stage'], where: { institution_id: iid, is_deleted: false }, _count: { _all: true } }),
  ]);

  const leads_by_status = byStatus.reduce((a, b) => { a[b.status] = b._count._all; return a; }, {});
  const leads_by_source = bySource.reduce((a, b) => { a[b.source] = b._count._all; return a; }, {});
  const pipeline = byEnrollmentStage.reduce((a, b) => { a[b.enrollment_stage] = b._count._all; return a; }, {});

  res.json({
    total_leads, hot_leads, tasks_due_today, enrolled_this_month,
    reengagement_leads, leads_by_status, leads_by_source,
    new_leads_today, calls_today, pipeline,
  });
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
    institution_id: iid, is_deleted: false,
    status: { notIn: ['ENROLLED', 'LOST'] },
    last_activity_at: { lt: SEVEN_DAYS_AGO() },
  };
  if (role === 'COUNSELLOR') where.assigned_to = uid;
  const leads = await prisma.lead.findMany({
    where, orderBy: { last_activity_at: 'asc' }, take: 10,
    include: { assignee: { select: { id: true, name: true } } },
  });
  res.json(leads);
}

async function getPipelineLeads(req, res) {
  try {
    const iid = req.user.institution_id;
    const { stage } = req.query;
    const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED'];
    const where = { institution_id: iid, is_deleted: false };
    if (stage && STAGES.includes(stage)) where.enrollment_stage = stage;
    const leads = await prisma.lead.findMany({
      where, orderBy: { updated_at: 'desc' }, take: 50,
      include: { assignee: { select: { id: true, name: true } } },
    });
    res.json(leads);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getTeamLeaderboard(req, res) {
  try {
    const iid = req.user.institution_id;
    const { period = 'today' } = req.query;
    const now = new Date();
    let since;
    if (period === 'today') since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') since = new Date(now.getTime() - 7 * 86400000);
    else since = new Date(now.getFullYear(), now.getMonth(), 1);

    const users = await prisma.user.findMany({
      where: { institution_id: iid, is_active: true },
      select: { id: true, name: true, status: true },
    });

    const leaderboard = await Promise.all(users.map(async (u) => {
      const [call_count, call_minutes, conversions] = await Promise.all([
        prisma.callLog.count({ where: { user_id: u.id, called_at: { gte: since } } }),
        prisma.callLog.aggregate({ where: { user_id: u.id, called_at: { gte: since } }, _sum: { duration: true } }),
        prisma.lead.count({ where: { assigned_to: u.id, status: 'ENROLLED', updated_at: { gte: since } } }),
      ]);
      return {
        ...u,
        call_count,
        talk_time: call_minutes._sum.duration || 0,
        conversions,
      };
    }));

    leaderboard.sort((a, b) => b.call_count - a.call_count);
    res.json(leaderboard);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getTodayTasks(req, res) {
  try {
    const { id: uid, institution_id } = req.user;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const tasks = await prisma.task.findMany({
      where: { assigned_to: uid, is_completed: false, due_at: { lte: todayEnd }, lead: { institution_id } },
      orderBy: { due_at: 'asc' },
      take: 10,
      include: { lead: { select: { id: true, name: true, phone: true } } },
    });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { getStats, getHotLeads, getReengagementLeads, getPipelineLeads, getTeamLeaderboard, getTodayTasks };
