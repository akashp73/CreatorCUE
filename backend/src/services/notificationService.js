const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

/**
 * Send push notification via Expo push service.
 * Fails silently on error.
 */
const sendPush = async (user_id, title, body, data = {}) => {
  try {
    const deviceToken = await prisma.deviceToken.findFirst({
      where: { user_id },
    });

    if (!deviceToken) {
      console.log(`[Push] No device token for user ${user_id}`);
      return;
    }

    const payload = {
      to: deviceToken.token,
      title,
      body,
      data,
      sound: 'default',
    };

    await axios.post('https://exp.host/--/api/v2/push/send', payload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    console.log(`[Push] Sent to user ${user_id}: ${title}`);
  } catch (err) {
    console.warn(`[Push] Failed to send push notification to user ${user_id}:`, err.message);
    // Fail silently
  }
};

module.exports = { sendPush };
