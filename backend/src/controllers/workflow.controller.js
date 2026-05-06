const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listWorkflows(req, res) {
  const wf = await prisma.workflow.findMany({ where: { institution_id: req.user.institution_id }, orderBy: { created_at: 'desc' } });
  res.json(wf.map(w => ({ ...w, trigger_conditions: JSON.parse(w.trigger_conditions), steps: JSON.parse(w.steps) })));
}

async function createWorkflow(req, res) {
  const { name, trigger_event, trigger_conditions = {}, steps = [] } = req.body;
  if (!name || !trigger_event) return res.status(400).json({ error: 'name and trigger_event required' });
  const wf = await prisma.workflow.create({ data: { institution_id: req.user.institution_id, name, trigger_event, trigger_conditions: JSON.stringify(trigger_conditions), steps: JSON.stringify(steps) } });
  res.status(201).json({ ...wf, trigger_conditions, steps });
}

async function updateWorkflow(req, res) {
  const wf = await prisma.workflow.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  const data = { ...req.body };
  if (data.trigger_conditions) data.trigger_conditions = JSON.stringify(data.trigger_conditions);
  if (data.steps) data.steps = JSON.stringify(data.steps);
  const updated = await prisma.workflow.update({ where: { id: req.params.id }, data });
  res.json({ ...updated, trigger_conditions: JSON.parse(updated.trigger_conditions), steps: JSON.parse(updated.steps) });
}

async function toggleWorkflow(req, res) {
  const wf = await prisma.workflow.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  const updated = await prisma.workflow.update({ where: { id: req.params.id }, data: { is_active: !wf.is_active } });
  res.json({ ...updated, trigger_conditions: JSON.parse(updated.trigger_conditions), steps: JSON.parse(updated.steps) });
}

module.exports = { listWorkflows, createWorkflow, updateWorkflow, toggleWorkflow };
