const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Email Templates ──────────────────────────────────────────
async function getEmailTemplates(req, res) {
  const templates = await prisma.emailTemplate.findMany({ where: { institution_id: req.user.institution_id }, orderBy: { created_at: 'desc' } });
  res.json(templates);
}

async function createEmailTemplate(req, res) {
  const { name, subject, html_body } = req.body;
  if (!name || !subject || !html_body) return res.status(400).json({ error: 'name, subject, html_body required' });
  const tpl = await prisma.emailTemplate.create({ data: { institution_id: req.user.institution_id, name, subject, html_body } });
  res.status(201).json(tpl);
}

async function updateEmailTemplate(req, res) {
  const tpl = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  const updated = await prisma.emailTemplate.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
}

async function deleteEmailTemplate(req, res) {
  const tpl = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  await prisma.emailTemplate.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}

// ── WhatsApp Templates ───────────────────────────────────────
async function getWaTemplates(req, res) {
  const templates = await prisma.whatsappTemplate.findMany({ where: { institution_id: req.user.institution_id }, orderBy: { created_at: 'desc' } });
  res.json(templates.map(t => ({ ...t, variables: JSON.parse(t.variables) })));
}

async function createWaTemplate(req, res) {
  const { name, message_body, variables = [] } = req.body;
  if (!name || !message_body) return res.status(400).json({ error: 'name and message_body required' });
  const tpl = await prisma.whatsappTemplate.create({ data: { institution_id: req.user.institution_id, name, message_body, variables: JSON.stringify(variables) } });
  res.status(201).json({ ...tpl, variables: JSON.parse(tpl.variables) });
}

async function updateWaTemplate(req, res) {
  const tpl = await prisma.whatsappTemplate.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  const data = { ...req.body };
  if (data.variables) data.variables = JSON.stringify(data.variables);
  const updated = await prisma.whatsappTemplate.update({ where: { id: req.params.id }, data });
  res.json({ ...updated, variables: JSON.parse(updated.variables) });
}

module.exports = { getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, getWaTemplates, createWaTemplate, updateWaTemplate };
