const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPlans(req, res) {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { price_monthly: 'asc' } });
  res.json(plans);
}

async function getCurrent(req, res) {
  const iid = req.user.institution_id;
  const [sub, usage, leadCount, userCount, campaignCount] = await Promise.all([
    prisma.subscription.findFirst({ where: { institution_id: iid }, include: { plan: true }, orderBy: { created_at: 'desc' } }),
    prisma.usageMetric.findFirst({ where: { institution_id: iid, month: new Date().toISOString().slice(0, 7) } }),
    prisma.lead.count({ where: { institution_id: iid, is_deleted: false } }),
    prisma.user.count({ where: { institution_id: iid, is_active: true } }),
    prisma.campaign.count({ where: { institution_id: iid } }),
  ]);
  res.json({ subscription: sub, plan: sub?.plan, usage: { leads: { used: leadCount, max: sub?.plan?.max_leads || 1000 }, users: { used: userCount, max: sub?.plan?.max_users || 3 }, campaigns: { used: campaignCount, max: sub?.plan?.max_campaigns_per_month || 5 } } });
}

async function upgradePlan(req, res) {
  const { plan_name } = req.body;
  if (!plan_name) return res.status(400).json({ error: 'plan_name required' });
  const plan = await prisma.subscriptionPlan.findFirst({ where: { name: plan_name } });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  const iid = req.user.institution_id;
  await prisma.subscription.updateMany({ where: { institution_id: iid, status: 'ACTIVE' }, data: { status: 'CANCELLED' } });
  const sub = await prisma.subscription.create({ data: { institution_id: iid, plan_id: plan.id, status: 'ACTIVE', expires_at: new Date(Date.now() + 30 * 86400000) }, include: { plan: true } });
  await prisma.institution.update({ where: { id: iid }, data: { plan_id: plan.id } });
  res.json({ subscription: sub, message: `Upgraded to ${plan_name}` });
}

module.exports = { getPlans, getCurrent, upgradePlan };
