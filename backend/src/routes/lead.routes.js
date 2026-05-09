const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const lc = require('../controllers/lead.controller');
const tc = require('../controllers/task.controller');
const nc = require('../controllers/note.controller');
const cc = require('../controllers/communication.controller');
const pc = require('../controllers/payment.controller');
const dc = require('../controllers/document.controller');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const storage = multer.diskStorage({ destination: process.env.UPLOAD_DIR || './uploads', filename: (_, f, cb) => cb(null, `${uuidv4()}${path.extname(f.originalname)}`) });
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

r.use(authenticate);
r.get('/', lc.getLeads);
r.get('/export', lc.exportLeads);
r.post('/', lc.createLead);
r.post('/bulk-import', upload.single('file'), lc.bulkImport);
r.get('/:id', lc.getLead);
r.put('/:id', lc.updateLead);
r.delete('/:id', lc.deleteLead);
r.put('/:id/assign', lc.assignLead);

// Invite to portal
r.post('/:id/invite-to-portal', async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id, is_deleted: false } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (!lead.email) return res.status(400).json({ error: 'Lead must have an email' });
    const token = uuidv4();
    await prisma.applicantPortalUser.upsert({ where: { lead_id: lead.id }, update: { invite_token: token }, create: { institution_id: req.user.institution_id, lead_id: lead.id, email: lead.email, password_hash: '', invite_token: token } });
    await prisma.lead.update({ where: { id: lead.id }, data: { portal_invited: true } });
    const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/portal/register?token=${token}`;
    console.log(`[Portal Invite] ${lead.email}: ${portalUrl}`);
    res.json({ message: 'Invite sent', portal_url: portalUrl, invite_token: token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Enrollment stage update
r.put('/:id/enrollment-stage', async (req, res) => {
  try {
    const STAGES = ['NEW', 'COUNSELLING', 'APPLIED', 'PAYMENT_PENDING', 'ENROLLED'];
    const { stage } = req.body;
    if (!STAGES.includes(stage)) return res.status(400).json({ error: 'Invalid stage' });
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id, is_deleted: false } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const updated = await prisma.lead.update({ where: { id: req.params.id }, data: { enrollment_stage: stage } });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle verification
r.put('/:id/verify', async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id, is_deleted: false } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const updated = await prisma.lead.update({ where: { id: req.params.id }, data: { is_verified: !lead.is_verified } });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.get('/:id/tasks', tc.getLeadTasks);
r.get('/:id/notes', nc.getLeadNotes);
r.get('/:id/communications', cc.getLeadComms);
r.get('/:id/payments', pc.getLeadPayments);
r.get('/:id/documents', dc.getLeadDocs);
r.post('/:id/documents', upload.single('file'), dc.uploadDoc);
module.exports = r;
