const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list(req, res) {
  const rules = await prisma.scoreRule.findMany({ where: { institution_id: req.user.institution_id } });
  res.json(rules);
}

async function create(req, res) {
  const { activity_type, points } = req.body;
  if (!activity_type || points === undefined) return res.status(400).json({ error: 'activity_type and points required' });
  const rule = await prisma.scoreRule.upsert({ where: { institution_id_activity_type: { institution_id: req.user.institution_id, activity_type } }, update: { points: parseInt(points) }, create: { institution_id: req.user.institution_id, activity_type, points: parseInt(points) } });
  res.status(201).json(rule);
}

async function update(req, res) {
  const { points } = req.body;
  const rule = await prisma.scoreRule.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  const updated = await prisma.scoreRule.update({ where: { id: req.params.id }, data: { points: parseInt(points) } });
  res.json(updated);
}

module.exports = { list, create, update };
