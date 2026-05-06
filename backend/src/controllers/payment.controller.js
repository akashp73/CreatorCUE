const { PrismaClient } = require('@prisma/client');
const paymentService = require('../services/paymentService');
const prisma = new PrismaClient();

async function listPayments(req, res) {
  const { status, payment_type, date_from, date_to } = req.query;
  const where = { institution_id: req.user.institution_id };
  if (status) where.status = status;
  if (payment_type) where.payment_type = payment_type;
  if (date_from || date_to) { where.created_at = {}; if (date_from) where.created_at.gte = new Date(date_from); if (date_to) where.created_at.lte = new Date(date_to); }

  const [payments, agg] = await Promise.all([
    prisma.payment.findMany({ where, include: { lead: { select: { id: true, name: true, phone: true } } }, orderBy: { created_at: 'desc' } }),
    prisma.payment.aggregate({ where: { institution_id: req.user.institution_id }, _sum: { amount: true } }),
  ]);

  const pending = await prisma.payment.aggregate({ where: { institution_id: req.user.institution_id, status: 'PENDING' }, _sum: { amount: true } });
  const overdue = await prisma.payment.count({ where: { institution_id: req.user.institution_id, status: 'PENDING', due_date: { lt: new Date() } } });

  res.json({ payments, summary: { total_collected: agg._sum.amount || 0, total_pending: pending._sum.amount || 0, overdue_count: overdue } });
}

async function createPayment(req, res) {
  const { lead_id, amount, payment_type, due_date } = req.body;
  if (!lead_id || !amount || !payment_type) return res.status(400).json({ error: 'lead_id, amount, payment_type required' });
  try {
    const payment = await paymentService.createPayment({ institution_id: req.user.institution_id, lead_id, amount: parseInt(amount), payment_type, due_date });
    res.status(201).json(payment);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function updatePaymentStatus(req, res) {
  const { status } = req.body;
  const payment = await prisma.payment.findFirst({ where: { id: req.params.id, institution_id: req.user.institution_id } });
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  const updated = await prisma.payment.update({ where: { id: req.params.id }, data: { status, ...(status === 'PAID' && { paid_at: new Date() }) } });
  res.json(updated);
}

async function remindPayment(req, res) {
  const { type = 'WHATSAPP' } = req.body;
  try {
    const result = await paymentService.sendReminder(req.params.id, req.user.institution_id, type);
    res.json(result);
  } catch (err) { res.status(400).json({ error: err.message }); }
}

async function getLeadPayments(req, res) {
  const payments = await prisma.payment.findMany({ where: { lead_id: req.params.id }, orderBy: { created_at: 'desc' } });
  res.json(payments);
}

module.exports = { listPayments, createPayment, updatePaymentStatus, remindPayment, getLeadPayments };
