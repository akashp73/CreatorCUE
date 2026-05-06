const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const workflowEngine = require('../services/workflowEngine');

const getLeads = async (req, res, next) => {
  try {
    const { institution_id, role, id: user_id } = req.user;
    const {
      page = 1, limit = 20, search, status, source, score_label,
      assigned_to, course_interested, city, sort = 'created_at', order = 'desc',
    } = req.query;

    const where = { institution_id, is_deleted: false };
    if (role === 'COUNSELLOR') where.assigned_to = user_id;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (source) where.source = source;
    if (score_label) where.score_label = score_label;
    if (assigned_to) where.assigned_to = assigned_to;
    if (course_interested) where.course_interested = { contains: course_interested };
    if (city) where.city = { contains: city };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      data: leads,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

const getLead = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, institution_id, is_deleted: false },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        activityLogs: { orderBy: { created_at: 'desc' }, take: 20 },
        tasks: { orderBy: { due_at: 'asc' } },
        notes: { orderBy: { created_at: 'desc' }, include: { author: { select: { id: true, name: true } } } },
        communicationLogs: { orderBy: { sent_at: 'desc' }, take: 10 },
        payments: true,
        documents: true,
      },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
};

const createLead = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const { name, email, phone, city, course_interested, source, assigned_to, status } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

    const lead = await prisma.lead.create({
      data: {
        institution_id,
        name, email, phone,
        city: city || null,
        course_interested: course_interested || null,
        source: source || 'OTHER',
        assigned_to: assigned_to || null,
        status: status || 'NEW',
      },
    });

    // Update usage metric
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await prisma.usageMetric.upsert({
      where: { institution_id_month: { institution_id, month } },
      update: { leads_created: { increment: 1 } },
      create: { institution_id, month, leads_created: 1, campaigns_sent: 0, users_active: 0 },
    });

    // Trigger workflow event
    workflowEngine.emit('lead.created', { ...lead, institution_id });

    res.status(201).json(lead);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A lead with this phone number already exists' });
    next(err);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const existing = await prisma.lead.findFirst({
      where: { id: req.params.id, institution_id, is_deleted: false },
    });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const {
      name, email, phone, city, course_interested, source, assigned_to, status,
      activity_score, score_label, portal_invited,
    } = req.body;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(course_interested !== undefined && { course_interested }),
        ...(source !== undefined && { source }),
        ...(assigned_to !== undefined && { assigned_to }),
        ...(status !== undefined && { status }),
        ...(activity_score !== undefined && { activity_score }),
        ...(score_label !== undefined && { score_label }),
        ...(portal_invited !== undefined && { portal_invited }),
      },
    });

    if (existing.status !== lead.status) {
      workflowEngine.emit('lead.status_changed', { ...lead, institution_id, old_status: existing.status });
    }

    res.json(lead);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Phone number already in use' });
    next(err);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id } });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    await prisma.lead.update({ where: { id: req.params.id }, data: { is_deleted: true } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const bulkImport = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const leads = req.body.leads;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array is required' });
    }

    let created = 0, failed = 0, errors = [];
    for (const l of leads) {
      try {
        await prisma.lead.create({
          data: {
            institution_id,
            name: l.name,
            phone: l.phone,
            email: l.email || null,
            city: l.city || null,
            course_interested: l.course_interested || null,
            source: l.source || 'OTHER',
          },
        });
        created++;
      } catch (e) {
        failed++;
        errors.push({ phone: l.phone, error: e.message });
      }
    }

    // Update usage metric
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (created > 0) {
      await prisma.usageMetric.upsert({
        where: { institution_id_month: { institution_id, month } },
        update: { leads_created: { increment: created } },
        create: { institution_id, month, leads_created: created, campaigns_sent: 0, users_active: 0 },
      });
    }

    res.status(201).json({ created, failed, errors });
  } catch (err) {
    next(err);
  }
};

const getLeadActivity = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, institution_id, is_deleted: false },
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const logs = await prisma.activityLog.findMany({
      where: { lead_id: req.params.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

const assignLead = async (req, res, next) => {
  try {
    const { institution_id } = req.user;
    const { assigned_to } = req.body;
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, institution_id, is_deleted: false } });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const updated = await prisma.lead.update({ where: { id: req.params.id }, data: { assigned_to } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, bulkImport, getLeadActivity, assignLead };
