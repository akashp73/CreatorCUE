const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function uploadDoc(req, res) {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  const { document_type = 'OTHER' } = req.body;
  const lead = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id, is_deleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const doc = await prisma.document.create({ data: { lead_id: req.params.id, uploaded_by_type: 'COUNSELLOR', uploaded_by_id: req.user.id, file_name: req.file.originalname, file_url: `/uploads/${req.file.filename}`, document_type } });
  res.status(201).json(doc);
}

async function getLeadDocs(req, res) {
  const docs = await prisma.document.findMany({ where: { lead_id: req.params.id }, orderBy: { uploaded_at: 'desc' } });
  res.json(docs);
}

async function deleteDoc(req, res) {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const lead = await prisma.lead.findFirst({ where: { id: doc.lead_id, institution_id: req.user.institution_id } });
  if (!lead) return res.status(403).json({ error: 'Access denied' });
  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(doc.file_url));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}

module.exports = { uploadDoc, getLeadDocs, deleteDoc };
