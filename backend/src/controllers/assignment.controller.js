const { PrismaClient } = require('@prisma/client');
const { previewNextAssignee } = require('../services/assignmentService');
const prisma = new PrismaClient();

async function getConfig(req, res) {
  const iid = req.user.institution_id;
  let config = await prisma.assignmentConfig.findUnique({ where: { institution_id: iid } });
  if (!config) {
    config = await prisma.assignmentConfig.create({
      data: { institution_id: iid, mode: 'MANUAL', counsellors: '[]' },
    });
  }

  // Enrich counsellors with current user names/roles
  let counsellors;
  try { counsellors = JSON.parse(config.counsellors); } catch { counsellors = []; }

  const users = await prisma.user.findMany({
    where: { institution_id: iid, is_active: true },
    select: { id: true, name: true, role: true },
  });

  const enriched = users.map(u => {
    const existing = counsellors.find(c => c.user_id === u.id);
    return { user_id: u.id, name: u.name, role: u.role, ratio: existing?.ratio ?? 1, remaining: existing?.remaining ?? 1 };
  });

  const nextUserId = await previewNextAssignee(iid);
  const nextUser = users.find(u => u.id === nextUserId);

  res.json({ mode: config.mode, counsellors: enriched, next_assignee: nextUser || null });
}

async function updateConfig(req, res) {
  const iid = req.user.institution_id;
  const { mode, counsellors } = req.body;
  if (!['MANUAL', 'AUTOMATIC'].includes(mode)) return res.status(400).json({ error: 'mode must be MANUAL or AUTOMATIC' });

  await prisma.assignmentConfig.upsert({
    where: { institution_id: iid },
    update: { mode, counsellors: JSON.stringify(counsellors || []) },
    create: { institution_id: iid, mode, counsellors: JSON.stringify(counsellors || []) },
  });

  res.json({ success: true });
}

async function getRules(req, res) {
  const rules = await prisma.assignmentRule.findMany({
    where: { institution_id: req.user.institution_id },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { priority: 'desc' },
  });
  res.json(rules);
}

async function addRule(req, res) {
  const iid = req.user.institution_id;
  const { rule_type, match_value, assigned_to, priority = 0 } = req.body;
  if (!rule_type || !match_value || !assigned_to) return res.status(400).json({ error: 'rule_type, match_value, assigned_to required' });
  if (!['COURSE', 'CITY'].includes(rule_type)) return res.status(400).json({ error: 'rule_type must be COURSE or CITY' });

  const user = await prisma.user.findFirst({ where: { id: assigned_to, institution_id: iid } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const rule = await prisma.assignmentRule.create({
    data: { institution_id: iid, rule_type, match_value, assigned_to, priority },
    include: { assignee: { select: { id: true, name: true } } },
  });
  res.status(201).json(rule);
}

async function deleteRule(req, res) {
  const rule = await prisma.assignmentRule.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  await prisma.assignmentRule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getConfig, updateConfig, getRules, addRule, deleteRule };
