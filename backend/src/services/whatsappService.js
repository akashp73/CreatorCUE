const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const { replacePlaceholders } = require('./emailService');

/**
 * Send WhatsApp message to a lead using a template.
 */
const send = async ({ lead_id, template_id, institution_id, variables = {} }) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: lead_id, institution_id } });
    if (!lead) throw new Error(`Lead ${lead_id} not found`);

    const template = await prisma.whatsappTemplate.findFirst({
      where: { id: template_id, institution_id },
    });
    if (!template) throw new Error(`WhatsApp template ${template_id} not found`);

    const allVariables = {
      name: lead.name,
      phone: lead.phone,
      course: lead.course_interested || '',
      city: lead.city || '',
      ...variables,
    };

    const message = replacePlaceholders(template.message_body, allVariables);
    let status = 'SENT';

    if (process.env.WATI_API_KEY && process.env.WATI_API_URL) {
      try {
        await axios.post(
          `${process.env.WATI_API_URL}/api/v1/sendTemplateMessage`,
          {
            template_name: template.name,
            broadcast_name: template.name,
            parameters: Object.entries(allVariables).map(([k, v]) => ({ name: k, value: v })),
            phone_number: lead.phone,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WATI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );
        console.log(`[WhatsApp] WATI sent to ${lead.phone}`);
      } catch (watiErr) {
        console.warn('[WhatsApp] WATI error:', watiErr.message);
        status = 'FAILED';
      }
    } else {
      console.log(`[WhatsApp MOCK] To: ${lead.phone} | Message: ${message}`);
    }

    // Log to CommunicationLog
    await prisma.communicationLog.create({
      data: {
        lead_id,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        content: message,
        status,
      },
    });

    return { success: status === 'SENT', message };
  } catch (err) {
    console.error('[WhatsApp] Send error:', err.message);
    try {
      await prisma.communicationLog.create({
        data: {
          lead_id,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          content: `WhatsApp send failed: ${err.message}`,
          status: 'FAILED',
        },
      });
    } catch (_) {}
    return { success: false, error: err.message };
  }
};

module.exports = { send };
