const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

const PORTAL_SECRET = process.env.JWT_SECRET;

function portalToken(user) { return jwt.sign({ portalUserId: user.id, leadId: user.lead_id, institutionId: user.institution_id }, PORTAL_SECRET, { expiresIn: '7d' }); }

async function requirePortal(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.portal = jwt.verify(auth.slice(7), PORTAL_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

async function portalLogin(req, res) {
  const { email, password } = req.body;
  const user = await prisma.applicantPortalUser.findFirst({ where: { email: email?.toLowerCase() }, include: { institution: { select: { name: true, logo_url: true, primary_color: true } } } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: portalToken(user), institution: user.institution });
}

async function validateInvite(req, res) {
  const user = await prisma.applicantPortalUser.findUnique({ where: { invite_token: req.params.token }, include: { lead: { select: { name: true, email: true, course_interested: true } }, institution: { select: { name: true, logo_url: true } } } });
  if (!user) return res.status(404).json({ error: 'Invalid or expired invite link' });
  res.json({ token: req.params.token, lead: user.lead, institution: user.institution });
}

async function register(req, res) {
  const { token, password } = req.body;
  const user = await prisma.applicantPortalUser.findUnique({ where: { invite_token: token } });
  if (!user) return res.status(400).json({ error: 'Invalid invite' });
  const hash = await bcrypt.hash(password, 12);
  const updated = await prisma.applicantPortalUser.update({ where: { id: user.id }, data: { password_hash: hash, invite_token: null } });
  res.json({ token: portalToken(updated), message: 'Account created' });
}

async function getMyApplication(req, res) {
  const lead = await prisma.lead.findUnique({ where: { id: req.portal.leadId }, include: { assignee: { select: { name: true } }, activityLogs: { orderBy: { created_at: 'desc' }, take: 10 } } });
  if (!lead) return res.status(404).json({ error: 'Not found' });
  res.json(lead);
}

async function getMyPayments(req, res) {
  const payments = await prisma.payment.findMany({ where: { lead_id: req.portal.leadId }, orderBy: { created_at: 'desc' } });
  res.json(payments);
}

async function getMyDocuments(req, res) {
  const docs = await prisma.document.findMany({ where: { lead_id: req.portal.leadId }, orderBy: { uploaded_at: 'desc' } });
  res.json(docs);
}

async function uploadMyDocument(req, res) {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  const { document_type = 'OTHER' } = req.body;
  const doc = await prisma.document.create({ data: { lead_id: req.portal.leadId, uploaded_by_type: 'APPLICANT', uploaded_by_id: req.portal.portalUserId, file_name: req.file.originalname, file_url: `/uploads/${req.file.filename}`, document_type } });
  res.status(201).json(doc);
}

module.exports = { requirePortal, portalLogin, validateInvite, register, getMyApplication, getMyPayments, getMyDocuments, uploadMyDocument };
