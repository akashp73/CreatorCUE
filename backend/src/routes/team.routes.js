const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

r.use(authenticate);

// Get all team members with today stats
r.get('/', async (req, res) => {
  try {
    const iid = req.user.institution_id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const users = await prisma.user.findMany({
      where: { institution_id: iid, is_active: true },
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
    });

    const withStats = await Promise.all(users.map(async (u) => {
      const [calls_today, leads_contacted, conversions, activeBreak] = await Promise.all([
        prisma.callLog.count({ where: { user_id: u.id, called_at: { gte: todayStart } } }),
        prisma.callLog.findMany({ where: { user_id: u.id, called_at: { gte: todayStart } }, select: { lead_id: true }, distinct: ['lead_id'] }),
        prisma.lead.count({ where: { assigned_to: u.id, status: 'ENROLLED', updated_at: { gte: todayStart } } }),
        prisma.breakLog.findFirst({ where: { user_id: u.id, ended_at: null }, orderBy: { started_at: 'desc' } }),
      ]);
      return { ...u, calls_today, leads_contacted: leads_contacted.length, conversions, on_break: !!activeBreak, break_start: activeBreak?.started_at || null };
    }));

    res.json(withStats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update user status + log break
r.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['ACTIVE', 'ON_BREAK', 'IN_MEETING', 'OFFLINE'];
    if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });

    if (status === 'ON_BREAK') {
      await prisma.breakLog.create({ data: { user_id: req.params.id, institution_id: req.user.institution_id, status } });
    } else {
      const activeBreak = await prisma.breakLog.findFirst({ where: { user_id: req.params.id, ended_at: null } });
      if (activeBreak) await prisma.breakLog.update({ where: { id: activeBreak.id }, data: { ended_at: new Date() } });
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users/break — log break start/end (alternative path)
r.post('/break', async (req, res) => {
  try {
    const { status } = req.body;
    const uid = req.user.id;
    const iid = req.user.institution_id;

    if (status === 'ON_BREAK') {
      await prisma.breakLog.create({ data: { user_id: uid, institution_id: iid, status } });
      await prisma.user.update({ where: { id: uid }, data: { status: 'ON_BREAK' } });
    } else {
      const active = await prisma.breakLog.findFirst({ where: { user_id: uid, ended_at: null } });
      if (active) await prisma.breakLog.update({ where: { id: active.id }, data: { ended_at: new Date() } });
      await prisma.user.update({ where: { id: uid }, data: { status: 'ACTIVE' } });
    }
    res.json({ status: 'ok' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/team/status — team online status
r.get('/status', async (req, res) => {
  try {
    const iid = req.user.institution_id;
    const users = await prisma.user.findMany({
      where: { institution_id: iid, is_active: true },
      select: { id: true, name: true, status: true },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get break logs for a user
r.get('/:id/breaks', async (req, res) => {
  try {
    const logs = await prisma.breakLog.findMany({
      where: { user_id: req.params.id },
      orderBy: { started_at: 'desc' },
      take: 20,
    });
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = r;
