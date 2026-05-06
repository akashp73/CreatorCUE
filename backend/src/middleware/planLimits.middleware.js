const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware factory to check plan limits before creating resources.
 * Usage: checkPlanLimits('leads'), checkPlanLimits('campaigns'), etc.
 */
const checkPlanLimits = (resource) => async (req, res, next) => {
  try {
    const institution_id = req.user && req.user.institution_id;
    if (!institution_id) return next();

    // Load active subscription + plan
    const subscription = await prisma.subscription.findUnique({
      where: { institution_id },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'No active subscription found.',
        upgrade_required: true,
      });
    }

    const plan = subscription.plan;

    // Current month string e.g. "2024-03"
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Load usage metric
    const usage = await prisma.usageMetric.findUnique({
      where: { institution_id_month: { institution_id, month } },
    });

    switch (resource) {
      case 'leads': {
        if (plan.max_leads !== -1) {
          const count = usage ? usage.leads_created : 0;
          if (count >= plan.max_leads) {
            return res.status(403).json({
              error: `Lead limit reached (${plan.max_leads}). Please upgrade your plan.`,
              upgrade_required: true,
            });
          }
        }
        break;
      }
      case 'users': {
        if (plan.max_users !== -1) {
          const count = await prisma.user.count({ where: { institution_id, is_active: true } });
          if (count >= plan.max_users) {
            return res.status(403).json({
              error: `User limit reached (${plan.max_users}). Please upgrade your plan.`,
              upgrade_required: true,
            });
          }
        }
        break;
      }
      case 'campaigns': {
        if (plan.max_campaigns_per_month !== -1) {
          const count = usage ? usage.campaigns_sent : 0;
          if (count >= plan.max_campaigns_per_month) {
            return res.status(403).json({
              error: `Campaign limit reached (${plan.max_campaigns_per_month}/month). Please upgrade your plan.`,
              upgrade_required: true,
            });
          }
        }
        break;
      }
      case 'whatsapp': {
        if (!plan.has_whatsapp) {
          return res.status(403).json({
            error: 'WhatsApp is not available in your current plan. Please upgrade.',
            upgrade_required: true,
          });
        }
        break;
      }
      case 'payments': {
        if (!plan.has_payments) {
          return res.status(403).json({
            error: 'Payment management is not available in your current plan. Please upgrade.',
            upgrade_required: true,
          });
        }
        break;
      }
      case 'portal': {
        if (!plan.has_applicant_portal) {
          return res.status(403).json({
            error: 'Applicant portal is not available in your current plan. Please upgrade.',
            upgrade_required: true,
          });
        }
        break;
      }
      default:
        break;
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkPlanLimits };
