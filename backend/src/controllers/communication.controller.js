const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const prisma = new PrismaClient();

async function sendEmail(req, res) {
  const { lead_id, template_id, custom_variables = {} } = req.body;
  if (!lead_id || !template_id) return res.status(400).json({ error: 'lead_id and template_id required' });
  try {
    const result = await emailService.sendEmail({ lead_id, template_id, institution_id: req.user.institution_id, custom_variables });
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function sendWhatsApp(req, res) {
  const { lead_id, template_id, variables = {} } = req.body;
  if (!lead_id || !template_id) return res.status(400).json({ error: 'lead_id and template_id required' });
  try {
    const result = await whatsappService.send({ lead_id, template_id, institution_id: req.user.institution_id, variables });
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function getLeadComms(req, res) {
  const logs = await prisma.communicationLog.findMany({
    where: { lead_id: req.params.id },
    orderBy: { sent_at: 'desc' },
  });
  res.json(logs);
}

module.exports = { sendEmail, sendWhatsApp, getLeadComms };
