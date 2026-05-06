const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

/**
 * Launch a campaign by processing all matching leads in the background.
 */
const launchCampaign = async (campaign_id, institution_id) => {
  setImmediate(async () => {
    try {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaign_id, institution_id },
      });
      if (!campaign) {
        console.error(`[Campaign] Campaign ${campaign_id} not found`);
        return;
      }

      // Parse target filter
      let targetFilter = {};
      try { targetFilter = JSON.parse(campaign.target_filter); } catch (_) {}

      // Build lead query from filter
      const where = { institution_id, is_deleted: false };
      if (targetFilter.status) where.status = targetFilter.status;
      if (targetFilter.score_label) where.score_label = targetFilter.score_label;
      if (targetFilter.source) where.source = targetFilter.source;
      if (targetFilter.course_interested) where.course_interested = targetFilter.course_interested;
      if (targetFilter.city) where.city = targetFilter.city;

      const leads = await prisma.lead.findMany({ where });
      console.log(`[Campaign] "${campaign.name}" targeting ${leads.length} leads via ${campaign.channel}`);

      // Update status to RUNNING
      await prisma.campaign.update({
        where: { id: campaign_id },
        data: { status: 'RUNNING' },
      });

      let sent = 0;
      for (const lead of leads) {
        try {
          if (campaign.channel === 'EMAIL') {
            await emailService.sendEmail({
              lead_id: lead.id,
              template_id: campaign.template_id,
              institution_id,
            });
          } else if (campaign.channel === 'WHATSAPP') {
            await whatsappService.send({
              lead_id: lead.id,
              template_id: campaign.template_id,
              institution_id,
            });
          }
          sent++;
        } catch (e) {
          console.warn(`[Campaign] Failed to send to lead ${lead.id}:`, e.message);
        }
      }

      // Update sent count and status
      await prisma.campaign.update({
        where: { id: campaign_id },
        data: { sent_count: sent, status: 'COMPLETED' },
      });

      // Update usage metric
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await prisma.usageMetric.upsert({
        where: { institution_id_month: { institution_id, month } },
        update: { campaigns_sent: { increment: 1 } },
        create: { institution_id, month, campaigns_sent: 1, leads_created: 0, users_active: 0 },
      });

      console.log(`[Campaign] "${campaign.name}" completed. Sent: ${sent}/${leads.length}`);
    } catch (err) {
      console.error('[Campaign] Launch error:', err.message);
      try {
        await prisma.campaign.update({
          where: { id: campaign_id },
          data: { status: 'FAILED' },
        });
      } catch (_) {}
    }
  });
};

module.exports = { launchCampaign };
