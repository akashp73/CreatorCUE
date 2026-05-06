const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createNote(req, res) {
  const { lead_id, content } = req.body;
  if (!lead_id || !content) return res.status(400).json({ error: 'lead_id and content required' });

  const lead = await prisma.lead.findFirst({ where: { id: lead_id, institution_id: req.user.institution_id, is_deleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const note = await prisma.note.create({ data: { lead_id, created_by: req.user.id, content }, include: { author: { select: { id: true, name: true } } } });
  res.status(201).json(note);
}

async function getLeadNotes(req, res) {
  const notes = await prisma.note.findMany({ where: { lead_id: req.params.id }, include: { author: { select: { id: true, name: true } } }, orderBy: { created_at: 'desc' } });
  res.json(notes);
}

module.exports = { createNote, getLeadNotes };
