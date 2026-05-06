const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whatsappService = require('./whatsappService');
const emailService = require('./emailService');

let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  console.warn('[Payment] Razorpay init failed:', e.message);
}

/**
 * Create a payment record and optionally a Razorpay payment link.
 */
const createPayment = async ({ institution_id, lead_id, amount, payment_type, due_date }) => {
  const payment = await prisma.payment.create({
    data: {
      institution_id,
      lead_id,
      amount,
      payment_type,
      due_date: due_date ? new Date(due_date) : null,
      status: 'PENDING',
    },
  });

  let paymentLink = `/pay/${payment.id}`;
  let gatewayRef = null;

  if (razorpay) {
    try {
      const lead = await prisma.lead.findFirst({ where: { id: lead_id } });
      const link = await razorpay.paymentLink.create({
        amount: amount * 100, // paise
        currency: 'INR',
        accept_partial: false,
        description: `${payment_type} - EduCRM`,
        customer: {
          name: lead ? lead.name : 'Student',
          contact: lead ? lead.phone : '',
          email: lead ? (lead.email || '') : '',
        },
        notify: { sms: true, email: true },
        reminder_enable: true,
        reference_id: payment.id,
        callback_url: `${process.env.FRONTEND_URL || ''}/payment/callback`,
        callback_method: 'get',
      });
      paymentLink = link.short_url || link.id;
      gatewayRef = link.id;
    } catch (rzErr) {
      console.warn('[Payment] Razorpay link creation failed:', rzErr.message);
    }
  } else {
    console.log(`[Payment MOCK] Payment link: /pay/${payment.id}`);
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      payment_link: paymentLink,
      payment_gateway_ref: gatewayRef,
    },
  });

  return updated;
};

/**
 * Send a payment reminder via WhatsApp or Email.
 */
const sendReminder = async (payment_id, institution_id, type = 'WHATSAPP') => {
  const payment = await prisma.payment.findFirst({
    where: { id: payment_id, institution_id },
    include: { lead: true },
  });
  if (!payment) throw new Error('Payment not found');

  const dueStr = payment.due_date
    ? new Date(payment.due_date).toLocaleDateString('en-IN')
    : 'N/A';

  const message = `Dear ${payment.lead.name}, your payment of ₹${payment.amount} for ${payment.payment_type} is due on ${dueStr}. Please pay at: ${payment.payment_link}`;

  if (type === 'WHATSAPP') {
    // Find a whatsapp template for reminders; fallback to mock
    const template = await prisma.whatsappTemplate.findFirst({
      where: { institution_id },
    });
    if (template) {
      await whatsappService.send({
        lead_id: payment.lead_id,
        template_id: template.id,
        institution_id,
        variables: {
          amount: String(payment.amount),
          due_date: dueStr,
          payment_link: payment.payment_link || '',
        },
      });
    } else {
      console.log(`[Reminder MOCK WhatsApp] ${message}`);
      await prisma.communicationLog.create({
        data: {
          lead_id: payment.lead_id,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          content: message,
          status: 'SENT',
        },
      });
    }
  } else if (type === 'EMAIL') {
    const template = await prisma.emailTemplate.findFirst({
      where: { institution_id },
    });
    if (template) {
      await emailService.sendEmail({
        lead_id: payment.lead_id,
        template_id: template.id,
        institution_id,
        custom_variables: {
          amount: String(payment.amount),
          due_date: dueStr,
          payment_link: payment.payment_link || '',
        },
      });
    } else {
      console.log(`[Reminder MOCK Email] ${message}`);
      await prisma.communicationLog.create({
        data: {
          lead_id: payment.lead_id,
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          content: message,
          status: 'SENT',
        },
      });
    }
  }

  return { success: true, message };
};

module.exports = { createPayment, sendReminder };
