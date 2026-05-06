const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let transporter = null;

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  if (transporter) return transporter;
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  } catch (e) {
    console.warn('[Email] Failed to create transporter:', e.message);
    return null;
  }
};

/**
 * Replace {variable} placeholders in template string
 */
const replacePlaceholders = (template, variables) => {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] !== undefined ? variables[key] : `{${key}}`);
};

/**
 * Send email to a lead using a template.
 */
const sendEmail = async ({ lead_id, template_id, institution_id, custom_variables = {} }) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: lead_id, institution_id } });
    if (!lead) throw new Error(`Lead ${lead_id} not found`);

    const template = await prisma.emailTemplate.findFirst({
      where: { id: template_id, institution_id },
    });
    if (!template) throw new Error(`Email template ${template_id} not found`);

    const variables = {
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone,
      course: lead.course_interested || '',
      city: lead.city || '',
      ...custom_variables,
    };

    const subject = replacePlaceholders(template.subject, variables);
    const htmlBody = replacePlaceholders(template.html_body, variables);

    const smtp = getTransporter();
    if (smtp && lead.email) {
      await smtp.sendMail({
        from: process.env.SMTP_USER,
        to: lead.email,
        subject,
        html: htmlBody,
      });
      console.log(`[Email] Sent to ${lead.email}: ${subject}`);
    } else {
      console.log(`[Email MOCK] To: ${lead.email || 'no-email'} | Subject: ${subject}`);
      console.log(`[Email MOCK] Body: ${htmlBody.substring(0, 200)}`);
    }

    // Log to CommunicationLog
    await prisma.communicationLog.create({
      data: {
        lead_id,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        content: `Subject: ${subject}\n${htmlBody}`,
        status: 'SENT',
      },
    });

    return { success: true, subject };
  } catch (err) {
    console.error('[Email] Send error:', err.message);
    // Log failure
    try {
      await prisma.communicationLog.create({
        data: {
          lead_id,
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          content: `Email send failed: ${err.message}`,
          status: 'FAILED',
        },
      });
    } catch (_) {}
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail, replacePlaceholders };
