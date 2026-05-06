const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const prisma = new PrismaClient();

async function getBranding(req, res) {
  const { subdomain } = req.query;
  const where = subdomain ? { subdomain } : { id: req.user?.institution_id };
  const inst = await prisma.institution.findFirst({ where, select: { id: true, name: true, logo_url: true, primary_color: true, subdomain: true } });
  if (!inst) return res.status(404).json({ error: 'Institution not found' });
  res.json(inst);
}

async function updateBranding(req, res) {
  const { name, logo_url, primary_color } = req.body;
  const updated = await prisma.institution.update({ where: { id: req.user.institution_id }, data: { ...(name && { name }), ...(logo_url !== undefined && { logo_url }), ...(primary_color && { primary_color }) } });
  res.json(updated);
}

async function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  const logoUrl = `/uploads/${req.file.filename}`;
  await prisma.institution.update({ where: { id: req.user.institution_id }, data: { logo_url: logoUrl } });
  res.json({ logo_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}${logoUrl}` });
}

async function getTeam(req, res) {
  const users = await prisma.user.findMany({ where: { institution_id: req.user.institution_id }, select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true }, orderBy: { created_at: 'asc' } });
  res.json(users);
}

async function createTeamMember(req, res) {
  const bcrypt = require('bcryptjs');
  const { name, email, password, role = 'COUNSELLOR' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const existing = await prisma.user.findFirst({ where: { institution_id: req.user.institution_id, email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { institution_id: req.user.institution_id, name, email: email.toLowerCase(), password_hash: hash, role }, select: { id: true, name: true, email: true, role: true, is_active: true } });
  res.status(201).json(user);
}

async function updateTeamMember(req, res) {
  const bcrypt = require('bcryptjs');
  const member = await prisma.user.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!member) return res.status(404).json({ error: 'User not found' });
  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.role) data.role = req.body.role;
  if (req.body.is_active !== undefined) data.is_active = req.body.is_active;
  if (req.body.password) data.password_hash = await bcrypt.hash(req.body.password, 12);
  const updated = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, name: true, email: true, role: true, is_active: true } });
  res.json(updated);
}

module.exports = { getBranding, updateBranding, uploadLogo, getTeam, createTeamMember, updateTeamMember };
