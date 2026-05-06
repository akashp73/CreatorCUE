const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

async function listInstitutions(req, res) {
  const institutions = await prisma.institution.findMany({
    include: { plan: true, subscriptions: { orderBy: { created_at: 'desc' }, take: 1 }, _count: { select: { users: true, leads: true } } },
    orderBy: { created_at: 'desc' },
  });
  res.json(institutions.map(i => ({ ...i, lead_count: i._count.leads, user_count: i._count.users, subscription: i.subscriptions[0] })));
}

async function createInstitution(req, res) {
  const { name, subdomain, admin_email, admin_password, plan_name = 'STARTER' } = req.body;
  if (!name || !subdomain || !admin_email || !admin_password) return res.status(400).json({ error: 'All fields required' });
  const existing = await prisma.institution.findFirst({ where: { subdomain } });
  if (existing) return res.status(409).json({ error: 'Subdomain taken' });
  const plan = await prisma.subscriptionPlan.findFirst({ where: { name: plan_name } });
  if (!plan) return res.status(400).json({ error: 'Plan not found' });
  const hash = await bcrypt.hash(admin_password, 12);
  const inst = await prisma.institution.create({ data: { name, subdomain, plan_id: plan.id, api_key: uuidv4() } });
  await prisma.user.create({ data: { institution_id: inst.id, name: `${name} Admin`, email: admin_email.toLowerCase(), password_hash: hash, role: 'ADMIN' } });
  await prisma.subscription.create({ data: { institution_id: inst.id, plan_id: plan.id, status: 'ACTIVE', expires_at: new Date(Date.now() + 365 * 86400000) } });
  const { seedDefaultScoreRules } = require('../prisma/seed');
  await seedDefaultScoreRules(inst.id).catch(() => {});
  res.status(201).json({ institution: inst, plan_name });
}

async function updateInstitution(req, res) {
  const { is_active, plan_name, extend_days } = req.body;
  const inst = await prisma.institution.findUnique({ where: { id: req.params.id } });
  if (!inst) return res.status(404).json({ error: 'Institution not found' });
  if (is_active !== undefined) await prisma.institution.update({ where: { id: req.params.id }, data: { is_active } });
  if (plan_name) {
    const plan = await prisma.subscriptionPlan.findFirst({ where: { name: plan_name } });
    if (plan) { await prisma.institution.update({ where: { id: req.params.id }, data: { plan_id: plan.id } }); await prisma.subscription.updateMany({ where: { institution_id: req.params.id, status: 'ACTIVE' }, data: { status: 'CANCELLED' } }); await prisma.subscription.create({ data: { institution_id: req.params.id, plan_id: plan.id, status: 'ACTIVE', expires_at: new Date(Date.now() + 30 * 86400000) } }); }
  }
  if (extend_days) { const sub = await prisma.subscription.findFirst({ where: { institution_id: req.params.id, status: 'ACTIVE' } }); if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { expires_at: new Date(sub.expires_at.getTime() + extend_days * 86400000) } }); }
  const updated = await prisma.institution.findUnique({ where: { id: req.params.id }, include: { plan: true } });
  res.json(updated);
}

async function getInstitutionUsage(req, res) {
  const inst = await prisma.institution.findUnique({ where: { id: req.params.id }, include: { plan: true, subscriptions: { take: 1, orderBy: { created_at: 'desc' } }, usageMetrics: { orderBy: { month: 'desc' }, take: 6 }, _count: { select: { users: true, leads: true } } } });
  if (!inst) return res.status(404).json({ error: 'Not found' });
  res.json(inst);
}

async function getRevenue(req, res) {
  const activeSubs = await prisma.subscription.findMany({ where: { status: 'ACTIVE' }, include: { plan: true, institution: { select: { name: true } } } });
  const mrr = activeSubs.reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0);
  const churned = await prisma.subscription.count({ where: { status: 'CANCELLED', created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });
  const byPlan = activeSubs.reduce((acc, s) => { const n = s.plan?.name || 'UNKNOWN'; acc[n] = (acc[n] || 0) + (s.plan?.price_monthly || 0); return acc; }, {});
  res.json({ mrr, active_subscriptions: activeSubs.length, churned_this_month: churned, revenue_by_plan: byPlan, recent_subscriptions: activeSubs.slice(0, 10).map(s => ({ institution: s.institution.name, plan: s.plan?.name, amount: s.plan?.price_monthly, expires_at: s.expires_at })) });
}

module.exports = { listInstitutions, createInstitution, updateInstitution, getInstitutionUsage, getRevenue };
