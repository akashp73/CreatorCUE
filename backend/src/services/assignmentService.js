const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Weighted round-robin: pick the counsellor with the highest `remaining` slot.
 * Mutates `counsellors` in-place and returns the chosen user_id (or null).
 */
function pickNextCounsellor(counsellors) {
  const active = counsellors.filter(c => c.user_id && c.ratio > 0);
  if (!active.length) return null;

  let pool = active.filter(c => (c.remaining || 0) > 0);
  if (!pool.length) {
    // Refill
    active.forEach(c => { c.remaining = c.ratio; });
    pool = active;
  }

  pool.sort((a, b) => (b.remaining || 0) - (a.remaining || 0));
  pool[0].remaining = (pool[0].remaining || 0) - 1;
  return pool[0].user_id;
}

/**
 * Determine which counsellor to auto-assign a new lead to.
 * Rules take priority; falls back to weighted round-robin.
 *
 * @param {string} institution_id
 * @param {string|null} course
 * @param {string|null} city
 * @returns {Promise<string|null>} user_id or null (manual / no config)
 */
async function getAutoAssignee(institution_id, course, city) {
  const config = await prisma.assignmentConfig.findUnique({ where: { institution_id } });
  if (!config || config.mode !== 'AUTOMATIC') return null;

  // --- Rule-based assignment (priority desc) ---
  const rules = await prisma.assignmentRule.findMany({
    where: { institution_id },
    orderBy: { priority: 'desc' },
    include: { assignee: { select: { id: true, is_active: true } } },
  });

  for (const rule of rules) {
    if (!rule.assignee?.is_active) continue;
    if (rule.rule_type === 'COURSE' && course) {
      if (course.toLowerCase().includes(rule.match_value.toLowerCase())) return rule.assigned_to;
    }
    if (rule.rule_type === 'CITY' && city) {
      if (city.toLowerCase() === rule.match_value.toLowerCase()) return rule.assigned_to;
    }
  }

  // --- Weighted round-robin ---
  let counsellors;
  try { counsellors = JSON.parse(config.counsellors || '[]'); } catch { counsellors = []; }
  if (!counsellors.length) return null;

  const userId = pickNextCounsellor(counsellors);
  if (!userId) return null;

  // Persist updated remaining counts
  await prisma.assignmentConfig.update({
    where: { institution_id },
    data: { counsellors: JSON.stringify(counsellors) },
  });

  return userId;
}

/**
 * Simulate the NEXT assignee without persisting (used for preview).
 */
async function previewNextAssignee(institution_id) {
  const config = await prisma.assignmentConfig.findUnique({ where: { institution_id } });
  if (!config || config.mode !== 'AUTOMATIC') return null;

  let counsellors;
  try { counsellors = JSON.parse(config.counsellors || '[]'); } catch { counsellors = []; }
  const cloned = JSON.parse(JSON.stringify(counsellors));
  const userId = pickNextCounsellor(cloned);
  return userId;
}

module.exports = { getAutoAssignee, previewNextAssignee, pickNextCounsellor };
