const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getMyTasks(req, res) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const tasks = await prisma.task.findMany({
    where: { assigned_to: req.user.id, is_completed: false },
    include: { lead: { select: { id: true, name: true, phone: true } } },
    orderBy: { due_at: 'asc' },
  });

  const overdue = tasks.filter(t => t.due_at < todayStart);
  const due_today = tasks.filter(t => t.due_at >= todayStart && t.due_at < todayEnd);
  const upcoming = tasks.filter(t => t.due_at >= todayEnd);

  res.json({ overdue, due_today, upcoming });
}

async function createTask(req, res) {
  const { lead_id, assigned_to, title, due_at } = req.body;
  if (!lead_id || !title || !due_at) return res.status(400).json({ error: 'lead_id, title, due_at required' });

  const lead = await prisma.lead.findFirst({ where: { id: lead_id, institution_id: req.user.institution_id, is_deleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const assignee = assigned_to || req.user.id;
  const task = await prisma.task.create({ data: { lead_id, assigned_to: assignee, title, due_at: new Date(due_at) }, include: { lead: { select: { id: true, name: true } } } });
  res.status(201).json(task);
}

async function completeTask(req, res) {
  const task = await prisma.task.findFirst({ where: { id: req.params.id, assigned_to: req.user.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const updated = await prisma.task.update({ where: { id: req.params.id }, data: { is_completed: true, completed_at: new Date() } });
  res.json(updated);
}

async function getLeadTasks(req, res) {
  const tasks = await prisma.task.findMany({ where: { lead_id: req.params.id }, include: { assignee: { select: { id: true, name: true } } }, orderBy: { due_at: 'asc' } });
  res.json(tasks);
}

module.exports = { getMyTasks, createTask, completeTask, getLeadTasks };
