const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Redis setup with graceful fallback
let redis = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    redis.on('error', (err) => {
      console.warn('[Redis] Connection error, disabling Redis:', err.message);
      redis = null;
    });
  }
} catch (e) {
  console.warn('[Redis] Failed to initialize:', e.message);
  redis = null;
}

const DEFAULT_RULES = [
  { activity_type: 'form_fill', points: 15 },
  { activity_type: 'app_open', points: 5 },
  { activity_type: 'module_viewed', points: 8 },
  { activity_type: 'webinar_attended', points: 20 },
  { activity_type: 'payment_initiated', points: 25 },
  { activity_type: 'email_opened', points: 3 },
  { activity_type: 'whatsapp_replied', points: 10 },
];

/**
 * Get score label from numeric score
 */
const getScoreLabel = (score, thresholds = { hot: 80, warm: 50 }) => {
  if (score >= thresholds.hot) return 'HOT';
  if (score >= thresholds.warm) return 'WARM';
  return 'COLD';
};

/**
 * Process a scoring activity event
 */
const processActivity = async ({ lead_id, activity_type, institution_id, idempotency_key }) => {
  const key = idempotency_key;

  // 1. Check idempotency key in Redis
  if (redis) {
    try {
      const exists = await redis.get(`idempotency:${key}`);
      if (exists) return { skipped: true };
    } catch (e) {
      console.warn('[Redis] idempotency check failed:', e.message);
      redis = null;
    }
  }

  // Fallback idempotency: check ActivityLog description
  if (!redis && key) {
    const existing = await prisma.activityLog.findFirst({
      where: {
        lead_id,
        description: { contains: `[key:${key}]` },
      },
    });
    if (existing) return { skipped: true };
  }

  // 2. Find ScoreRule for activity_type in institution, fallback to DEFAULT_RULES
  let points = 0;
  const institutionRule = await prisma.scoreRule.findUnique({
    where: { institution_id_activity_type: { institution_id, activity_type } },
  });

  if (institutionRule) {
    points = institutionRule.points;
  } else {
    const defaultRule = DEFAULT_RULES.find((r) => r.activity_type === activity_type);
    points = defaultRule ? defaultRule.points : 5;
  }

  // 3. Load current lead
  const lead = await prisma.lead.findFirst({ where: { id: lead_id, institution_id } });
  if (!lead) throw new Error('Lead not found');

  const newScore = Math.max(0, lead.activity_score + points);
  const newLabel = getScoreLabel(newScore);

  // 4. Update lead
  const updatedLead = await prisma.lead.update({
    where: { id: lead_id },
    data: {
      activity_score: newScore,
      score_label: newLabel,
      last_activity_at: new Date(),
    },
  });

  // 5. Create ActivityLog embedding idempotency_key
  await prisma.activityLog.create({
    data: {
      lead_id,
      activity_type,
      points_added: points,
      description: `${activity_type} event (+${points}pts) [key:${key}]`,
    },
  });

  // 6. Store idempotency key in Redis
  if (redis) {
    try {
      await redis.setex(`idempotency:${key}`, 86400, '1');
    } catch (e) {
      console.warn('[Redis] setex failed:', e.message);
    }
  }

  // 7. Auto-qualify if score > 80 and not already qualified/enrolled
  let auto_qualified = false;
  const nonQualifiedStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'];
  if (newScore > 80 && nonQualifiedStatuses.includes(lead.status)) {
    await prisma.lead.update({
      where: { id: lead_id },
      data: { status: 'QUALIFIED' },
    });
    auto_qualified = true;

    // Notify assigned counsellor
    if (lead.assigned_to) {
      const notificationService = require('./notificationService');
      await notificationService.sendPush(
        lead.assigned_to,
        'Lead Auto-Qualified!',
        `${lead.name} has been auto-qualified with score ${newScore}.`,
        { lead_id, score: newScore }
      );
    }
  }

  return {
    skipped: false,
    new_score: newScore,
    label: newLabel,
    points_added: points,
    auto_qualified,
  };
};

/**
 * Apply score decay: find leads inactive for >7 days, apply 0.9x multiplier
 */
const applyScoreDecay = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleLeads = await prisma.lead.findMany({
    where: {
      last_activity_at: { lt: sevenDaysAgo },
      is_deleted: false,
      activity_score: { gt: 0 },
    },
  });

  console.log(`[ScoreDecay] Processing ${staleLeads.length} stale leads`);

  for (const lead of staleLeads) {
    const newScore = Math.floor(lead.activity_score * 0.9);
    const newLabel = getScoreLabel(newScore);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { activity_score: newScore, score_label: newLabel },
    });
    await prisma.activityLog.create({
      data: {
        lead_id: lead.id,
        activity_type: 'score_decay',
        points_added: newScore - lead.activity_score, // negative
        description: `Score decay applied: ${lead.activity_score} → ${newScore} [key:decay-${lead.id}-${Date.now()}]`,
      },
    });
  }
};

module.exports = { getScoreLabel, processActivity, applyScoreDecay, DEFAULT_RULES };
