const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { applyScoreDecay } = require('./scoringService');
const { sendReminder } = require('./paymentService');
const notificationService = require('./notificationService');

// Daily at midnight: apply score decay to stale leads
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running score decay...');
  try {
    await applyScoreDecay();
    console.log('[Cron] Score decay complete');
  } catch (err) {
    console.error('[Cron] Score decay error:', err.message);
  }
});

// Daily at 9am: payment reminders for overdue and due-in-2-days
cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Running payment reminders...');
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Overdue payments
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        due_date: { lt: now },
      },
    });

    // Due in 2 days
    const upcomingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        due_date: {
          gte: now,
          lte: twoDaysFromNow,
        },
      },
    });

    const allReminders = [...overduePayments, ...upcomingPayments];
    console.log(`[Cron] Sending ${allReminders.length} payment reminders`);

    for (const payment of allReminders) {
      try {
        await sendReminder(payment.id, payment.institution_id, 'WHATSAPP');
      } catch (e) {
        console.warn(`[Cron] Reminder failed for payment ${payment.id}:`, e.message);
      }
    }
  } catch (err) {
    console.error('[Cron] Payment reminder error:', err.message);
  }
});

// Daily at 8am: push notifications for overdue tasks
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running overdue task notifications...');
  try {
    const now = new Date();
    const overdueTasks = await prisma.task.findMany({
      where: {
        is_completed: false,
        due_at: { lt: now },
      },
      include: { lead: true },
    });

    console.log(`[Cron] ${overdueTasks.length} overdue tasks`);
    for (const task of overdueTasks) {
      try {
        await notificationService.sendPush(
          task.assigned_to,
          'Overdue Task',
          `Task "${task.title}" for ${task.lead.name} is overdue!`,
          { task_id: task.id, lead_id: task.lead_id }
        );
      } catch (e) {
        console.warn(`[Cron] Push failed for task ${task.id}:`, e.message);
      }
    }
  } catch (err) {
    console.error('[Cron] Overdue task notification error:', err.message);
  }
});

console.log('[Cron] Jobs scheduled: score decay, payment reminders, overdue tasks');

module.exports = {};
