const { PrismaClient } = require('@prisma/client');
const campaignService = require('../services/campaignService');
const prisma = new PrismaClient();

async function listCampaigns(req, res) {
  const campaigns = await prisma.campaign.findMany({ where: { institution_id: req.user.institution_id }, orderBy: { created_at: 'desc' } });
  res.json(campaigns.map(c => ({ ...c, target_filter: JSON.parse(c.target_filter) })));
}

async function createCampaign(req, res) {
  const { name, channel, template_id, target_filter = {} } = req.body;
  if (!name || !channel || !template_id) return res.status(400).json({ error: 'name, channel, template_id required' });
  const campaign = await prisma.campaign.create({ data: { institution_id: req.user.institution_id, name, channel, template_id, target_filter: JSON.stringify(target_filter), status: 'DRAFT' } });
  res.status(201).json({ ...campaign, target_filter });
}

async function launchCampaign(req, res) {
  const campaign = await prisma.campaign.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  await prisma.campaign.update({ where: { id: req.params.id }, data: { status: 'RUNNING' } });
  setImmediate(() => campaignService.launchCampaign(req.params.id, req.user.institution_id));
  res.json({ message: 'Campaign launched', campaign_id: req.params.id });
}

async function previewAudience(req, res) {
  const { target_filter = {} } = req.body;
  const where = { institution_id: req.user.institution_id, is_deleted: false };
  if (target_filter.source) where.source = target_filter.source;
  if (target_filter.status) where.status = target_filter.status;
  if (target_filter.score_min) where.activity_score = { gte: parseInt(target_filter.score_min) };
  if (target_filter.score_max) where.activity_score = { ...where.activity_score, lte: parseInt(target_filter.score_max) };
  const count = await prisma.lead.count({ where });
  const sample = await prisma.lead.findMany({ where, take: 5, select: { id: true, name: true, phone: true } });
  res.json({ count, sample });
}

module.exports = { listCampaigns, createCampaign, launchCampaign, previewAudience };
